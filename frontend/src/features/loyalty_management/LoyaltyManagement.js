import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoyaltyManagement.css';
import { FaArrowLeft, FaCoins, FaAward, FaGift } from 'react-icons/fa';

const LoyaltyManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="loyalty-management">
      <header className="loyalty-header">
        <button className="back-btn" onClick={() => navigate('/merchant')}>
          <FaArrowLeft /> 返回
        </button>
        <h1>會員制度管理</h1>
        <p>設定您的點數規則、會員等級和兌換商品</p>
      </header>

      <nav className="loyalty-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          概況
        </button>
        <button
          className={`nav-tab ${activeTab === 'point-rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('point-rules')}
        >
          <FaCoins /> 點數規則
        </button>
        <button
          className={`nav-tab ${activeTab === 'membership-levels' ? 'active' : ''}`}
          onClick={() => setActiveTab('membership-levels')}
        >
          <FaAward /> 會員等級
        </button>
        <button
          className={`nav-tab ${activeTab === 'redemptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('redemptions')}
        >
          <FaGift /> 兌換商品
        </button>
      </nav>

      <main className="loyalty-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>會員制度概況</h2>
            <div className="overview-cards">
              <div className="overview-card">
                <FaCoins className="card-icon" />
                <h3>點數規則</h3>
                <p>管理顧客消費如何獲得點數</p>
              </div>
              <div className="overview-card">
                <FaAward className="card-icon" />
                <h3>會員等級</h3>
                <p>設定不同等級的會員權益與折扣</p>
              </div>
              <div className="overview-card">
                <FaGift className="card-icon" />
                <h3>兌換商品</h3>
                <p>建立可供會員用點數兌換的商品</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'point-rules' && (
          <PointRulesSection />
        )}

        {activeTab === 'membership-levels' && (
          <MembershipLevelsSection />
        )}

        {activeTab === 'redemptions' && (
          <RedemptionsSection />
        )}
      </main>
    </div>
  );
};

const PointRulesSection = () => (
  <section className="loyalty-section">
    <div className="section-header">
      <h2>點數規則</h2>
      <button className="btn btn-primary">+ 新增規則</button>
    </div>
    <div className="empty-state">
      <FaCoins className="empty-icon" />
      <h3>還沒有點數規則</h3>
      <p>建立第一個點數規則，定義顧客消費多少金額可獲得多少點數</p>
      <button className="btn btn-secondary">建立規則</button>
    </div>
  </section>
);

const MembershipLevelsSection = () => (
  <section className="loyalty-section">
    <div className="section-header">
      <h2>會員等級</h2>
      <button className="btn btn-primary">+ 新增等級</button>
    </div>
    <div className="empty-state">
      <FaAward className="empty-icon" />
      <h3>還沒有會員等級</h3>
      <p>建立會員等級，為不同消費等級的顧客提供差異化的權益</p>
      <button className="btn btn-secondary">建立等級</button>
    </div>
  </section>
);

const RedemptionsSection = () => (
  <section className="loyalty-section">
    <div className="section-header">
      <h2>兌換商品</h2>
      <button className="btn btn-primary">+ 新增商品</button>
    </div>
    <div className="empty-state">
      <FaGift className="empty-icon" />
      <h3>還沒有兌換商品</h3>
      <p>建立兌換商品，讓會員用積累的點數兌換您提供的禮品或優惠</p>
      <button className="btn btn-secondary">建立商品</button>
    </div>
  </section>
);

export default LoyaltyManagement;
