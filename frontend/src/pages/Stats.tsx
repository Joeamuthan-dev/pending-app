import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const API_URL = 'http://localhost:3001/api';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  category: string;
  created_at: string;
}

const Stats: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks?userId=${user?.id}`);
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const productivityScore = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Find Focus Day (most active day)
  const getFocusDay = () => {
    if (tasks.length === 0) return 'None';
    const dayCounts: Record<string, number> = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    tasks.forEach(task => {
      const day = days[new Date(task.created_at).getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.entries(dayCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  };

  const focusDay = getFocusDay();

  // Category Distribution
  const getCategoryStats = () => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      const cat = t.category || 'Business';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const icons: Record<string, string> = {
      'Business': 'business_center',
      'Personal': 'person',
      'Health': 'fitness_center',
      'Content': 'movie_edit'
    };

    return Object.entries(counts).map(([label, count]) => ({
      label,
      count,
      percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      icon: icons[label] || 'label'
    })).sort((a,b) => b.count - a.count);
  };

  const categoryTrends = getCategoryStats();

  return (
    <div className="relative flex min-h-screen w-full page-responsive flex-col bg-[var(--bg-color)] text-[var(--text-main)] font-display overflow-x-hidden pb-32">
      <div className="aurora-bg">
        <div className="aurora-gradient-1"></div>
        <div className="aurora-gradient-2"></div>
      </div>

      <header className="flex items-center bg-transparent p-6 pb-2 justify-between sticky top-0 z-10 border-b border-white/5 backdrop-blur-md">
        <div 
          onClick={() => navigate(-1)}
          className="text-[var(--text-main)] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </div>
        <h1 className="text-[var(--text-main)] text-lg font-bold leading-tight tracking-tight flex-1 text-center">{t('stats')}</h1>
        <div className="flex w-10 items-center justify-end">
          <button 
            onClick={() => navigate('/settings')}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[var(--text-main)]">settings</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 pt-4">
        {/* Weekly Recap Card */}
        <div className="mb-8 overflow-hidden relative">
          <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white text-lg font-black tracking-tight">{t('weekly_recap')}</h3>
                <p className="text-slate-400 text-xs font-semibold">{t('performance_overview')}</p>
              </div>
              <div className="bg-emerald-500 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {t('real_time')}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('generated')}</p>
                <p className="text-2xl font-black text-white">{totalCount} <span className="text-xs text-slate-500 font-bold">{t('tasks')}</span></p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('efficiency')}</p>
                <p className="text-2xl font-black text-white">{productivityScore}% <span className="text-xs text-slate-500 font-bold">{t('rate')}</span></p>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">{t('productivity_score')}</p>
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]">
            <div className="h-44 w-full flex items-center justify-center relative">
              <svg className="size-40 transform -rotate-90">
                <circle className="text-slate-800" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="10"></circle>
                <circle 
                  className="text-[#22C55E] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" 
                  cx="80" cy="80" 
                  fill="transparent" 
                  r="70" 
                  stroke="currentColor" 
                  strokeWidth="10" 
                  strokeDasharray="439.8" 
                  strokeDashoffset={439.8 - (439.8 * productivityScore / 100)} 
                  strokeLinecap="round"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight">{productivityScore}%</span>
                <div className="flex items-center gap-1 text-[#22C55E] text-xs font-semibold mt-1">
                  <span className="material-symbols-outlined text-xs">emoji_events</span> Mastery
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 size-48 bg-[#22C55E]/5 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex flex-col gap-2 rounded-2xl p-5 glass-card bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]">
            <div className="flex items-center gap-2 text-[#22C55E]">
              <span className="material-symbols-outlined text-xl">check_circle</span>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Completed</p>
            </div>
            <p className="text-slate-100 text-2xl font-bold leading-tight">{completedCount}</p>
            <p className="text-slate-500 text-xs">Out of {totalCount} total</p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl p-5 glass-card bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]">
            <div className="flex items-center gap-2 text-[#22C55E]">
              <span className="material-symbols-outlined text-xl">bolt</span>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Focus Day</p>
            </div>
            <p className="text-slate-100 text-2xl font-bold leading-tight">{focusDay}</p>
            <p className="text-slate-500 text-xs">Peak activity</p>
          </div>
        </div>


        <div className="mb-8">
          <h3 className="text-slate-100 text-xl font-bold tracking-tight mb-4">Category Impact</h3>
          <div className="flex flex-col gap-3">
            {categoryTrends.map((trend) => (
              <div key={trend.label} className="flex items-center gap-4 glass-card p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]">
                <div className="size-10 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
                  <span className="material-symbols-outlined">{trend.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold text-sm">{trend.label}</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase">{trend.count} tasks</p>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" style={{ width: `${trend.percent}%` }}></div>
                   </div>
                </div>
              </div>
            ))}
            {categoryTrends.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-10">No category data yet</p>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Stats;
