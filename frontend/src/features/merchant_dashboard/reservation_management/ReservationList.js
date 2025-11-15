import React, { useState } from 'react';
import { FaPhone, FaUsers, FaClock, FaCalendarDay, FaStickyNote, FaCheck } from 'react-icons/fa';

const ReservationList = ({ reservations, onAccept, onCancel, onComplete }) => {
  const [activeStatusTab, setActiveStatusTab] = useState('all'); // 'all', 'pending', 'confirmed', 'completed', 'cancelled'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'status', 'party_size'

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '待確認', className: 'status-pending' },
      confirmed: { label: '已確認', className: 'status-confirmed' },
      cancelled: { label: '已取消', className: 'status-cancelled' },
      completed: { label: '已完成', className: 'status-completed' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' };
    return date.toLocaleDateString('zh-TW', options);
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const options = { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('zh-TW', options);
  };

  const filteredReservations = reservations.filter(reservation => {
    if (activeStatusTab === 'all') return true;
    return reservation.status === activeStatusTab;
  });

  const sortedReservations = [...filteredReservations].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.date + ' ' + a.time_slot.split('-')[0]) - 
             new Date(b.date + ' ' + b.time_slot.split('-')[0]);
    }
    if (sortBy === 'party_size') {
      return b.party_size - a.party_size;
    }
    return 0;
  });

  return (
    <div className="reservation-list-container">
      {/* 狀態分類導覽 */}
      <div className="status-tabs">
        <button
          className={`status-tab ${activeStatusTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveStatusTab('all')}
        >
          全部
        </button>
        <button
          className={`status-tab ${activeStatusTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveStatusTab('pending')}
        >
          待確認
        </button>
        <button
          className={`status-tab ${activeStatusTab === 'confirmed' ? 'active' : ''}`}
          onClick={() => setActiveStatusTab('confirmed')}
        >
          已確認
        </button>
        <button
          className={`status-tab ${activeStatusTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveStatusTab('completed')}
        >
          已完成
        </button>
        <button
          className={`status-tab ${activeStatusTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveStatusTab('cancelled')}
        >
          已取消
        </button>
      </div>

      <div className="list-controls">
        <div className="sort-group">
          <label>排序：</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">訂位日期</option>
            <option value="party_size">人數</option>
          </select>
        </div>
      </div>

      {sortedReservations.length === 0 ? (
        <div className="empty-state">
          <p>目前沒有訂位記錄</p>
        </div>
      ) : (
        <div className="reservations-grid">
          {sortedReservations.map((reservation) => (
            <div key={reservation.id} className="reservation-card">
              <div className="card-header">
                <div className="customer-info">
                  <h3>{reservation.customer_name}</h3>
                  {getStatusBadge(reservation.status)}
                </div>
                <div className="booking-time">
                  <small>預訂於 {formatDateTime(reservation.created_at)}</small>
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <FaPhone className="info-icon" />
                  <span>{reservation.customer_phone}</span>
                </div>
                <div className="info-row">
                  <FaCalendarDay className="info-icon" />
                  <span>{formatDate(reservation.date)}</span>
                </div>
                <div className="info-row">
                  <FaClock className="info-icon" />
                  <span>{reservation.time_slot}</span>
                </div>
                <div className="info-row">
                  <FaUsers className="info-icon" />
                  <span>{reservation.party_size} 位</span>
                </div>
                {reservation.special_requests && (
                  <div className="info-row special-requests">
                    <FaStickyNote className="info-icon" />
                    <span>{reservation.special_requests}</span>
                  </div>
                )}
              </div>

              {reservation.status === 'pending' && (
                <div className="card-actions">
                  <button
                    className="btn-accept"
                    onClick={() => onAccept(reservation.id)}
                  >
                    接受訂位
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => onCancel(reservation.id)}
                  >
                    取消訂位
                  </button>
                </div>
              )}
              
              {reservation.status === 'confirmed' && (
                <div className="card-actions">
                  <button
                    className="btn-complete"
                    onClick={() => onComplete(reservation.id)}
                  >
                    <FaCheck /> 完成
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => onCancel(reservation.id)}
                  >
                    取消訂位
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReservationList;
