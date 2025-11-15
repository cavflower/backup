from rest_framework import serializers
from .models import Reservation, ReservationChangeLog, StoreReservationSettings, TimeSlot
from apps.stores.models import Store
from apps.users.models import User


class ReservationSerializer(serializers.ModelSerializer):
    """訂位序列化器 - 完整資訊"""
    store_name = serializers.CharField(source='store.name', read_only=True)
    store_address = serializers.CharField(source='store.address', read_only=True)
    store_phone = serializers.CharField(source='store.phone', read_only=True)
    is_guest_reservation = serializers.BooleanField(read_only=True)
    can_edit = serializers.BooleanField(read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id',
            'reservation_number',
            'store',
            'store_name',
            'store_address',
            'store_phone',
            'user',
            'customer_name',
            'customer_phone',
            'customer_email',
            'customer_gender',
            'reservation_date',
            'time_slot',
            'party_size',
            'children_count',
            'special_requests',
            'status',
            'cancelled_at',
            'cancelled_by',
            'cancel_reason',
            'created_at',
            'updated_at',
            'confirmed_at',
            'is_guest_reservation',
            'can_edit',
            'can_cancel',
        ]
        read_only_fields = [
            'id',
            'reservation_number',
            'cancelled_at',
            'created_at',
            'updated_at',
            'confirmed_at',
        ]


class ReservationCreateSerializer(serializers.ModelSerializer):
    """建立訂位序列化器"""
    
    class Meta:
        model = Reservation
        fields = [
            'store',
            'customer_name',
            'customer_phone',
            'customer_email',
            'customer_gender',
            'reservation_date',
            'time_slot',
            'party_size',
            'children_count',
            'special_requests',
        ]
    
    def validate(self, data):
        """驗證訂位資料"""
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        # 驗證日期不能是過去
        if data['reservation_date'] < timezone.now().date():
            raise serializers.ValidationError({
                'reservation_date': '訂位日期不能是過去的日期'
            })
        
        # 驗證人數
        if data['party_size'] < 1:
            raise serializers.ValidationError({
                'party_size': '訂位人數至少為 1 人'
            })
        
        # 驗證時段格式
        time_slot = data.get('time_slot', '')
        if not time_slot or '-' not in time_slot:
            raise serializers.ValidationError({
                'time_slot': '時段格式錯誤，應為 HH:MM-HH:MM'
            })
        
        return data
    
    def create(self, validated_data):
        """建立訂位"""
        request = self.context.get('request')
        
        # 如果是已登入會員，自動關聯 user
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
            # 如果會員沒有填寫姓名/手機，使用會員資料
            if not validated_data.get('customer_name'):
                validated_data['customer_name'] = request.user.username
            if not validated_data.get('customer_phone'):
                validated_data['customer_phone'] = request.user.phone_number
        
        reservation = Reservation.objects.create(**validated_data)
        
        # 準備用於日誌的資料（將物件轉換為可序列化的格式）
        from datetime import date, datetime
        log_data = {}
        for key, value in validated_data.items():
            if hasattr(value, 'pk'):  # 如果是模型物件，只記錄 ID
                log_data[key] = value.pk
            elif isinstance(value, (date, datetime)):  # 日期/時間物件轉為字串
                log_data[key] = value.isoformat()
            elif value is None or isinstance(value, (str, int, float, bool)):  # 基本類型
                log_data[key] = value
            else:  # 其他類型轉為字串
                log_data[key] = str(value)
        
        # 記錄變更日誌
        ReservationChangeLog.objects.create(
            reservation=reservation,
            changed_by='customer',
            change_type='created',
            new_values=log_data,
            note='訂位建立'
        )
        
        return reservation


class ReservationUpdateSerializer(serializers.ModelSerializer):
    """更新訂位序列化器 - 僅允許修改部分欄位"""
    
    class Meta:
        model = Reservation
        fields = [
            'time_slot',
            'party_size',
            'children_count',
            'special_requests',
        ]
    
    def update(self, instance, validated_data):
        """更新訂位"""
        # 記錄舊值
        old_values = {
            'time_slot': instance.time_slot,
            'party_size': instance.party_size,
            'children_count': instance.children_count,
            'special_requests': instance.special_requests,
        }
        
        # 準備新值（將物件轉換為可序列化的格式）
        from datetime import date, datetime
        new_values = {}
        for key, value in validated_data.items():
            if hasattr(value, 'pk'):  # 如果是模型物件，只記錄 ID
                new_values[key] = value.pk
            elif isinstance(value, (date, datetime)):  # 日期/時間物件轉為字串
                new_values[key] = value.isoformat()
            elif value is None or isinstance(value, (str, int, float, bool)):  # 基本類型
                new_values[key] = value
            else:  # 其他類型轉為字串
                new_values[key] = str(value)
        
        # 更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 記錄變更日誌
        request = self.context.get('request')
        changed_by = 'customer' if request and request.user.is_authenticated else 'guest'
        
        ReservationChangeLog.objects.create(
            reservation=instance,
            changed_by=changed_by,
            change_type='updated',
            old_values=old_values,
            new_values=new_values,
            note='訂位資訊更新'
        )
        
        return instance


class ReservationCancelSerializer(serializers.Serializer):
    """取消訂位序列化器"""
    cancel_reason = serializers.CharField(
        required=False,  # 改為非必填
        max_length=500,
        allow_blank=True,
        default=''
    )
    cancelled_by = serializers.ChoiceField(
        choices=['customer', 'merchant'],
        required=False  # 改為選填，由後端根據請求來源判斷
    )


class GuestReservationVerifySerializer(serializers.Serializer):
    """訪客訂位驗證序列化器"""
    phone_number = serializers.CharField(
        required=True,
        max_length=20,
        error_messages={'required': '請輸入手機號碼'}
    )
    
    def validate_phone_number(self, value):
        """驗證手機號碼格式"""
        import re
        # 台灣手機號碼格式: 09 開頭，10 碼
        pattern = r'^09\d{8}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError('手機號碼格式錯誤，應為 09XXXXXXXX')
        return value


class ReservationChangeLogSerializer(serializers.ModelSerializer):
    """訂位變更記錄序列化器"""
    
    class Meta:
        model = ReservationChangeLog
        fields = [
            'id',
            'change_type',
            'changed_by',
            'old_values',
            'new_values',
            'note',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class StoreReservationSettingsSerializer(serializers.ModelSerializer):
    """店家訂位設定序列化器"""
    
    class Meta:
        model = StoreReservationSettings
        fields = '__all__'
        read_only_fields = ['store', 'created_at', 'updated_at']


class TimeSlotSerializer(serializers.ModelSerializer):
    """訂位時段序列化器"""
    
    class Meta:
        model = TimeSlot
        fields = [
            'id',
            'store',
            'day_of_week',
            'start_time',
            'end_time',
            'max_capacity',
            'max_party_size',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'store', 'created_at', 'updated_at']
    
    def validate(self, data):
        """驗證時段時間"""
        if data.get('start_time') and data.get('end_time'):
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError({
                    'end_time': '結束時間必須晚於開始時間'
                })
        
        if data.get('max_capacity') and data.get('max_capacity') < 1:
            raise serializers.ValidationError({
                'max_capacity': '人數上限必須大於 0'
            })
        
        return data


class MerchantReservationSerializer(serializers.ModelSerializer):
    """商家端訂位序列化器 - 包含更多管理資訊"""
    store_name = serializers.CharField(source='store.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True, allow_null=True)
    is_guest_reservation = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id',
            'reservation_number',
            'store',
            'store_name',
            'user',
            'user_email',
            'customer_name',
            'customer_phone',
            'customer_email',
            'customer_gender',
            'reservation_date',
            'time_slot',
            'party_size',
            'children_count',
            'special_requests',
            'status',
            'cancelled_at',
            'cancelled_by',
            'cancel_reason',
            'created_at',
            'updated_at',
            'confirmed_at',
            'is_guest_reservation',
        ]
        read_only_fields = ['id', 'reservation_number', 'created_at', 'updated_at']


class MerchantReservationUpdateSerializer(serializers.ModelSerializer):
    """商家更新訂位狀態序列化器"""
    
    class Meta:
        model = Reservation
        fields = ['status', 'confirmed_at']
    
    def update(self, instance, validated_data):
        """更新訂位狀態"""
        from django.utils import timezone
        
        old_status = instance.status
        new_status = validated_data.get('status', instance.status)
        
        # 如果狀態變更為已確認，記錄確認時間
        if new_status == 'confirmed' and old_status != 'confirmed':
            validated_data['confirmed_at'] = timezone.now()
        
        # 更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 記錄變更日誌
        ReservationChangeLog.objects.create(
            reservation=instance,
            changed_by='merchant',
            change_type='updated',
            old_values={'status': old_status},
            new_values={'status': new_status},
            note=f'狀態變更: {old_status} -> {new_status}'
        )
        
        return instance
