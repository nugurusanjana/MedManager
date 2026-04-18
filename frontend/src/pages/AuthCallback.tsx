import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { auth } from '@/api';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setUserFromToken } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing sign in…');

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');
    
    if (error) {
      setStatus(error);
      const t = setTimeout(() => navigate('/signup', { replace: true }), 4000);
      return () => clearTimeout(t);
    }
    
    if (token) {
      localStorage.setItem('token', token);
      auth.me().then((user) => {
        setUserFromToken(user, token);
        setStatus('Success! Redirecting…');
        navigate('/dashboard', { replace: true });
      }).catch(() => {
        setStatus('Session invalid. Redirecting to login…');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      });
      return;
    }
    setStatus('No token received. Try signing in again.');
    const t = setTimeout(() => navigate('/login', { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [params, setUserFromToken, navigate]);

  return (
    <div className="auth-page">
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{status}</p>
      </div>
    </div>
  );
}
