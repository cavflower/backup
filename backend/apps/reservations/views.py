from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
import hashlib

from .models import Reservation, ReservationChangeLog, StoreReservationSettings, TimeSlot
from .serializers import (
    ReservationSerializer,
    ReservationCreateSerializer,
    ReservationUpdateSerializer,
    ReservationCancelSerializer,
    GuestReservationVerifySerializer,
    ReservationChangeLogSerializer,
    StoreReservationSettingsSerializer,
    TimeSlotSerializer,
    MerchantReservationSerializer,
    MerchantReservationUpdateSerializer,
)


class ReservationViewSet(viewsets.ModelViewSet):
    """
    訂位 ViewSet - 顧客端
    
    提供訂位的 CRUD 操作
    - 會員和訪客都可以建立訂位
    - 會員可以查看自己的所有訂位
    - 訪客透過手機號碼驗證查看訂位
    """
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.AllowAny]  # 允許訪客訂位
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ReservationUpdateSerializer
        return ReservationSerializer
    
    def get_queryset(self):
        """
        會員：返回自己的訂位
        訪客：返回所有訂位（但會在 action 中驗證）
        """
        user = self.request.user
        
        if user.is_authenticated:
            # 會員查看自己的訂位
            return Reservation.objects.filter(user=user)
        
        # 訪客也可以訪問訂位（會在各個 action 中驗證手機號碼）
        return Reservation.objects.all()
    
    def create(self, request, *args, **kwargs):
        """建立訂位"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save()
        
        # 返回完整訂位資訊
        response_serializer = ReservationSerializer(reservation)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """更新訂位 - 僅允許修改部分欄位"""
        instance = self.get_object()
        
        # 檢查是否可編輯
        if not instance.can_edit:
            return Response(
                {'error': '此訂位狀態無法編輯'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 訪客訂位需驗證
        if instance.is_guest_reservation and not self._verify_guest_access(instance, request):
            return Response(
                {'error': '無權限修改此訂位'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(ReservationSerializer(instance).data)
    
    @action(detail=False, methods=['post'], url_path='verify-guest')
    def verify_guest(self, request):
        """
        訪客驗證 - 透過手機號碼查詢訂位
        
        POST /api/reservations/verify-guest/
        Body: {"phone_number": "0912345678"}
        """
        serializer = GuestReservationVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone_number = serializer.validated_data['phone_number']
        phone_hash = hashlib.sha256(phone_number.encode()).hexdigest()
        
        # 查詢訪客的訂位（最近 30 天內）
        from datetime import timedelta
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        
        reservations = Reservation.objects.filter(
            phone_hash=phone_hash,
            user__isnull=True,  # 僅訪客訂位
            reservation_date__gte=thirty_days_ago
        ).order_by('-created_at')
        
        if not reservations.exists():
            return Response(
                {'error': '找不到訂位記錄，請確認手機號碼是否正確'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 生成臨時 token（實際應用應使用 JWT 或 session）
        token_data = {
            'phone_hash': phone_hash,
            'token': hashlib.sha256(f"{phone_hash}{timezone.now().timestamp()}".encode()).hexdigest()[:32],
            'expires_at': (timezone.now() + timedelta(hours=24)).isoformat(),
        }
        
        # 返回訂位列表和 token
        serializer = ReservationSerializer(reservations, many=True)
        return Response({
            'token': token_data,
            'reservations': serializer.data,
            'count': reservations.count()
        })
    
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_reservation(self, request, pk=None):
        """
        取消訂位
        
        POST /api/reservations/{id}/cancel/
        Body: {"cancel_reason": "行程變更"}
        """
        instance = self.get_object()
        
        # 檢查是否可取消
        if not instance.can_cancel:
            return Response(
                {'error': '此訂位狀態無法取消'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 訪客訂位需驗證
        if instance.is_guest_reservation and not self._verify_guest_access(instance, request):
            return Response(
                {'error': '無權限取消此訂位'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ReservationCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 更新狀態
        instance.status = 'cancelled'
        instance.cancelled_at = timezone.now()
        instance.cancelled_by = 'customer'
        instance.cancel_reason = serializer.validated_data.get('cancel_reason', '')  # 使用 get 並設定預設值
        instance.save()
        
        # 記錄變更
        ReservationChangeLog.objects.create(
            reservation=instance,
            changed_by='customer',
            change_type='cancelled',
            old_values={'status': 'confirmed'},
            new_values={'status': 'cancelled', 'cancel_reason': instance.cancel_reason},
            note='顧客取消訂位'
        )
        
        return Response(ReservationSerializer(instance).data)
    
    @action(detail=True, methods=['get'], url_path='change-logs')
    def change_logs(self, request, pk=None):
        """查看訂位變更記錄"""
        instance = self.get_object()
        logs = instance.change_logs.all()
        serializer = ReservationChangeLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    def _verify_guest_access(self, reservation, request):
        """驗證訪客是否有權限存取此訂位"""
        # 從 request 中取得 phone_number 或 token
        phone_number = request.data.get('phone_number') or request.query_params.get('phone_number')
        
        if not phone_number:
            return False
        
        phone_hash = hashlib.sha256(phone_number.encode()).hexdigest()
        return reservation.phone_hash == phone_hash


class MerchantReservationViewSet(viewsets.ModelViewSet):
    """
    商家端訂位管理 ViewSet
    
    商家可以：
    - 查看自己店家的所有訂位
    - 確認/取消訂位
    - 更改訂位狀態
    """
    queryset = Reservation.objects.all()
    serializer_class = MerchantReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """僅返回商家自己店家的訂位"""
        user = self.request.user
        
        # 確認用戶是商家
        if not hasattr(user, 'merchant_profile'):
            return Reservation.objects.none()
        
        # 取得商家的店家
        try:
            store = user.merchant_profile.store
            return Reservation.objects.filter(store=store)
        except:
            return Reservation.objects.none()
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update', 'update_status']:
            return MerchantReservationUpdateSerializer
        return MerchantReservationSerializer
    
    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        """
        更新訂位狀態
        
        POST /api/merchant/reservations/{id}/update-status/
        Body: {"status": "confirmed"}
        """
        instance = self.get_object()
        serializer = MerchantReservationUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(MerchantReservationSerializer(instance).data)
    
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_reservation(self, request, pk=None):
        """
        商家取消訂位
        
        POST /api/merchant/reservations/{id}/cancel/
        Body: {"cancel_reason": "客滿"}
        """
        instance = self.get_object()
        
        if not instance.can_cancel:
            return Response(
                {'error': '此訂位狀態無法取消'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ReservationCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        instance.status = 'cancelled'
        instance.cancelled_at = timezone.now()
        instance.cancelled_by = 'merchant'
        instance.cancel_reason = serializer.validated_data.get('cancel_reason', '')  # 使用 get 並設定預設值
        instance.save()
        
        # 記錄變更
        ReservationChangeLog.objects.create(
            reservation=instance,
            changed_by='merchant',
            change_type='cancelled',
            old_values={'status': instance.status},
            new_values={'status': 'cancelled', 'cancel_reason': instance.cancel_reason},
            note='商家取消訂位'
        )
        
        return Response(MerchantReservationSerializer(instance).data)
    
    def destroy(self, request, *args, **kwargs):
        """
        刪除訂位記錄（僅限商家）
        
        DELETE /api/merchant/reservations/{id}/
        """
        instance = self.get_object()
        
        # 記錄刪除前的資訊
        reservation_number = instance.reservation_number
        
        # 記錄刪除操作到變更日誌
        ReservationChangeLog.objects.create(
            reservation=instance,
            changed_by='merchant',
            change_type='deleted',
            old_values={
                'reservation_number': reservation_number,
                'status': instance.status,
                'customer_name': instance.customer_name,
                'reservation_date': instance.reservation_date.isoformat(),
                'time_slot': instance.time_slot,
            },
            new_values={},
            note='商家刪除訂位記錄'
        )
        
        # 執行刪除
        instance.delete()
        
        return Response(
            {'message': f'訂位 {reservation_number} 已刪除'},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=False, methods=['get'], url_path='stats')
    def statistics(self, request):
        """訂位統計資訊"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'confirmed': queryset.filter(status='confirmed').count(),
            'completed': queryset.filter(status='completed').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
            'no_show': queryset.filter(status='no_show').count(),
        }
        
        return Response(stats)


class StoreReservationSettingsViewSet(viewsets.ModelViewSet):
    """店家訂位設定 ViewSet"""
    queryset = StoreReservationSettings.objects.all()
    serializer_class = StoreReservationSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """僅返回商家自己店家的設定"""
        user = self.request.user
        
        if not hasattr(user, 'merchant_profile'):
            return StoreReservationSettings.objects.none()
        
        try:
            store = user.merchant_profile.store
            return StoreReservationSettings.objects.filter(store=store)
        except:
            return StoreReservationSettings.objects.none()


class TimeSlotViewSet(viewsets.ModelViewSet):
    """訂位時段 ViewSet"""
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """僅返回商家自己店家的時段"""
        user = self.request.user
        
        if not hasattr(user, 'merchant_profile'):
            return TimeSlot.objects.none()
        
        try:
            store = user.merchant_profile.store
            return TimeSlot.objects.filter(store=store)
        except:
            return TimeSlot.objects.none()
    
    def perform_create(self, serializer):
        """新增時段時自動設定 store"""
        user = self.request.user
        
        if not hasattr(user, 'merchant_profile'):
            raise permissions.PermissionDenied("您沒有商家權限")
        
        try:
            store = user.merchant_profile.store
            serializer.save(store=store)
        except Exception as e:
            raise permissions.PermissionDenied(f"無法取得店家資訊: {str(e)}")


class PublicTimeSlotViewSet(viewsets.ReadOnlyModelViewSet):
    """公開的訂位時段查詢 ViewSet（供顧客查詢用）"""
    queryset = TimeSlot.objects.filter(is_active=True)
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """根據 store_id 篩選時段"""
        queryset = TimeSlot.objects.filter(is_active=True)
        store_id = self.request.query_params.get('store_id', None)
        
        if store_id and store_id != 'undefined':
            try:
                queryset = queryset.filter(store_id=int(store_id))
            except (ValueError, TypeError):
                # 如果 store_id 無效，返回空查詢集
                return TimeSlot.objects.none()
        
        return queryset.order_by('day_of_week', 'start_time')
