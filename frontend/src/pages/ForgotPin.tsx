import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPin: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Recovery code sent to: ' + email);
    navigate('/reset-pin');
  };

  return (
    <div className="auth-container" style={{ background: '#020617', padding: '1rem' }}>
      <div className="aurora-bg">
        <div className="aurora-gradient-1"></div>
        <div className="aurora-gradient-2"></div>
      </div>

      <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>lock_reset</span>
          </div>
        </header>

        <div style={{ marginTop: '3rem', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', margin: 0, color: 'white' }}>Forgot PIN?</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
            Enter your registered email address to receive a recovery code. We'll help you get back into your account securely.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', fontSize: '20px' }}>mail</span>
              <input 
                type="email" 
                className="form-input" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '3.5rem', height: '4rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button type="submit" className="glow-btn-primary" style={{ height: '4rem' }}>
            <span className="truncate">Send Recovery Code</span>
          </button>
        </form>

        <div style={{ marginTop: 'auto', padding: '2rem 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Remember your PIN? 
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, marginLeft: '0.5rem', cursor: 'pointer' }}>Log in</button>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem 0', opacity: 0.2 }}>
          <div style={{ height: '1px', width: '6rem', background: 'linear-gradient(to right, transparent, white, transparent)' }}></div>
          <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'white' }}>Pending Secure</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPin;
