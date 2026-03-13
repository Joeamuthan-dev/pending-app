import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import BottomNav from '../components/BottomNav';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, tasks: 0, feedback: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'feedback'>('overview');

  useEffect(() => {
    // Role check
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Realtime Feedback
    const qFeedback = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(50));
    const unsubFeedback = onSnapshot(qFeedback, (snap) => {
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({ ...prev, feedback: snap.size }));
    });

    // Realtime Users
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    // Get Task Count (One-time or could be realtime too)
    const getTaskCount = async () => {
      const snap = await getDocs(collection(db, 'tasks'));
      setStats(prev => ({ ...prev, tasks: snap.size }));
    };
    getTaskCount();

    return () => {
      unsubFeedback();
      unsubUsers();
    };
  }, [user]);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="page-shell">
      <div className="aurora-bg">
        <div className="aurora-gradient-1"></div>
        <div className="aurora-gradient-2"></div>
      </div>

      <header className="dashboard-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'white' }}>Admin Hub</h1>
          <p style={{ color: '#BBFF00', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
            System Integrity & Oversight
          </p>
        </div>
      </header>

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '1.25rem' }}>
        {(['overview', 'users', 'feedback'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '0.875rem',
              border: 'none',
              background: activeTab === tab ? '#BBFF00' : 'transparent',
              color: activeTab === tab ? '#064e3b' : '#64748b',
              fontWeight: 900,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <main style={{ paddingBottom: '4rem' }}>
        {activeTab === 'overview' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#10b981', marginBottom: '0.5rem', fontSize: '20px' }}>group</span>
          <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{stats.users}</h4>
          <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Users</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#3b82f6', marginBottom: '0.5rem', fontSize: '20px' }}>task_alt</span>
          <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{stats.tasks}</h4>
          <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Tasks</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#f59e0b', marginBottom: '0.5rem', fontSize: '20px' }}>forum</span>
          <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{stats.feedback}</h4>
          <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Feedback</p>
        </div>
      </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Recent Signups</h3>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Live Users</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {users.slice(0, 3).map(u => (
                   <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                     <div>
                       <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{u.name}</div>
                       <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</div>
                     </div>
                     <span style={{ fontSize: '0.75rem', fontWeight: 900, color: u.role === 'admin' ? '#BBFF00' : '#64748b' }}>{u.role?.toUpperCase() || 'USER'}</span>
                   </div>
                 ))}
                 {users.length === 0 && (
                   <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>No users found.</div>
                 )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase' }}>Recent Feedback</h3>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Live Feed</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {feedbacks.slice(0, 3).map(f => (
                   <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{f.userName || 'Anonymous'}</div>
                       <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{new Date(f.createdAt).toLocaleDateString()}</div>
                     </div>
                     <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>"{f.message}"</div>
                   </div>
                 ))}
                 {feedbacks.length === 0 && (
                   <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>No feedback received yet.</div>
                 )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {users.map(u => (
              <div key={u.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'white' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                  <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '4px' }}>Last: {u.lastLoginTime ? new Date(u.lastLoginTime).toLocaleString() : 'Never'}</div>
                </div>
                <select 
                  value={u.role || 'user'} 
                  onChange={(e) => updateUserRole(u.id, e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.7rem', fontWeight: 900, padding: '4px 8px', borderRadius: '8px' }}
                >
                  <option value="user">USER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {feedbacks.map(f => (
              <div key={f.id} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>{f.userName || 'Anonymous'}</span>
                  <span style={{ fontSize: '0.65rem', color: '#475569' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>{f.message}</p>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  {f.type && (
                    <span style={{ fontSize: '9px', fontWeight: 900, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>{f.type}</span>
                  )}
                </div>
              </div>
            ))}
            {feedbacks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>forum</span>
                <p style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '10px' }}>No feedback received</p>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default AdminDashboard;
