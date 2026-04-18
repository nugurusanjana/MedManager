import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { cart } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Home, Box, BarChart2, Edit2, Bell, ShoppingCart, TrendingUp } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import './Layout.css';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home', end: true },
  { to: '/dashboard/stock', icon: Box, label: 'My Stock' },
  { to: '/dashboard/seasonality', icon: BarChart2, label: 'Seasonality' },
  { to: '/dashboard/profit-loss', icon: TrendingUp, label: 'Profit & Loss' },
  { to: '/dashboard/update', icon: Edit2, label: 'Update Stock' },
  { to: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard/cart', icon: ShoppingCart, label: 'Cart' },
{ to: '/dashboard/medguide', icon: Home, label: 'MedGuide' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  useEffect(() => {
    const refresh = () => {
      cart.list().then((items) => setCartCount(items.length)).catch(() => setCartCount(0));
    };
    refresh();
    window.addEventListener('cartChanged', refresh);
    return () => window.removeEventListener('cartChanged', refresh);
  }, [user]);

  return (
    <div className="layout">
      <motion.aside
        className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}
        initial={false}
        animate={{ width: sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)' }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      >
        <div className="sidebar-header">
          <span className="logo">MedManager</span>
          <button type="button" className="btn btn-icon btn-secondary toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><Icon size={18} /></span>
              {sidebarOpen && <span className="nav-label">{label}</span>}
              {to === '/dashboard/cart' && cartCount > 0 && sidebarOpen && <span className="cart-badge">{cartCount}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {sidebarOpen && (
            <>
              <div className="user-info">
                {user?.avatar_url && <img src={user.avatar_url} alt="" className="user-avatar" />}
                <span className="user-name">{user?.name || user?.email}</span>
              </div>
              <div className="sidebar-actions">
                <ThemeToggle />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/login'); }}>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </motion.aside>
      <motion.main className="main" initial="hidden" animate="visible" exit="exit" variants={pageVariants}>
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </motion.main>
      <Toaster position="bottom-right" />
    </div>
  );
}
