import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { profitLoss } from '@/api';
import { useTheme } from '@/ThemeContext';
import './ProfitLoss.css';

export default function ProfitLoss() {
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const lineColor = theme === 'dark' ? '#ffffff' : '#1e293b';

  const load = (numDays: number) => {
    const isInitialLoad = dailyData.length === 0;
    if (isInitialLoad) setLoading(true);
    else setUpdating(true);
    setError('');
    Promise.all([profitLoss.daily(numDays), profitLoss.summary(numDays)])
      .then(([daily, summ]) => { setDailyData(daily); setSummary(summ); })
      .catch((e) => setError(e.error || 'Failed to load'))
      .finally(() => { if (isInitialLoad) setLoading(false); else setUpdating(false); });
  };

  useEffect(() => { load(days); }, [days]);

  if (loading) return <div className="page-loading">Loading profit & loss data…</div>;
  if (error) return <div className="page-error">{error}</div>;

  const isProfitable = (summary?.total_profit ?? 0) >= 0;

  return (
    <div className="profit-loss-page">
      <header className="page-header">
        <h1>Profit & Loss Dashboard</h1>
        <p className="text-muted">Monitor your daily profit/loss. Loss is calculated from expired medicines.</p>
      </header>
      <div className="card settings-card">
        <h2>Settings</h2>
        <div className="setting-item">
          <label className="label">Number of days to display</label>
          <input type="number" min="7" max="365" step="1" className="setting-input" value={days}
            onChange={(e) => setDays(Math.max(7, Math.min(365, parseInt(e.target.value) || 30)))}
            disabled={updating} style={{ maxWidth: 200 }} placeholder="30" />
          <p className="hint-text">Change the range of days to analyze your profit/loss trends.</p>
        </div>
      </div>
      {summary && (
        <div className={`summary-cards ${updating ? 'loading' : ''}`}>
          <div className="card summary-card revenue-card">
            {updating && <div className="card-loading-overlay"></div>}
            <h3>Total Revenue</h3>
            <p className="summary-value">₹{summary.total_revenue?.toFixed(2) || '0.00'}</p>
            <p className="summary-label">From {summary.period_days} days of sales</p>
          </div>
          <div className="card summary-card loss-card">
            {updating && <div className="card-loading-overlay"></div>}
            <h3>Total Loss (Expired)</h3>
            <p className="summary-value">₹{summary.total_loss?.toFixed(2) || '0.00'}</p>
            <p className="summary-label">{summary.expired_medicine_count} expired medicines</p>
          </div>
          <div className={`card summary-card profit-card ${isProfitable ? 'profitable' : 'unprofitable'}`}>
            {updating && <div className="card-loading-overlay"></div>}
            <h3>Net Profit/Loss</h3>
            <p className={`summary-value ${isProfitable ? 'positive' : 'negative'}`}>
              ₹{summary.total_profit?.toFixed(2) || '0.00'}
            </p>
            <p className="summary-label">{isProfitable ? 'You are in profit 📈' : 'You are in loss 📉'}</p>
          </div>
        </div>
      )}
      <div className={`card chart-card ${updating ? 'loading' : ''}`}>
        <h2>Daily Profit/Loss Trend</h2>
        {updating && <div className="chart-loading-overlay"></div>}
        {dailyData.length === 0 ? (
          <p className="no-data">No data available for the selected period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: any) => `₹${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px' }} />
              <Legend />
              <Bar dataKey="revenue" fill="var(--success)" name="Revenue" />
              <Bar dataKey="loss" fill="var(--danger)" name="Loss (Expired)" />
              <Bar dataKey="profit" fill="var(--accent)" name="Net Profit" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className={`card chart-card ${updating ? 'loading' : ''}`}>
        <h2>Net Profit Trend Line</h2>
        {updating && <div className="chart-loading-overlay"></div>}
        {dailyData.length === 0 ? (
          <p className="no-data">No data available for the selected period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: any) => `₹${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px' }} />
              <Line type="monotone" dataKey="profit" stroke={lineColor} strokeWidth={2} dot={{ fill: lineColor, stroke: lineColor, r: 3 }} name="Daily Profit" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card info-card">
        <h3>How is Loss Calculated?</h3>
        <p>Loss is calculated as: <strong>Expired Medicine Count × Cost Per Unit</strong></p>
        <p>All medicines past their expiry date are considered loss. Revenue is calculated from completed sales invoices.</p>
      </div>
    </div>
  );
}
