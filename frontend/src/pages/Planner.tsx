import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
}

const Planner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAll, setShowAll] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.id.toString()),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(taskList);
    }, (err) => {
      console.error('Firestore tasks error:', err);
    });

    return () => unsubscribe();
  }, [user]);

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };


  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === b.status) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.status === 'pending' ? -1 : 1;
  });

  const groupTasksByDate = (tasksToGroup: Task[]) => {
    const groups: { [key: string]: Task[] } = {};
    tasksToGroup.forEach(task => {
      const date = new Date(task.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(task);
    });
    return groups;
  };

  const groupedTasks = groupTasksByDate(showAll ? sortedTasks : sortedTasks.filter(t => t.status === 'pending'));
  const dateKeys = Object.keys(groupedTasks);

  return (
    <div className="page-shell">
      <div className="aurora-bg">
        <div className="aurora-gradient-1"></div>
        <div className="aurora-gradient-2"></div>
      </div>

      <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'white' }}>Timeline</h1>
            <p style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
              Archived & Active
            </p>
          </div>
          <button 
            onClick={() => setShowAll(!showAll)}
            style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '14px', 
              background: showAll ? '#10b981' : 'rgba(255,255,255,0.05)', 
              border: 'none', 
              color: showAll ? '#064e3b' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <span className="material-symbols-outlined">{showAll ? 'visibility' : 'visibility_off'}</span>
          </button>
        </div>
      </header>

      <main>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {dateKeys.map(dateKey => {
            const isToday = dateKey === new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
            const displayDate = isToday ? 'Today' : dateKey;
            const groupTasks = groupedTasks[dateKey];

            return (
              <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>{displayDate}</h3>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                  {groupTasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    return (
                      <div 
                        key={task.id} 
                        className={`glass-card task-card ${isCompleted ? 'completed' : ''}`}
                        style={{ padding: '1rem', opacity: isCompleted ? 0.6 : 1 }}
                      >
                        <div 
                          className={`checkbox-custom ${isCompleted ? 'checked' : ''}`}
                          onClick={() => toggleTaskStatus(task)}
                          style={{ width: '1.5rem', height: '1.5rem', borderRadius: '0.5rem', flexShrink: 0 }}
                        >
                          {isCompleted && <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: 'white' }}>check</span>}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: isCompleted ? '#64748b' : '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {task.category || 'Focus'}
                            </span>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>•</span>
                            <span className={`priority-tag priority-${task.priority}`} style={{ padding: '1px 4px', fontSize: '9px' }}>
                              {task.priority}
                            </span>
                          </div>
                          <h4 style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 700, 
                            margin: 0, 
                            color: isCompleted ? '#64748b' : 'white',
                            textDecoration: isCompleted ? 'line-through' : 'none'
                          }}>
                            {task.title}
                          </h4>
                        </div>

                        <button 
                          onClick={() => deleteTask(task.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', padding: '0.25rem', cursor: 'pointer', opacity: 0.6 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {dateKeys.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.3 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem' }}>event_busy</span>
              <p style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '10px' }}>No tasks found</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Planner;
