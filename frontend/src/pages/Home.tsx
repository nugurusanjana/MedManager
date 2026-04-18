import { useEffect, useState } from 'react';
import { useAuth } from '@/AuthContext';
import { dashboard, seasonality } from '@/api';
import CountUp from 'react-countup';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([dashboard.get(), seasonality.top()])
      .then(([dashData, topData]) => {
        setData(dashData);
        setTopItems(topData.slice(0, 3));
      })
      .catch((e) => setError(e.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard…</div>;
  if (error) return <div className="page-error">{error}</div>;

  const summary = data?.stock_summary || {};
  const loginTime = data?.login_time ? new Date(data.login_time).toLocaleString() : '—';

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>Dashboard</h1>
      </header>
      <div className="dashboard-grid">
        <div className="card profile-card">
          <h2>Profile</h2>
          {user?.avatar_url && <img src={user.avatar_url} alt="" className="profile-avatar" />}
          <p><strong>{data?.user?.name || user?.name}</strong></p>
          <p className="text-muted">{data?.user?.email || user?.email}</p>
          <p className="login-time">Last login: {loginTime}</p>
        </div>
        <div className="card stats-card">
          <h2>Stock summary</h2>
          <div className="stats-row">
            <div className="stat">
              <span className="stat-label">Total medicines</span>
              <span className="stat-value">
                <CountUp end={summary.total_medicines ?? 0} duration={0.3} />
              </span>
            </div>
            <div className="stat stat-warn">
              <span className="stat-label">Expired</span>
              <span className="stat-value">
                <CountUp end={summary.expired_count ?? 0} duration={0.3} />
              </span>
            </div>
            <div className="stat stat-danger">
              <span className="stat-label">Low stock (≤5)</span>
              <span className="stat-value">
                <CountUp end={summary.low_stock_count ?? 0} duration={0.3} />
              </span>
            </div>
          </div>
        </div>
        <div className="card top-items-card">
          <h2>Top 3 Most Sold</h2>
          {topItems.length === 0 ? (
            <p className="no-data">No sales data yet.</p>
          ) : (
            <div className="top-items-list">
              {topItems.map((item: any, idx: number) => (
                <div key={idx} className="top-item">
                  <span className="rank">#{idx + 1}</span>
                  <div className="item-info">
                    <p className="item-name">{item.name}</p>
                    <p className="item-qty">{item.quantity} units sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
