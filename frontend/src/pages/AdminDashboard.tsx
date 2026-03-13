import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const AdminDashboard: React.FC = () => {
  const { user: currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'feedback' | 'settings'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Realtime Firebase Users & Feedback
  useEffect(() => {
    const qUsers = query(collection(db, "users"), orderBy("updatedAt", "desc"));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList as any);
      setLoading(false);
    });

    const qFeedback = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    const unsubFeedback = onSnapshot(qFeedback, (snapshot) => {
      const fbList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeedback(fbList as any);
    });

    return () => {
      unsubUsers();
      unsubFeedback();
    };
  }, []);

  // Fetch backend stats (remaining non-firebase data)
  const fetchBackendData = async () => {
    try {
      const statsRes = await axios.get(`${API_URL}/admin/stats`);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Backend admin data fetch error:', err);
    }
  };

  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 60000); 
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'users', label: 'Users', icon: 'group' },
    { id: 'feedback', label: 'Feedback', icon: 'chat_bubble' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const filteredUsers = users.filter((u: any) => 
    (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      // Also sync to backend if needed, but let's stick to Firebase as primary if that's the request
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user identity forever?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh] py-20">
          <div className="size-12 border-4 border-[#BBFF00]/20 border-t-[#BBFF00] rounded-full animate-spin"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col lg:flex-row gap-8 pb-32 text-white min-h-[80vh]">
        
        {/* Sidebar Local Menu */}
        <aside className="lg:w-64 flex flex-col gap-6">
          <div className="flex flex-col gap-1 px-4">
            <h1 className="text-2xl font-black tracking-tight uppercase italic text-[#BBFF00]">Admin Hub</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none">Realtime Control</p>
          </div>
          
          <nav className="flex lg:flex-col gap-2 p-2 bg-white/[0.03] rounded-[2rem] border border-white/5 overflow-x-auto lg:overflow-visible">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap lg:whitespace-normal ${
                  activeTab === item.id 
                    ? 'bg-[#BBFF00] text-black shadow-[0_0_20px_rgba(187,255,0,0.3)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex flex-col gap-2 mt-4 px-2">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              User App
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Dynamic Content Area */}
        <main className="flex-1 flex flex-col gap-8">
          
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                {navItems.find(n => n.id === activeTab)?.label}
              </h2>
              <div className="h-1 w-12 bg-[#BBFF00] rounded-full"></div>
            </div>
            {activeTab === 'users' && (
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                <input 
                  type="text" 
                  placeholder="Search identity..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-bold focus:outline-none focus:border-[#BBFF00]/50 transition-colors w-64"
                />
              </div>
            )}
          </header>

          {activeTab === 'overview' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="glass-card p-6 bg-[#1A1A1A] border-white/5 rounded-[2rem] flex flex-col gap-4 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 size-24 bg-[#BBFF00]/5 rounded-full blur-2xl group-hover:bg-[#BBFF00]/10 transition-all"></div>
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#BBFF00] text-xl">group</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#BBFF00]/10 text-[#BBFF00]">
                         REALTIME
                       </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Signuped</p>
                    <h3 className="text-4xl font-black text-white">{users.length}</h3>
                    <div className="flex gap-3 mt-2">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Admins</span>
                          <span className="text-xs font-black text-[#BBFF00]">{users.filter(u => u.role === 'admin').length}</span>
                       </div>
                       <div className="flex flex-col border-l border-white/5 pl-3">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Regulars</span>
                          <span className="text-xs font-black text-white">{users.filter(u => u.role !== 'admin').length}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {[
                  { label: 'System Tasks', value: stats?.totalTasks || 0, trend: 'Backend', icon: 'task_alt' },
                  { label: 'Feedbacks', value: feedback.length, trend: 'Recent', icon: 'chat_bubble' },
                  { label: 'Health', value: stats?.systemHealth || '100%', trend: 'Operational', icon: 'bolt' }
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-6 bg-[#1A1A1A] border-white/5 rounded-[2rem] flex flex-col gap-4 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 size-24 bg-[#BBFF00]/5 rounded-full blur-2xl group-hover:bg-[#BBFF00]/10 transition-all"></div>
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#BBFF00] text-xl">{stat.icon}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-[#BBFF00]">
                        {stat.trend}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                      <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="glass-card bg-[#1A1A1A] border-white/5 rounded-[2rem] p-8 flex flex-col gap-6">
                   <h3 className="text-lg font-black uppercase italic text-slate-400">Live Activity Feed</h3>
                   <div className="flex flex-col gap-4">
                      {users.slice(0, 5).map((u, i) => (
                        <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                           <div className="size-2 rounded-full bg-[#BBFF00]"></div>
                           <p className="text-sm text-slate-400 flex-1"><span className="text-white font-bold">{u.name || u.email}</span> joined the board.</p>
                           <span className="text-[10px] text-slate-600 font-bold uppercase">{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card bg-[#1A1A1A] border-white/5 rounded-[2rem] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Realtime Identity</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Access Level</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Registration</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Admin Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u: any, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold group-hover:text-[#BBFF00] transition-colors">{u.name || 'Firebase User'}</span>
                            <span className="text-[10px] text-slate-500">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <select 
                            value={u.role || 'user'}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-transparent border border-white/10 cursor-pointer focus:outline-none focus:border-[#BBFF00] ${u.role === 'admin' ? 'text-[#BBFF00]' : 'text-slate-400'}`}
                          >
                            <option value="user" className="bg-[#1A1A1A]">User</option>
                            <option value="admin" className="bg-[#1A1A1A]">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-mono text-slate-400">
                            {u.lastLoginTime ? new Date(u.lastLoginTime).toLocaleString() : (u.createdAt ? new Date(u.createdAt).toLocaleString() : 'Never')}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="size-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all active:scale-90"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                            <button className="size-9 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10 transition-all">
                              <span className="material-symbols-outlined text-sm">history</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {feedback.map((f, i) => (
                <div key={i} className="glass-card p-6 bg-[#1A1A1A] border-white/5 rounded-3xl flex flex-col gap-4 hover:border-[#BBFF00]/20 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-2 rounded-full bg-[#BBFF00] shadow-[0_0_8px_#BBFF00]"></div>
                      <span className="text-[10px] font-black uppercase text-[#BBFF00] tracking-widest">{f.type}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono font-bold uppercase">{f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Dec 2023'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400">{f.userName || 'Anonymous'} ({f.userEmail || 'No Email'})</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                      {f.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">ID: ...{f.userId?.slice(-6) || 'Anon'}</span>
                     </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-[#BBFF00] text-black text-[10px] font-black uppercase transition-transform active:scale-95">Resolve</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-card p-8 bg-[#1A1A1A] border-white/5 rounded-[2rem] flex flex-col gap-6">
                    <h3 className="text-xl font-black uppercase italic text-white">Global Access</h3>
                    <div className="flex flex-col gap-5">
                       <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="text-sm font-bold">Registration Lock</span>
                             <span className="text-[10px] text-slate-500">Prevent new user signups</span>
                          </div>
                          <div className="size-10 rounded-full bg-white/5 flex items-center justify-around cursor-pointer">
                             <div className="size-6 rounded-full bg-slate-700"></div>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

        </main>
      </div>

      {/* Admin Footer */}
      <footer className="fixed bottom-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-[#BBFF00] animate-pulse"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authenticated: {currentUser?.email}</p>
        </div>
        <div className="flex gap-6">
          <button className="text-[10px] font-black uppercase tracking-widest text-[#BBFF00] hover:underline">Support Hub</button>
          <button className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">API V4.0 (Realtime Enabled)</button>
        </div>
      </footer>
    </PageShell>
  );
};

export default AdminDashboard;
