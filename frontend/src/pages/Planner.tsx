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

  // Group tasks by date
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
    <div className="relative flex min-h-screen w-full page-responsive flex-col bg-[var(--bg-color)] text-[var(--text-main)] font-display pb-32 overflow-hidden">
      <div className="aurora-bg">
        <div className="aurora-gradient-1"></div>
        <div className="aurora-gradient-2"></div>
      </div>

      <header className="p-6 pt-10 relative z-10 border-b border-white/5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-[var(--text-main)]">Timeline</h1>
            <p className="text-emerald-500/80 text-sm font-bold tracking-widest uppercase mt-1">Archived & Active</p>
          </div>
          <div className="flex gap-3">
             <button 
                className={`size-12 rounded-2xl flex items-center justify-center transition-all ${showAll ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 border border-white/10 text-[var(--text-main)]'}`}
                onClick={() => setShowAll(!showAll)}
             >
                <span className="material-symbols-outlined">{showAll ? 'visibility' : 'visibility_off'}</span>
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 relative z-10">
        <div className="space-y-12 pb-10">
           {dateKeys.map(dateKey => {
             const isToday = dateKey === new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
             const displayDate = isToday ? 'Today' : dateKey;
             const groupTasks = groupedTasks[dateKey];

             return (
               <div key={dateKey} className="space-y-6">
                 <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">{displayDate}</h3>
                    <div className="flex-1 h-px bg-white/5"></div>
                 </div>

                 <div className="space-y-6 relative ml-2">
                    {/* Vertical Line for Group */}
                    <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent rounded-full"></div>

                    {groupTasks.map((task) => {
                      const taskDate = new Date(task.createdAt);
                      const isCompleted = task.status === 'completed';
                      
                      return (
                        <div key={task.id} className={`flex gap-6 group transition-all duration-500 ${isCompleted ? 'opacity-60' : ''}`}>
                           <div className="flex flex-col items-center pt-2 relative">
                              <div className={`size-12 rounded-2xl flex items-center justify-center z-10 transition-all duration-300
                                ${!isCompleted ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-900 border border-white/10 text-slate-500'}`}>
                                 <span className="text-xs font-black">{taskDate.getDate()}</span>
                              </div>
                              {!isCompleted && isToday && (
                                <div className="absolute -inset-1 blur-md bg-emerald-500/20 rounded-2xl animate-pulse"></div>
                              )}
                           </div>
                           
                           <div className={`flex-1 glass-card rounded-3xl p-5 border transition-all duration-300 group-hover:translate-x-1
                             ${!isCompleted ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                              <div className="flex justify-between items-start">
                                 <div className="flex flex-col">
                                   <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCompleted ? 'text-slate-600' : 'text-emerald-500'}`}>
                                     {task.category || 'Focus'} • <span className={`priority-tag priority-${task.priority || 'Medium'}`} style={{ verticalAlign: 'middle', margin: '0 4px', padding: '1px 4px' }}>{task.priority || 'Medium'}</span>
                                   </span>
                                   <h4 className={`font-bold text-base leading-tight ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                                     {task.title}
                                   </h4>
                                 </div>
                                 <div className="ml-4 flex gap-2">
                                   <span 
                                     onClick={() => deleteTask(task.id)}
                                     className="material-symbols-outlined text-lg text-slate-600 hover:text-red-500 transition-colors cursor-pointer"
                                   >
                                     delete
                                   </span>
                                   <span 
                                     onClick={() => toggleTaskStatus(task)}
                                     className={`material-symbols-outlined text-lg transition-colors cursor-pointer ${isCompleted ? 'text-emerald-500' : 'text-slate-600 hover:text-white'}`}
                                   >
                                     {isCompleted ? 'check_circle' : 'circle'}
                                   </span>
                                 </div>
                              </div>
                           </div>
                        </div>
                      );
                    })}
                 </div>
               </div>
             );
           })}
           
           {dateKeys.length === 0 && (
             <div className="text-center py-20 opacity-30">
                <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
                <p className="font-bold uppercase tracking-widest text-xs">No tasks found</p>
             </div>
           )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Planner;
