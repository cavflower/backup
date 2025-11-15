import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaClock, 
  FaUtensils, 
  FaCheckCircle,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa';
import './ReservationPage.css';

const ReservationPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 訂位步驟狀態
  const [currentStep, setCurrentStep] = useState(1);
  const [reservationData, setReservationData] = useState({
    date: '',
    partySize: 2,
    childrenCount: 0,
    timeSlot: '',
    guestInfo: {
      name: '',
      gender: 'female',
      phone: '',
      email: '',
    },
    specialRequests: '',
    preOrder: false,
    preOrderItems: [],
  });

  // 步驟定義：1.選擇訂位資訊 2.填寫資料(僅訪客) 3.預先點餐 4.確認訂位
  const totalSteps = user ? 3 : 4; // 會員3步驟，訪客4步驟

  // 可用時段（模擬數據）
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  
  useEffect(() => {
    // 生成未來7天的日期
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    setAvailableDates(dates);
  }, []);

  useEffect(() => {
    if (reservationData.date) {
      fetchAvailableTimeSlots(reservationData.date);
    }
  }, [reservationData.date]);

  const fetchAvailableTimeSlots = (date) => {
    // TODO: 替換為實際 API 調用
    // 模擬時段數據
    const slots = [
      { id: 1, time: '11:30-13:30', available: true, capacity: 10 },
      { id: 2, time: '13:30-15:30', available: true, capacity: 8 },
      { id: 3, time: '17:30-19:30', available: true, capacity: 15 },
      { id: 4, time: '19:30-21:30', available: false, capacity: 0 },
    ];
    setAvailableTimeSlots(slots);
  };

  const handleDateSelect = (date) => {
    setReservationData({ ...reservationData, date });
  };

  const handlePartySizeChange = (size) => {
    setReservationData({ ...reservationData, partySize: size });
  };

  const handleChildrenCountChange = (count) => {
    setReservationData({ ...reservationData, childrenCount: count });
  };

  const handleTimeSlotSelect = (slot) => {
    setReservationData({ ...reservationData, timeSlot: slot.time });
  };

  const handleGuestInfoChange = (e) => {
    const { name, value } = e.target;
    setReservationData({
      ...reservationData,
      guestInfo: {
        ...reservationData.guestInfo,
        [name]: value,
      },
    });
  };

  const handleNextStep = () => {
    // 驗證步驟1：選擇訂位資訊
    if (currentStep === 1) {
      if (!reservationData.date) {
        alert('請選擇訂位日期');
        return;
      }
      if (!reservationData.partySize) {
        alert('請選擇用餐人數');
        return;
      }
      if (!reservationData.timeSlot) {
        alert('請選擇訂位時段');
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmitReservation = async () => {
    try {
      // TODO: 替換為實際 API 調用
      const reservationPayload = {
        ...reservationData,
        customer: user ? user.id : null,
        store_id: storeId,
      };
      
      console.log('提交訂位:', reservationPayload);
      
      // 模擬 API 調用
      setTimeout(() => {
        alert('訂位成功！');
        navigate('/reservation/success');
      }, 1000);
    } catch (error) {
      console.error('訂位失敗:', error);
      alert('訂位失敗，請稍後再試。');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric', weekday: 'short' };
    return date.toLocaleDateString('zh-TW', options);
  };

  const getStepTitle = () => {
    if (user) {
      const titles = {
        1: '選擇訂位資訊',
        2: '預先點餐（可選）',
        3: '確認訂位',
      };
      return titles[currentStep];
    } else {
      const titles = {
        1: '選擇訂位資訊',
        2: '填寫訂位資料',
        3: '預先點餐（可選）',
        4: '確認訂位',
      };
      return titles[currentStep];
    }
  };

  return (
    <div className="reservation-page">
      <div className="reservation-container">
        {/* 進度條 */}
        <div className="progress-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <FaArrowLeft /> 返回
          </button>
          <h1>{getStepTitle()}</h1>
          <div className="step-indicator">
            步驟 {currentStep} / {totalSteps}
          </div>
        </div>

        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* 步驟內容 */}
        <div className="step-content">
          {/* 步驟 1: 選擇訂位資訊（日期+人數+時段） */}
          {currentStep === 1 && (
            <div className="reservation-info-selection">
              {/* 日期選擇 */}
              <div className="section-block">
                <h3 className="section-title">用餐日期</h3>
                <div className="date-selector">
                  <select
                    className="custom-select"
                    value={reservationData.date}
                    onChange={(e) => handleDateSelect(e.target.value)}
                  >
                    <option value="">請選擇日期</option>
                    {availableDates.map((date) => (
                      <option key={date} value={date}>
                        {formatDate(date)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 人數選擇 */}
              <div className="section-block">
                <h3 className="section-title">用餐人數</h3>
                <div className="party-size-row">
                  <div className="party-size-item">
                    <label className="select-label">大人</label>
                    <select
                      className="custom-select"
                      value={reservationData.partySize}
                      onChange={(e) => handlePartySizeChange(parseInt(e.target.value))}
                    >
                      {[...Array(20)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} 位大人
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="party-size-item">
                    <label className="select-label">小孩</label>
                    <select
                      className="custom-select"
                      value={reservationData.childrenCount}
                      onChange={(e) => handleChildrenCountChange(parseInt(e.target.value))}
                    >
                      {[...Array(11)].map((_, i) => (
                        <option key={i} value={i}>
                          {i} 位小孩
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <small className="form-hint">
                  可接受 1-7 位訂位（含大人與小孩）
                </small>
              </div>

              {/* 時段選擇 */}
              {reservationData.date && (
                <div className="section-block">
                  <h3 className="section-title">訂位時段</h3>
                  <div className="time-slot-compact">
                    {availableTimeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        className={`time-slot-btn ${
                          reservationData.timeSlot === slot.time ? 'selected' : ''
                        } ${!slot.available ? 'disabled' : ''}`}
                        onClick={() => slot.available && handleTimeSlotSelect(slot)}
                        disabled={!slot.available}
                      >
                        <div className="slot-time">{slot.time}</div>
                        {slot.available ? (
                          <div className="slot-status available">可訂</div>
                        ) : (
                          <div className="slot-status full">已滿</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 步驟 2: 填寫資料（僅訪客） */}
          {currentStep === 2 && !user && (
            <div className="guest-info-form">
              <div className="form-notice">
                <p>請填寫您的聯絡資訊，以便我們確認訂位</p>
              </div>
              
              {/* 姓名與性別 */}
              <div className="form-row-inline">
                <div className="form-group flex-grow">
                  <label>訂位人姓名 *</label>
                  <input
                    type="text"
                    name="name"
                    value={reservationData.guestInfo.name}
                    onChange={handleGuestInfoChange}
                    placeholder="請輸入您的姓名"
                    required
                  />
                </div>
                <div className="form-group gender-group">
                  <label>&nbsp;</label>
                  <div className="gender-options">
                    <label className="gender-option">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={reservationData.guestInfo.gender === 'female'}
                        onChange={handleGuestInfoChange}
                      />
                      <span className="gender-label">小姐</span>
                    </label>
                    <label className="gender-option">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={reservationData.guestInfo.gender === 'male'}
                        onChange={handleGuestInfoChange}
                      />
                      <span className="gender-label">先生</span>
                    </label>
                    <label className="gender-option">
                      <input
                        type="radio"
                        name="gender"
                        value="other"
                        checked={reservationData.guestInfo.gender === 'other'}
                        onChange={handleGuestInfoChange}
                      />
                      <span className="gender-label">其他</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>電話 *</label>
                <input
                  type="tel"
                  name="phone"
                  value={reservationData.guestInfo.phone}
                  onChange={handleGuestInfoChange}
                  placeholder="0912-345-678"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={reservationData.guestInfo.email}
                  onChange={handleGuestInfoChange}
                  placeholder="example@email.com"
                />
              </div>
            </div>
          )}

          {/* 預先點餐步驟 */}
          {((user && currentStep === 2) || (!user && currentStep === 3)) && (
            <div className="pre-order-section">
              <div className="pre-order-notice">
                <FaUtensils />
                <div>
                  <h3>預先點餐（可選）</h3>
                  <p>提前點餐，節省現場等候時間</p>
                </div>
              </div>
              <div className="pre-order-options">
                <button
                  className={`option-card ${reservationData.preOrder ? '' : 'selected'}`}
                  onClick={() => setReservationData({ ...reservationData, preOrder: false })}
                >
                  <div className="option-content">
                    <h4>現場點餐</h4>
                    <p>到店後再決定用餐內容</p>
                  </div>
                </button>
                <button
                  className={`option-card ${reservationData.preOrder ? 'selected' : ''}`}
                  onClick={() => setReservationData({ ...reservationData, preOrder: true })}
                >
                  <div className="option-content">
                    <h4>預先點餐</h4>
                    <p>立即選擇餐點，到店即可享用</p>
                  </div>
                </button>
              </div>
              {reservationData.preOrder && (
                <div className="menu-preview">
                  <p className="text-center text-muted">菜單功能開發中...</p>
                </div>
              )}

              {/* 特殊需求 */}
              <div className="special-requests-section">
                <h4 className="section-subtitle">特殊需求</h4>
                <textarea
                  className="special-requests-textarea"
                  value={reservationData.specialRequests}
                  onChange={(e) => setReservationData({
                    ...reservationData,
                    specialRequests: e.target.value
                  })}
                  placeholder="如：兒童座椅、過敏資訊等"
                  rows="4"
                />
              </div>
            </div>
          )}

          {/* 確認訂位步驟（會員和訪客都顯示） */}
          {((user && currentStep === 3) || (!user && currentStep === 4)) && (
            <div className="confirmation-section">
              <div className="confirmation-card">
                <h3><FaCheckCircle /> 請確認您的訂位資訊</h3>
                <div className="info-group">
                  <div className="info-row">
                    <span className="label">訂位日期：</span>
                    <span className="value">{formatDate(reservationData.date)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">用餐時段：</span>
                    <span className="value">{reservationData.timeSlot}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">用餐人數：</span>
                    <span className="value">
                      {reservationData.partySize} 位大人
                      {reservationData.childrenCount > 0 && ` + ${reservationData.childrenCount} 位小孩`}
                      （共 {reservationData.partySize + reservationData.childrenCount} 位）
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">聯絡人：</span>
                    <span className="value">
                      {user ? user.username : reservationData.guestInfo.name}
                      {!user && reservationData.guestInfo.gender && (
                        <span className="gender-suffix">
                          {reservationData.guestInfo.gender === 'female' ? ' 小姐' : 
                           reservationData.guestInfo.gender === 'male' ? ' 先生' : ''}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">聯絡電話：</span>
                    <span className="value">
                      {user ? user.phone_number : reservationData.guestInfo.phone}
                    </span>
                  </div>
                  {!user && reservationData.guestInfo.email && (
                    <div className="info-row">
                      <span className="label">Email：</span>
                      <span className="value">{reservationData.guestInfo.email}</span>
                    </div>
                  )}
                  {reservationData.specialRequests && (
                    <div className="info-row">
                      <span className="label">特殊需求：</span>
                      <span className="value">{reservationData.specialRequests}</span>
                    </div>
                  )}
                  {reservationData.preOrder && (
                    <div className="info-row">
                      <span className="label">預先點餐：</span>
                      <span className="value">是</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 導航按鈕 */}
        <div className="navigation-buttons">
          {currentStep > 1 && (
            <button className="btn-previous" onClick={handlePreviousStep}>
              <FaArrowLeft /> 上一步
            </button>
          )}
          {currentStep < totalSteps ? (
            <button className="btn-next" onClick={handleNextStep}>
              下一步 <FaArrowRight />
            </button>
          ) : (
            <button className="btn-confirm" onClick={handleSubmitReservation}>
              <FaCheckCircle /> 確認訂位
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
