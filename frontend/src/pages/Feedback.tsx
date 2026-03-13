import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import BottomNav from '../components/BottomNav';

const Feedback: React.FC = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [type, setType] = useState('Feature');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    
    // Show only user's recent feedback
    const q = query(
      collection(db, 'feedback'),
      where('userId', '==', user.id.toString()),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentFeedback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user?.id?.toString() || 'anonymous',
        userName: user?.name || 'Anonymous',
        message,
        type,
        createdAt: new Date().toISOString()
      });
      setSubmitted(true);
      setMessage('');
      setTimeout(() => setSubmitted(false), 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'white' }}>Feedback</h1>
          <p style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
            Help us improve PENDING
          </p>
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    <div className="glass-card" style={{ padding: '1.5rem 2rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="input-group">
                <label style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Feedback Type</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {['Feature', 'Bug', 'Other'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: type === t ? '#10b981' : 'rgba(255,255,255,0.05)',
                        color: type === t ? '#064e3b' : '#64748b',
                        fontWeight: 900,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Your Message</label>
                <textarea
                  className="form-input"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  required
                  style={{ minHeight: '120px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '1rem', marginTop: '0.5rem', padding: '1rem' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="glow-btn-primary"
                style={{ 
                  height: '3.5rem', 
                  borderRadius: '1rem', 
                  background: submitted ? 'rgba(16, 185, 129, 0.2)' : 'var(--primary)',
                  color: submitted ? '#10b981' : '#064e3b',
                  transition: 'all 0.3s ease'
                }}
              >
                {isSubmitting ? 'Sending...' : submitted ? '✅ Sent!' : 'Submit Feedback'}
              </button>
            </form>
        </div>

        {recentFeedback.length > 0 && (
          <section>
            <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>Your Progress Reports</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentFeedback.map(f => (
                <div key={f.id} className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '9px', fontWeight: 900, color: '#10b981', letterSpacing: '0.1em' }}>{f.type?.toUpperCase()}</span>
                    <span style={{ fontSize: '9px', color: '#475569' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{f.message}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Feedback;
