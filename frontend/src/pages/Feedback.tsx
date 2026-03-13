import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

type FeedbackType = 'issue' | 'feedback' | 'feature';

const FEEDBACK_TYPES: { type: FeedbackType; icon: string; label: string; desc: string; color: string }[] = [
  { type: 'issue', icon: 'bug_report', label: 'Report Issue', desc: 'Something broken?', color: '#f87171' },
  { type: 'feedback', icon: 'rate_review', label: 'Give Feedback', desc: 'Share your thoughts', color: '#60a5fa' },
  { type: 'feature', icon: 'lightbulb', label: 'Feature Request', desc: 'Suggest new idea', color: '#fbbf24' },
];

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const q = query(
        collection(db, 'feedback'),
        where('userId', '==', user?.id.toString()),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const snapshot = await getDocs(q);
      const userHistory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(userHistory);
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) { setError('Please select a feedback type'); return; }
    if (description.trim().length < 10) { setError('Please provide at least 10 characters'); return; }

    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user?.id.toString() || 'anonymous',
        userName: user?.name || 'Anonymous',
        userEmail: user?.email || '',
        type: selectedType,
        description: description.trim(),
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      fetchHistory(); 
    } catch (err: any) {
      console.error('Firestore submission error:', err);
      setError('Failed to submit to cloud. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen w-full page-responsive flex-col items-center justify-center bg-[var(--bg-color)] text-[var(--text-main)] font-display p-8">
        <div className="aurora-bg"><div className="aurora-gradient-1"></div><div className="aurora-gradient-2"></div></div>
        <div className="relative z-10 text-center">
          <div className="size-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-emerald-400">check_circle</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Thank You!</h2>
          <p className="text-slate-400 text-base mb-8">Your feedback helps make PENDING better for everyone.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setSuccess(false); setSelectedType(null); setDescription(''); }}
              className="glow-btn-primary px-8 h-12 rounded-2xl font-bold"
            >
              Send More Feedback
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="text-slate-500 hover:text-white font-bold text-sm"
            >
              Back to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-black tracking-tight">Feedback</h1>
          <p className="text-slate-500 text-xs font-medium">Help us improve PENDING</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-6 relative z-10 flex flex-col gap-6 mb-12">

        {/* Type selection */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">What's this about?</p>
          <div className="flex flex-col gap-3">
            {FEEDBACK_TYPES.map(({ type, icon, label, desc, color }) => (
              <button
                key={type}
                type="button"
                onClick={() => { setSelectedType(type); setError(''); }}
                className={`glass-card rounded-2xl p-4 flex items-center gap-4 transition-all border text-left ${
                  selectedType === type
                    ? 'border-[var(--primary)] bg-emerald-500/5'
                    : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]'
                }`}
              >
                <div
                  className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[var(--text-main)] text-sm">{label}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
                {selectedType === type && (
                  <span className="material-symbols-outlined text-emerald-400 text-xl flex-shrink-0">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        {selectedType && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Describe in detail</p>
            <textarea
              value={description}
              onChange={e => { setDescription(e.target.value); setError(''); }}
              placeholder={
                selectedType === 'issue' ? "What went wrong? What were you doing when it happened?"
                : selectedType === 'feedback' ? "What do you love or want improved about the app?"
                : "Describe the feature idea and how it would help you..."
              }
              rows={6}
              className="w-full bg-white/5 rounded-2xl p-5 border border-white/10 focus:border-emerald-500 outline-none text-white text-sm leading-relaxed resize-none"
            />
            <p className="text-right text-slate-600 text-xs mt-1">{description.length} / 500</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedType || description.trim().length < 10}
          className="glow-btn-primary w-full h-14 rounded-2xl font-bold text-base tracking-tight disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">send</span>
              Submit Feedback
            </>
          )}
        </button>
      </form>

      {/* History section */}
      {history.length > 0 && (
        <section className="px-6 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Your Recent Submissions</p>
          <div className="flex flex-col gap-3">
            {history.map((item) => (
              <div key={item.id} className="glass-card p-4 border-white/5 bg-white/[0.02] rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold uppercase py-0.5 px-2 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    {item.type}
                  </span>
                  <span className="text-[9px] text-slate-600 font-medium">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 italic">"{item.description}"</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Feedback;
