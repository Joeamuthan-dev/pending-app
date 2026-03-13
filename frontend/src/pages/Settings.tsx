import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { updatePassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, type Language } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const API_URL = 'http://localhost:3001/api';

const Settings: React.FC = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const langs: Language[] = ['English', 'Tamil'];
    const nextIndex = (langs.indexOf(language) + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess(false);

    if (newPin.length !== 4) {
      setPinError(t('enter_4_digits'));
      return;
    }

    if (newPin !== confirmPin) {
      setPinError(t('pin_mismatch'));
      return;
    }

    try {
      // 1. Update Firebase Password
      if (auth.currentUser) {
        const firebasePassword = newPin + "123456";
        await updatePassword(auth.currentUser, firebasePassword);
      }

      // 2. Update Local DB PIN
      if (user?.id) {
        await axios.put(`${API_URL}/users/${user.id}/pin`, { password: newPin });
      }

      setPinSuccess(true);
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => setShowPinModal(false), 2000);
    } catch (err: any) {
      console.error('Update password failed:', err);
      setPinError(err.message || 'Update failed');
    }
  };

  interface SettingsItem {
    icon: string;
    label: string;
    value: string;
    color?: string;
    onClick?: () => void;
  }

  interface SettingsSection {
    title: string;
    items: SettingsItem[];
  }

  const sections: SettingsSection[] = [
    {
      title: t('app_settings'),
      items: [
        { 
          icon: theme === 'dark' ? 'dark_mode' : 'light_mode', 
          label: t('appearance'), 
          value: theme === 'dark' ? 'Dark' : 'Light',
          onClick: toggleTheme
        },
        { 
          icon: 'language', 
          label: t('language'), 
          value: language,
          onClick: toggleLanguage
        }
      ]
    },
    {
      title: t('security'),
      items: [
        { 
          icon: 'pin', 
          label: t('change_pin'), 
          value: '', 
          onClick: () => setShowPinModal(true) 
        }
      ]
    },
    {
      title: t('support'),
      items: [
        // { icon: 'volunteer_activism', label: t('send_tips'), value: '', color: '#10b981', onClick: () => navigate('/tips') },
        { icon: 'rate_review', label: 'Give Feedback', value: '', color: '#60a5fa', onClick: () => navigate('/feedback') },
        { icon: 'list_alt', label: 'View All Feedbacks', value: '', color: '#fbbf24', onClick: () => navigate('/feedback-list') }
      ]
    }
  ];

  return (
    <div className="relative flex min-h-screen w-full page-responsive flex-col bg-[var(--bg-color)] text-slate-100 font-display pb-32">
       <div className="aurora-bg">
        <div className="aurora-gradient-1"></div>
        <div className="aurora-gradient-2"></div>
      </div>
      
      <header className="p-6 pt-12 pb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2 text-[var(--text-main)]">{t('settings')}</h1>
        <p className="text-slate-500 text-sm font-medium">{t('personalize')}</p>
      </header>

      <main className="flex-1 px-6">
        {/* Profile Card */}
        <div className="glass-card rounded-3xl p-6 mb-8 bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-green-600 p-1">
             <div className="size-full rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} alt="Profile" className="size-full object-cover" />
             </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)]">{user?.name || 'User'}</h2>
            <p className="text-slate-500 text-xs">{user?.email || 'user@example.com'}</p>
          </div>
          <button className="ml-auto size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>
        </div>

        {/* Setting Sections */}
        <div className="space-y-8">
          {sections.map(section => (
            <div key={section.title}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 px-2">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map(item => (
                  <div 
                    key={item.label} 
                    onClick={item.onClick}
                    className="glass-card rounded-2xl p-4 bg-[var(--card-bg)] hover:bg-white/[0.05] border border-[var(--border-color)] flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <span className="font-medium text-sm text-[var(--text-main)]">{item.label}</span>
                    <div className="ml-auto flex items-center gap-2">
                       {item.value && <span className="text-xs font-bold" style={{ color: item.color || '#64748b' }}>{item.value}</span>}
                       <span className="material-symbols-outlined text-slate-600 text-lg">chevron_right</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full mt-12 mb-8 flex items-center justify-center gap-2 h-14 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 font-bold hover:bg-red-500/10 transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          {t('sign_out')}
        </button>
      </main>

      {/* PIN Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="glass-card w-full max-w-md bg-[var(--bg-color)] rounded-t-[2.5rem] p-8 border-t border-white/10 shadow-2xl animate-slide-up">
             <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>
             
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white">{t('change_pin')}</h2>
                <button onClick={() => setShowPinModal(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                   <span className="material-symbols-outlined">close</span>
                </button>
             </div>

             <form onSubmit={handleUpdatePin} className="space-y-6">
                {pinError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">{pinError}</div>}
                {pinSuccess && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">{t('pin_success')}</div>}
                
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">{t('new_pin')}</label>
                   <input 
                     type="password" 
                     maxLength={4}
                     value={newPin}
                     onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                     className="w-full h-14 bg-white/5 rounded-2xl px-6 border border-white/5 focus:border-primary outline-none text-xl tracking-[0.5em] font-black text-white text-center"
                     placeholder="****"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">{t('confirm_pin')}</label>
                   <input 
                     type="password" 
                     maxLength={4}
                     value={confirmPin}
                     onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                     className="w-full h-14 bg-white/5 rounded-2xl px-6 border border-white/5 focus:border-primary outline-none text-xl tracking-[0.5em] font-black text-white text-center"
                     placeholder="****"
                   />
                </div>

                <button type="submit" className="glow-btn-primary w-full h-14 rounded-2xl mt-4 font-bold tracking-tight">
                   {t('update_pin')}
                </button>
             </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Settings;
