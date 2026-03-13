import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { auth } from '../firebase';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    setIsUpdatingPin(true);
    setPinError('');
    try {
      // Update in Firestore for record (though Auth is primary)
      if (user?.id) {
        await updateDoc(doc(db, 'users', user.id.toString()), {
          pin: newPin,
          updatedAt: new Date().toISOString()
        });
      }

      // Update Firebase Auth Password (using PIN as password)
      if (auth.currentUser) {
        // Firebase requires at least 6 chars for password usually, 
        // but we can append a secret suffix if needed or just use it as is if allowed.
        // For simplicity we use the PIN + a dummy string to meet 6-char requirement if needed.
        const securePass = newPin.padEnd(6, '0');
        await updatePassword(auth.currentUser, securePass);
      }

      setPinSuccess(true);
      setTimeout(() => {
        setShowPinModal(false);
        setPinSuccess(false);
        setNewPin('');
        setConfirmPin('');
      }, 2000);
    } catch (err: any) {
      console.error('PIN update error:', err);
      setPinError(err.message || 'Failed to update PIN. Try logging in again.');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="aurora-bg">
        <div className="aurora-gradient-1"></div>
        <div className="aurora-gradient-2"></div>
      </div>

      <header className="dashboard-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'white' }}>Settings</h1>
          <p style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
            Account & Preferences
          </p>
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Profile Card */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.5rem' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{user?.name || 'User'}</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{user?.email || 'No email'}</p>
          </div>
          {user?.role === 'admin' && (
             <span style={{ fontSize: '9px', fontWeight: 900, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>Admin</span>
          )}
        </div>

        {/* Section: App Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '0.5rem', marginBottom: '0.25rem' }}>App Preferences</h3>
          
          <div className="glass-card" style={{ padding: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#10b981' }}>translate</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Language</span>
              </div>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                <button 
                  onClick={() => setLanguage('English')}
                  style={{ background: language === 'English' ? '#10b981' : 'transparent', color: language === 'English' ? '#064e3b' : '#64748b', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s' }}
                >EN</button>
                <button 
                  onClick={() => setLanguage('Tamil')}
                  style={{ background: language === 'Tamil' ? '#10b981' : 'transparent', color: language === 'Tamil' ? '#064e3b' : '#64748b', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s' }}
                >தமிழ்</button>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Support & Growth */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '0.5rem', marginBottom: '0.25rem' }}>Growth & Feedback</h3>
          
          <button 
            onClick={() => navigate('/feedback')}
            className="glass-card" 
            style={{ width: '100%', border: '1px solid var(--glass-border)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>rate_review</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Send Feedback</span>
            </div>
            <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: '1.2rem' }}>chevron_right</span>
          </button>
        </div>

        {/* Section: Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '0.5rem', marginBottom: '0.25rem' }}>Security</h3>
          
          <button 
            onClick={() => setShowPinModal(true)}
            className="glass-card" 
            style={{ width: '100%', border: '1px solid var(--glass-border)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>lock_reset</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Change Access PIN</span>
            </div>
            <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: '1.2rem' }}>chevron_right</span>
          </button>
        </div>

        {/* Section: Admin Tools (Conditional) */}
        {user?.role === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '0.5rem', marginBottom: '0.25rem' }}>Admin Tools</h3>
            
            <button 
              onClick={() => navigate('/admin')}
              className="glass-card" 
              style={{ width: '100%', border: '1px solid var(--glass-border)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#BBFF00' }}>admin_panel_settings</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Admin Control Center</span>
              </div>
              <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: '1.2rem' }}>chevron_right</span>
            </button>
          </div>
        )}

        {/* Action: Logout */}
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="glass-card" 
          style={{ width: '100%', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#ef4444', cursor: 'pointer', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.05)' }}
        >
          <span className="material-symbols-outlined">{isLoggingOut ? 'sync' : 'logout'}</span>
          <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>{isLoggingOut ? 'Logging out...' : 'Logout Session'}</span>
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#475569', marginTop: '2rem' }}>
          PENDING v1.2.0 • Build 2026.03.13
        </p>
      </main>

      <BottomNav />

      {/* PIN Change Modal */}
      {showPinModal && (
        <div className="premium-modal-overlay" onClick={() => !isUpdatingPin && setShowPinModal(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>Update Access PIN</h2>
              <button disabled={isUpdatingPin} onClick={() => setShowPinModal(false)} className="notification-btn">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {pinSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>check</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: '0 0 0.5rem 0' }}>PIN Updated!</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Your sign-in credentials have been updated.</p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>New 4-Digit PIN</label>
                  <input 
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    className="form-input" 
                    value={newPin} 
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} 
                    required 
                    autoFocus 
                    placeholder="••••"
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '1rem', fontSize: '1.5rem', borderRadius: '1rem', color: 'white', width: '100%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.5em' }}
                  />
                </div>

                <div className="input-group">
                  <label style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Confirm New PIN</label>
                  <input 
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    className="form-input" 
                    value={confirmPin} 
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} 
                    required 
                    placeholder="••••"
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '1rem', fontSize: '1.5rem', borderRadius: '1rem', color: 'white', width: '100%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.5em' }}
                  />
                </div>

                {pinError && (
                  <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>{pinError}</p>
                )}

                <button 
                  type="submit" 
                  disabled={isUpdatingPin}
                  className="glow-btn-primary" 
                  style={{ width: '100%', height: '4rem', borderRadius: '1.25rem', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', gap: '0.75rem', marginTop: '1rem' }}
                >
                  <span className="material-symbols-outlined">{isUpdatingPin ? 'sync' : 'save'}</span>
                  <span>{isUpdatingPin ? 'Saving...' : 'Update PIN'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
