import React, { useState, useEffect } from 'react';
import { FaClock, FaUsers, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import TimeSlotSettings from './TimeSlotSettings';
import ReservationList from './ReservationList';
import './ReservationManagementPage.css';

const ReservationManagementPage = () => {
  const [activeTab, setActiveTab] = useState('reservations'); // 'reservations' or 'settings'
  const [reservations, setReservations] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchReservations();
    fetchTimeSlots();
  }, []);

  const fetchReservations = async () => {
    try {
      // TODO: 替換為實際的 API 調用
      // const response = await getReservations();
      // setReservations(response.data);
      
      // 模擬數據
      const mockReservations = [
        {
          id: 1,
          customer_name: '王小明',
          customer_phone: '0912-345-678',
          date: '2025-11-20',
          time_slot: '18:00-20:00',
          party_size: 4,
          status: 'pending',
          special_requests: '靠窗座位',
          created_at: '2025-11-14T10:30:00',
        },
        {
          id: 2,
          customer_name: '李美華',
          customer_phone: '0923-456-789',
          date: '2025-11-20',
          time_slot: '12:00-14:00',
          party_size: 2,
          status: 'confirmed',
          special_requests: '',
          created_at: '2025-11-13T15:20:00',
        },
        {
          id: 3,
          customer_name: '張大偉',
          customer_phone: '0934-567-890',
          date: '2025-11-21',
          time_slot: '19:00-21:00',
          party_size: 6,
          status: 'pending',
          special_requests: '兒童座椅 x2',
          created_at: '2025-11-14T09:15:00',
        },
      ];
      
      setReservations(mockReservations);
      updateStats(mockReservations);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      // TODO: 替換為實際的 API 調用
      // const response = await getTimeSlots();
      // setTimeSlots(response.data);
      
      // 模擬數據
      const mockTimeSlots = [
        {
          id: 1,
          day_of_week: 'monday',
          start_time: '11:30',
          end_time: '14:00',
          max_capacity: 20,
          is_active: true,
        },
        {
          id: 2,
          day_of_week: 'monday',
          start_time: '17:30',
          end_time: '21:00',
          max_capacity: 30,
          is_active: true,
        },
        {
          id: 3,
          day_of_week: 'tuesday',
          start_time: '11:30',
          end_time: '14:00',
          max_capacity: 20,
          is_active: true,
        },
      ];
      
      setTimeSlots(mockTimeSlots);
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    }
  };

  const updateStats = (reservationList) => {
    const newStats = {
      pending: reservationList.filter(r => r.status === 'pending').length,
      confirmed: reservationList.filter(r => r.status === 'confirmed').length,
      cancelled: reservationList.filter(r => r.status === 'cancelled').length,
      completed: reservationList.filter(r => r.status === 'completed').length,
    };
    setStats(newStats);
  };

  const handleAcceptReservation = async (reservationId) => {
    try {
      // TODO: 替換為實際的 API 調用
      // await acceptReservation(reservationId);
      
      // 模擬更新
      const updatedReservations = reservations.map(r =>
        r.id === reservationId ? { ...r, status: 'confirmed' } : r
      );
      setReservations(updatedReservations);
      updateStats(updatedReservations);
      alert('訂位已確認！');
    } catch (error) {
      console.error('Failed to accept reservation:', error);
      alert('確認訂位失敗，請稍後再試。');
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('確定要取消此訂位嗎？')) return;
    
    try {
      // TODO: 替換為實際的 API 調用
      // await cancelReservation(reservationId);
      
      // 模擬更新
      const updatedReservations = reservations.map(r =>
        r.id === reservationId ? { ...r, status: 'cancelled' } : r
      );
      setReservations(updatedReservations);
      updateStats(updatedReservations);
      alert('訂位已取消！');
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      alert('取消訂位失敗，請稍後再試。');
    }
  };

  const handleCompleteReservation = async (reservationId) => {
    if (!window.confirm('確定要將此訂位標記為已完成嗎？')) return;
    
    try {
      // TODO: 替換為實際的 API 調用
      // await completeReservation(reservationId);
      
      // 模擬更新
      const updatedReservations = reservations.map(r =>
        r.id === reservationId ? { ...r, status: 'completed' } : r
      );
      setReservations(updatedReservations);
      updateStats(updatedReservations);
      alert('訂位已完成！');
    } catch (error) {
      console.error('Failed to complete reservation:', error);
      alert('標記完成失敗，請稍後再試。');
    }
  };

  const handleSaveTimeSlot = async (timeSlotData) => {
    try {
      // TODO: 替換為實際的 API 調用
      if (timeSlotData.id) {
        // 編輯現有時段
        // await updateTimeSlot(timeSlotData.id, timeSlotData);
        const updatedSlots = timeSlots.map(slot =>
          slot.id === timeSlotData.id ? timeSlotData : slot
        );
        setTimeSlots(updatedSlots);
        alert('時段已更新！');
      } else {
        // 新增時段
        // const response = await createTimeSlot(timeSlotData);
        const newSlot = { ...timeSlotData, id: Date.now() };
        setTimeSlots([...timeSlots, newSlot]);
        alert('時段已新增！');
      }
    } catch (error) {
      console.error('Failed to save time slot:', error);
      alert('儲存時段失敗，請稍後再試。');
    }
  };

  const handleDeleteTimeSlot = async (slotId) => {
    if (!window.confirm('確定要刪除此時段嗎？')) return;
    
    try {
      // TODO: 替換為實際的 API 調用
      // await deleteTimeSlot(slotId);
      setTimeSlots(timeSlots.filter(slot => slot.id !== slotId));
      alert('時段已刪除！');
    } catch (error) {
      console.error('Failed to delete time slot:', error);
      alert('刪除時段失敗，請稍後再試。');
    }
  };

  return (
    <div className="reservation-management-page">
      <div className="page-header">
        <h1>訂位管理</h1>
        <div className="header-stats">
          <div className="stat-card pending">
            <FaClock />
            <div>
              <span className="stat-number">{stats.pending}</span>
              <span className="stat-label">待確認</span>
            </div>
          </div>
          <div className="stat-card confirmed">
            <FaCheckCircle />
            <div>
              <span className="stat-number">{stats.confirmed}</span>
              <span className="stat-label">已確認</span>
            </div>
          </div>
          <div className="stat-card completed">
            <FaUsers />
            <div>
              <span className="stat-number">{stats.completed}</span>
              <span className="stat-label">已完成</span>
            </div>
          </div>
          <div className="stat-card cancelled">
            <FaTimesCircle />
            <div>
              <span className="stat-number">{stats.cancelled}</span>
              <span className="stat-label">已取消</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          <FaCalendarAlt /> 訂位列表
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <FaClock /> 時段設定
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'reservations' ? (
          <ReservationList
            reservations={reservations}
            onAccept={handleAcceptReservation}
            onCancel={handleCancelReservation}
            onComplete={handleCompleteReservation}
          />
        ) : (
          <TimeSlotSettings
            timeSlots={timeSlots}
            onSave={handleSaveTimeSlot}
            onDelete={handleDeleteTimeSlot}
          />
        )}
      </div>
    </div>
  );
};

export default ReservationManagementPage;
