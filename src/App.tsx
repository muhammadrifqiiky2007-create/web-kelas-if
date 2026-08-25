/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Users, Image as ImageIcon, Calendar, LogIn, LogOut, Shield, Home as HomeIcon, Settings } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { logOut, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import Home from './pages/Home';
import Members from './pages/Members';
import Gallery from './pages/Gallery';
import Schedule from './pages/Schedule';
import { LoginModal } from './components/LoginModal';
import { SettingsModal } from './components/SettingsModal';

function Sidebar() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [classInfo, setClassInfo] = useState({ className: "Vanguard '24", logoData: '' });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'class_info'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setClassInfo({
          className: data.className || "Vanguard '24",
          logoData: data.logoData || ''
        });
      }
    });
    return unsub;
  }, []);
  
  const navItems = [
    { path: '/', label: 'Beranda', icon: <HomeIcon size={18} /> },
    { path: '/members', label: 'Struktur Kelas', icon: <Users size={18} /> },
    { path: '/gallery', label: 'Galeri Momen', icon: <ImageIcon size={18} /> },
    { path: '/schedule', label: 'Jadwal Kuliah', icon: <Calendar size={18} /> },
  ];

  return (
    <>
      {/* Mobile Top Nav */}
      <nav className="md:hidden sticky top-0 z-50 w-full bg-white border-b border-slate-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-indigo-100">
              {classInfo.logoData ? <img src={classInfo.logoData} alt="Logo" className="w-full h-full object-cover" /> : 'V'}
            </div>
            <span className="font-bold text-slate-900 truncate max-w-[150px]">{classInfo.className}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors flex items-center ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {item.icon}
                </Link>
              );
            })}
          </div>
        </div>
        {isAdmin && (
          <div className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 text-center flex items-center justify-center gap-1">
            <Shield size={12} />
            Admin Active
          </div>
        )}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 bg-white p-6 flex-col justify-between shrink-0 h-screen sticky top-0">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden border border-indigo-100">
              {classInfo.logoData ? <img src={classInfo.logoData} alt="Logo" className="w-full h-full object-cover" /> : 'V'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-slate-900 leading-tight truncate">{classInfo.className}</h1>
              <p className="text-xs text-slate-400">Class Portal</p>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
          {user ? (
            <>
              {isAdmin && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Admin Active</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                  {user.photoURL ? <img src={user.photoURL} alt="Admin" className="w-full h-full object-cover" /> : (user.email?.[0]?.toUpperCase() || 'A')}
                </div>
                <div className="text-xs overflow-hidden flex-1">
                  <p className="font-semibold text-slate-900 truncate">{user.displayName || 'Admin'}</p>
                  <div className="flex gap-2 mt-0.5">
                    {isAdmin && (
                      <button onClick={() => setShowSettingsModal(true)} className="text-indigo-600 hover:underline font-medium text-[10px] flex items-center gap-1">
                        <Settings size={10} /> Seting
                      </button>
                    )}
                    <button onClick={logOut} className="text-red-600 hover:underline font-medium text-[10px] flex items-center gap-1">
                      <LogOut size={10} /> Keluar
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-2">Login sebagai Admin untuk mengelola data kelas.</p>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
              >
                <LogIn size={14} /> Login Admin
              </button>
            </div>
          )}
        </div>
      </aside>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
    </>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-5xl mx-auto"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col md:flex-row min-h-screen bg-[#F7F9FC] font-sans text-slate-700 selection:bg-indigo-100 selection:text-indigo-900">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/members" element={<PageWrapper><Members /></PageWrapper>} />
              <Route path="/gallery" element={<PageWrapper><Gallery /></PageWrapper>} />
              <Route path="/schedule" element={<PageWrapper><Schedule /></PageWrapper>} />
            </Routes>
            <footer className="w-full py-8 text-center text-slate-400 text-xs mt-12">
              <p>&copy; {new Date().getFullYear()} Portal Kelas. All rights reserved.</p>
            </footer>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
