import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notifications } from '@/api';
import './Notifications.css';

export default function Notifications() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    notifications.list().then(setList).catch((e) => setError(e.error || 'Failed to load')).finally(() => setLoading(false));
  }, []);

  const replenish = (id: string) => {
    notifications.replenish(id).then(() => notifications.list().then(setList)).catch((e) => setError(e.error || 'Failed'));
  };

  if (loading) return <div className="page-loading">Loading notifications…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className="notifications-page">
      <header className="page-header">
        <h1>Notifications</h1>
        <p className="text-muted">Alerts for expiring (6 days) or low stock (≤5) medicines</p>
      </header>
      <div className="card notifications-list">
        {list.length === 0 ? (
          <p className="no-data">No notifications.</p>
        ) : (
          <ul>
            {list.map((n) => (
              <li key={n.id} className={n.read ? 'read' : ''}>
                <div className="notif-body">
                  <span className={`notif-type ${n.type}`}>{n.type === 'expiry' ? 'Expiry' : 'Low stock'}</span>
                  <p className="notif-message">{n.message}</p>
                  <time className="notif-time">{new Date(n.created_at).toLocaleString()}</time>
                </div>
                <div className="notif-actions">
                  <Link to="/dashboard/update" className="btn btn-primary btn-sm">Update Stock</Link>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => replenish(n.id)}>Replenish</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
