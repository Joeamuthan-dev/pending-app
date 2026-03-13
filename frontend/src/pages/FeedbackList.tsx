import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

interface FeedbackItem {
  id: number;
  user_id: string;
  type: string;
  description: string;
  created_at: string;
}

const FeedbackList: React.FC = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get(`${API_URL}/feedback`);
      setFeedbacks(response.data);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'issue': return '#f87171';
      case 'feedback': return '#60a5fa';
      case 'feature': return '#fbbf24';
      default: return '#94a3b8';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'issue': return 'Issue';
      case 'feedback': return 'Feedback';
      case 'feature': return 'Feature';
      default: return type;
    }
  };

  return (
    <div className="relative flex min-h-screen w-full page-responsive flex-col bg-[var(--bg-color)] text-[var(--text-main)] font-display pb-12">
      <div className="aurora-bg"><div className="aurora-gradient-1"></div><div className="aurora-gradient-2"></div></div>

      <header className="p-6 pt-12 flex items-center gap-4 relative z-10">
        <button
          onClick={() => navigate('/settings')}
          className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">All Feedback</h1>
          <p className="text-slate-500 text-xs font-medium">User submissions review</p>
        </div>
      </header>

      <main className="px-6 relative z-10 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Loading feedbacks...</p>
          </div>
        ) : error ? (
          <div className="glass-card p-6 border-red-500/20 bg-red-500/5 text-center">
            <span className="material-symbols-outlined text-red-400 text-4xl mb-2">error</span>
            <p className="text-red-400 font-bold">{error}</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="glass-card p-12 border-white/5 bg-white/[0.02] text-center rounded-3xl">
            <span className="material-symbols-outlined text-slate-600 text-5xl mb-4">forum</span>
            <p className="text-slate-400 font-medium">No feedback received yet.</p>
          </div>
        ) : (
          feedbacks.map((item) => (
            <div key={item.id} className="glass-card p-5 border-white/5 bg-white/[0.03] rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{ background: `${getTypeColor(item.type)}20`, color: getTypeColor(item.type), border: `1px solid ${getTypeColor(item.type)}40` }}
                  >
                    {getTypeLabel(item.type)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    ID: {item.user_id?.slice(0, 8) || 'Guest'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed italic">
                "{item.description}"
              </p>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default FeedbackList;
