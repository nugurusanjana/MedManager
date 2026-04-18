import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { seasonality } from '@/api';
import './Seasonality.css';

export default function Seasonality() {
  const [top, setTop] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [seasonal, setSeasonal] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      seasonality.top(), 
      seasonality.monthly(), 
      seasonality.seasonal()
    ])
      .then(([t, m, s]) => { setTop(t); setMonthly(m); setSeasonal(s); })
      .catch((e) => setError(e.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading charts…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className="seasonality-page">
      <header className="page-header">
        <h1>Seasonality & trends</h1>
        <p className="text-muted">Frequently bought medicines and purchase trends</p>
      </header>
      <div className="charts-grid">
        <div className="card chart-card">
          <h2>Top purchases (by quantity)</h2>
          {top.length === 0 ? (
            <p className="no-data">No purchase history yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="var(--accent)" name="Quantity" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card chart-card">
          <h2>Monthly spend</h2>
          {monthly.length === 0 ? (
            <p className="no-data">No purchase history yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthly} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`₹${Number(v).toFixed(2)}`, 'Amount']} />
                <Line type="monotone" dataKey="total_amount" stroke="var(--accent)" name="Amount" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card chart-card full-width">
          <h2>Seasonal (by quarter)</h2>
          {seasonal.length === 0 ? (
            <p className="no-data">No seasonal data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={seasonal} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`₹${Number(v).toFixed(2)}`, 'Amount']} />
                <Bar dataKey="total_amount" fill="var(--accent-dim)" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

