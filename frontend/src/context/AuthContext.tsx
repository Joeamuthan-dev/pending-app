import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthContextType {
  user: { id: string | number; name?: string; email: string; role?: string } | null;
  login: (userData: { id: string | number; name?: string; email: string; role?: string }) => Promise<{ role?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ id: string | number; name?: string; email: string; role?: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = async (userData: { id: string | number; name?: string; email: string; role?: string }): Promise<{ role?: string }> => {
    // Determine role immediately for speed
    const role = userData.email === 'joeamuthan2@gmail.com' ? 'admin' : 'user';
    
    const updatedUser = { ...userData, role };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // BACKGROUND: Maintain user details in Firestore for admin purpose
    // We don't await this to keep login fast
    setDoc(doc(db, 'users', userData.id.toString()), {
      name: userData.name || '',
      email: userData.email,
      role: role,
      lastLoginTime: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(err => console.error('Firestore back-sync error:', err));

    return { role };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
