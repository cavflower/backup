import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCalendarAlt, FaHome } from 'react-icons/fa';
import './ReservationSuccessPage.css';

const ReservationSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="reservation-success-page">
      <div className="success-container">
        <div className="success-icon">
          <FaCheckCircle />
        </div>
        
        <h1>訂位成功！</h1>
        <p className="success-message">
          我們已收到您的訂位申請，稍後會發送確認通知至您的聯絡方式。
        </p>

        <div className="success-info">
          <div className="info-card">
            <FaCalendarAlt className="card-icon" />
            <div className="card-content">
              <h3>您可以</h3>
              <ul>
                <li>查看訂位記錄</li>
                <li>修改訂位時間</li>
                <li>取消訂位</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => navigate('/my-reservations')}
          >
            查看我的訂位
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            <FaHome /> 返回首頁
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationSuccessPage;
