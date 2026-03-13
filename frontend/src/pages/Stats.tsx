import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

interface Task {
  id: string;
  status: 'pending' | 'completed';
  category: string;
}

const Stats: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.id.toString())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(taskList);
    }, (err) => {
      console.error('Firestore stats error:', err);
    });

    return () => unsubscribe();
  }, [user]);

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const categories = Array.from(new Set(tasks.map(t => t.category || 'Focus')));
  const categoryStats = categories.map(cat => {
    const catTasks = tasks.filter(t => (t.category || 'Focus') === cat);
    const catCompleted = catTasks.filter(t => t.status === 'completed').length;
    return {
      name: cat,
      total: catTasks.length,
      completed: catCompleted,
      rate: Math.round((catCompleted / catTasks.length) * 100)
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="page-shell">
      <div className="aurora-bg">
        <div className="aurora-gradient-1"></div>
        <div className="aurora-gradient-2"></div>
      </div>

      <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'white' }}>Performance</h1>
          <p style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
            Milestones & Consistency
          </p>
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Main Scorecard */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '1.5rem' }}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle
                cx="80" cy="80" r="70"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="12"
              />
              <circle
                cx="80" cy="80" r="70"
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * completionRate) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>{completionRate}%</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Productive Ratio</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%' }}>
            <div>
              <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{completed}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Completed</span>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{pending}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Waiting</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <section>
          <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>Category Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categoryStats.map(stat => (
              <div key={stat.name} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>{stat.name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981' }}>{stat.rate}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      background: '#10b981', 
                      width: `${stat.rate}%`,
                      transition: 'width 1s ease-out'
                    }} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{stat.completed} milestones hit</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{stat.total} total</span>
                </div>
              </div>
            ))}

            {categoryStats.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 0', opacity: 0.3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>analytics</span>
                <p style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '10px' }}>No data available yet</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Stats;
