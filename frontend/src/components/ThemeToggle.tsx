import { useTheme } from '../ThemeContext';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <div className="theme-toggle-track">
        <Sun size={16} className="theme-icon sun-icon" />
        <Moon size={16} className="theme-icon moon-icon" />
      </div>
      <div className="theme-toggle-thumb" />
    </button>
  );
}
