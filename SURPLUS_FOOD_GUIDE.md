# 惜福食品功能說明文件

## 📋 功能概述

惜福食品管理系統是 DineVerse 平台的環保功能模組，協助商家減少食物浪費並創造額外收益。

### 主要功能

1. **惜福時段設定** - 設定特定時段的優惠折扣
2. **惜福品管理** - 新增、編輯即期或剩餘食材
3. **上架/下架管理** - 靈活控制商品販售狀態
4. **訂單管理** - 處理惜福食品訂單
5. **統計分析** - 查看銷售數據和環保成效

---

## 🚀 安裝步驟

### 後端設定

1. **執行資料庫遷移**
```powershell
cd backend
.\.venv\Scripts\python.exe manage.py makemigrations surplus_food
.\.venv\Scripts\python.exe manage.py migrate
```

2. **確認設定已更新**
- ✅ `INSTALLED_APPS` 已包含 `'apps.surplus_food'`
- ✅ URL 路由已配置

3. **創建超級使用者（如果還沒有）**
```powershell
.\.venv\Scripts\python.exe manage.py createsuperuser
```

### 前端設定

前端代碼已經完成，無需額外安裝。

---

## 📱 使用指南

### 3.12.1 設定惜福時段

1. 進入商家儀表板，點擊「惜福品」卡片
2. 切換到「惜福時段」標籤
3. 點擊「新增時段」
4. 填寫以下資訊：
   - 時段名稱（例如：午餐惜福、晚餐惜福）
   - 星期（選擇適用的星期）
   - 開始時間和結束時間
   - 折扣百分比（例如：30 代表 7折）
5. 點擊儲存

**範例設定：**
- 名稱：晚餐惜福時段
- 星期：每週一到週五
- 時間：18:00 - 20:00
- 折扣：30% off（7折）

### 3.12.2 設定惜福品資料

1. 在「惜福食品」標籤中，點擊「新增惜福品」
2. 填寫商品資訊：
   - **基本資訊**
     - 標題：商品名稱
     - 描述：詳細說明
     - 商品圖片：上傳照片
   
   - **價格設定**
     - 原價：原始售價
     - 惜福價：優惠售價（必須低於原價）
   
   - **庫存管理**
     - 可售數量：總數量
   
   - **商品狀況**
     - 選擇：即期品、剩餘品、外包裝損傷、當日剩餘
     - 到期日：如果是即期品必填
   
   - **販售時間**
     - 開始販售時間
     - 結束販售時間
     - 關聯惜福時段（可選）
   
   - **其他資訊**
     - 取餐說明
     - 標籤（例如：素食、無麩質）

3. 點擊「儲存」，商品會以「草稿」狀態建立

### 3.12.3 編輯惜福品資料

1. 在惜福食品列表中找到要編輯的商品
2. 點擊「編輯」圖示（鉛筆圖示）
3. 修改需要變更的欄位
4. 點擊「儲存」

**快速操作：**
- 🔄 **複製商品**：點擊「複製」圖示可快速建立相似商品
- 📊 **查看統計**：查看瀏覽次數和訂購次數

### 3.12.4 上架惜福品

1. 確認商品資訊填寫完整
2. 確認庫存數量大於 0
3. 點擊「上架」圖示（眼睛圖示）
4. 系統會驗證：
   - ✅ 商品資訊完整
   - ✅ 有可售庫存
   - ✅ 惜福價低於原價
5. 上架成功後，狀態變為「上架中」
6. 顧客端即可瀏覽和訂購

### 3.12.5 下架惜福品

1. 找到已上架的商品
2. 點擊「下架」圖示（關閉眼睛圖示）
3. 商品狀態變為「已下架」
4. 顧客端將無法看到此商品

**自動下架情況：**
- 販售時間已過期
- 庫存已售完
- 商家手動下架

---

## 🎯 訂單管理

### 訂單狀態流程

```
待確認 → 已確認 → 可取餐 → 已完成
   ↓
已取消
```

### 處理訂單

1. 切換到「訂單管理」標籤
2. 查看訂單列表
3. 根據訂單狀態執行動作：
   - **待確認**：點擊「確認訂單」
   - **已確認**：點擊「可取餐」（商品準備好時）
   - **可取餐**：點擊「完成」（顧客取餐後）
   - **可取消**：點擊「取消」（會自動恢復庫存）

---

## 📊 統計分析

切換到「統計分析」標籤可查看：

- 總商品數
- 上架中商品數量
- 已售完商品數量
- 總瀏覽次數
- 總訂購次數

**環保成效指標：**
- 計算減少的食物浪費量
- 追蹤環保貢獻數據

---

## 🔧 API 端點

### 商家端 API

#### 惜福時段
- `GET /api/merchant/surplus/time-slots/` - 獲取時段列表
- `POST /api/merchant/surplus/time-slots/` - 創建時段
- `PUT /api/merchant/surplus/time-slots/{id}/` - 更新時段
- `DELETE /api/merchant/surplus/time-slots/{id}/` - 刪除時段

#### 惜福食品
- `GET /api/merchant/surplus/foods/` - 獲取商品列表
- `POST /api/merchant/surplus/foods/` - 創建商品
- `GET /api/merchant/surplus/foods/{id}/` - 獲取商品詳情
- `PUT /api/merchant/surplus/foods/{id}/` - 更新商品
- `DELETE /api/merchant/surplus/foods/{id}/` - 刪除商品
- `POST /api/merchant/surplus/foods/{id}/publish/` - 上架商品
- `POST /api/merchant/surplus/foods/{id}/unpublish/` - 下架商品
- `POST /api/merchant/surplus/foods/{id}/duplicate/` - 複製商品
- `GET /api/merchant/surplus/foods/statistics/` - 獲取統計資料

#### 訂單管理
- `GET /api/merchant/surplus/orders/` - 獲取訂單列表
- `POST /api/merchant/surplus/orders/{id}/confirm/` - 確認訂單
- `POST /api/merchant/surplus/orders/{id}/ready/` - 標記可取餐
- `POST /api/merchant/surplus/orders/{id}/complete/` - 完成訂單
- `POST /api/merchant/surplus/orders/{id}/cancel/` - 取消訂單

### 顧客端 API（公開）

- `GET /api/surplus/foods/` - 瀏覽惜福食品列表
- `GET /api/surplus/foods/{id}/` - 查看商品詳情

---

## 💡 最佳實踐

### 時段設定建議

1. **午餐時段**（11:30-13:30）
   - 適合早餐剩餘品
   - 折扣：20-30%

2. **晚餐時段**（18:00-20:00）
   - 適合午餐剩餘品
   - 折扣：30-40%

3. **閉店前**（21:00-22:00）
   - 適合當日剩餘
   - 折扣：40-50%

### 商品命名建議

- ✅ 好的命名：「【惜福】招牌便當（原價150）」
- ✅ 好的命名：「即期麵包組合包 5入」
- ❌ 避免：「便當」（太籠統）

### 圖片建議

- 使用真實商品照片
- 清晰展示商品內容
- 標註即期日期（如適用）

---

## 🐛 常見問題

### Q1: 為什麼無法上架？
**A:** 檢查以下項目：
- 商品資訊是否完整
- 惜福價是否低於原價
- 庫存數量是否大於 0
- 販售時間是否設定正確

### Q2: 訂單取消後庫存會恢復嗎？
**A:** 會的，系統會自動恢復庫存數量。

### Q3: 可以同時設定多個時段嗎？
**A:** 可以，系統支援多個時段並行。

### Q4: 惜福品會自動下架嗎？
**A:** 會的，以下情況會自動下架：
- 超過販售結束時間
- 庫存售完

---

## 🎨 資料模型

### SurplusTimeSlot（惜福時段）
- store: 店家
- name: 時段名稱
- day_of_week: 星期
- start_time: 開始時間
- end_time: 結束時間
- discount_percent: 折扣百分比
- is_active: 啟用狀態

### SurplusFood（惜福食品）
- store: 店家
- product: 關聯商品（可選）
- title: 商品名稱
- description: 描述
- original_price: 原價
- surplus_price: 惜福價
- quantity: 總數量
- remaining_quantity: 剩餘數量
- condition: 商品狀況（即期、剩餘、損傷、當日剩餘）
- expiry_date: 到期日
- available_from: 開始販售時間
- available_until: 結束販售時間
- time_slot: 關聯時段
- status: 狀態（草稿、上架中、已下架、已售完、已過期）

### SurplusFoodOrder（惜福訂單）
- order_number: 訂單編號
- store: 店家
- surplus_food: 惜福商品
- customer_name: 顧客姓名
- customer_phone: 顧客電話
- quantity: 數量
- total_price: 總價
- payment_method: 付款方式
- status: 訂單狀態
- pickup_time: 取餐時間

---

## 🔄 更新日誌

### Version 1.0.0 (2024-11-29)
- ✅ 初始版本發布
- ✅ 惜福時段管理
- ✅ 惜福食品 CRUD
- ✅ 上架/下架功能
- ✅ 訂單管理系統
- ✅ 統計分析功能

---

## 📞 技術支援

如有問題，請聯繫開發團隊或參考主要 README.md 文件。
