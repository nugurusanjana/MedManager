import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { auth as authApi } from '@/api';
import './Auth.css';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.error || err.message || 'Sign up failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = authApi.googleUrl();
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>MedManager</h1>
        <p className="auth-subtitle">Create an account</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="label">Name</label>
          <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
          <label className="label">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <label className="label">Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Creating account…' : 'Sign up'}
            <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
          </button>
        </form>
        <div className="auth-divider">or</div>
        <button type="button" className="btn btn-google" style={{ width: '100%' }} onClick={handleGoogle}>
          <span className="google-icon">G</span> Sign up with Google
        </button>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
