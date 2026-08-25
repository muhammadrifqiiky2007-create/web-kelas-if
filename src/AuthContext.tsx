import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, collection } from 'firebase/firestore';
import { auth, db } from './firebase';

interface ActiveSession {
  id: string;
  email: string;
  device: string;
  lastActive: any;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  sessionId: string | null;
  activeSessions: ActiveSession[];
  logout: () => Promise<void>;
  kickSession: (sessionIdToKick: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  sessionId: null,
  activeSessions: [],
  logout: async () => {},
  kickSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  // Deteksi info perangkat
  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Android Device';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Device';
    if (/windows/i.test(ua)) return 'Windows PC';
    if (/mac/i.test(ua)) return 'Mac OS';
    if (/linux/i.test(ua)) return 'Linux PC';
    return 'Unknown Device';
  };

  // Fungsi pembersihan total penyimpanan lokal
  const clearLocalAuthData = () => {
    localStorage.removeItem('admin_session_id');
    localStorage.clear();
    sessionStorage.clear();
  };

  useEffect(() => {
    // Memaksa persitensi auth hanya untuk sesi browser aktif (tidak auto-login saat tab ditutup total/relocate jika dikeluarkann)
    setPersistence(auth, browserSessionPersistence).catch(() => {});

    let currentSessionId = localStorage.getItem('admin_session_id');

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        if (!currentSessionId) {
          currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('admin_session_id', currentSessionId);
        }
        setSessionId(currentSessionId);

        // Catat sesi di Firestore
        const sessionRef = doc(db, 'active_sessions', currentSessionId);
        await setDoc(sessionRef, {
          email: currentUser.email || 'Admin',
          device: getDeviceName(),
          lastActive: serverTimestamp(),
        }, { merge: true });

        // Listener jika sesi di-kick oleh admin lain
        const unsubscribeMySession = onSnapshot(doc(db, 'active_sessions', currentSessionId), async (snapshot) => {
          if (!snapshot.exists()) {
            // Langsung hentikan listener dan keluar tanpa modal/popup confirmation
            unsubscribeMySession();
            clearLocalAuthData();
            setSessionId(null);
            setUser(null);
            await signOut(auth);
          }
        });

        return () => unsubscribeMySession();
      } else {
        if (currentSessionId) {
          await deleteDoc(doc(db, 'active_sessions', currentSessionId)).catch(() => {});
        }
        clearLocalAuthData();
        setSessionId(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time listener daftar sesi aktif
  useEffect(() => {
    if (!user) {
      setActiveSessions([]);
      return;
    }

    const unsubscribeList = onSnapshot(collection(db, 'active_sessions'), (snapshot) => {
      const sessions: ActiveSession[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ActiveSession[];
      setActiveSessions(sessions);
    });

    return () => unsubscribeList();
  }, [user]);

  // Fungsi Logout Manual tanpa konfirmasi & bersih total
  const logout = async () => {
    const currentSessionId = localStorage.getItem('admin_session_id');
    if (currentSessionId) {
      await deleteDoc(doc(db, 'active_sessions', currentSessionId)).catch(() => {});
    }
    clearLocalAuthData();
    setSessionId(null);
    setUser(null);
    await signOut(auth);
  };

  // Fungsi Kick Sesi Admin Lain
  const kickSession = async (sessionIdToKick: string) => {
    await deleteDoc(doc(db, 'active_sessions', sessionIdToKick));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: !!user,
        sessionId,
        activeSessions,
        logout,
        kickSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};