import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const BottomNav: React.FC<{ onAddClick?: () => void }> = ({ onAddClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: 'home', label: t('home') },
    { path: '/planner', icon: 'calendar_month', label: t('timeline') },
    { path: '/stats', icon: 'insert_chart', label: t('stats') },
    { path: '/settings', icon: 'person', label: t('profile') },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', icon: 'shield_person', label: 'Admin Hub' });
  }

  return (
    <>
      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <nav className="bottom-nav-premium bottom-nav-mobile">
        {navItems.slice(0, 2).map(item => (
          <div key={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive(item.path) ? "'FILL' 1" : "" }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
        <button className="nav-add-btn" onClick={() => onAddClick ? onAddClick() : navigate('/dashboard')}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>add</span>
        </button>
        {navItems.slice(2).map(item => (
          <div key={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive(item.path) ? "'FILL' 1" : "" }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* ── Desktop left sidebar (hidden on mobile) ── */}
      <aside className="desktop-sidebar">
        <div className="sidebar-logo">
          <span>PENDING</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              style={isActive(item.path) ? { color: user?.role === 'admin' ? '#BBFF00' : 'var(--primary)' } : {}}
            >
              <span className="material-symbols-outlined" style={{ 
                fontVariationSettings: isActive(item.path) ? "'FILL' 1" : "",
                color: isActive(item.path) && user?.role === 'admin' ? '#BBFF00' : ''
              }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <button
          className="sidebar-add-btn"
          onClick={() => onAddClick ? onAddClick() : navigate('/dashboard')}
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add Task
        </button>

        <div className="sidebar-logout-container">
          <button 
            onClick={() => logout()}
            className="sidebar-logout-btn"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default BottomNav;
