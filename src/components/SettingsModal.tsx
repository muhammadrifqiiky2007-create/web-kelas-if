import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Upload, Settings } from 'lucide-react';
import { getAuth, updateEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { compressImageToBase64 } from '../utils';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [className, setClassName] = useState('');
  const [logoData, setLogoData] = useState('');
  const [homeTitle, setHomeTitle] = useState('');
  const [homeSubtitle, setHomeSubtitle] = useState('');
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'class_info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClassName(data.className || '');
          setLogoData(data.logoData || '');
          setHomeTitle(data.homeTitle || '');
          setHomeSubtitle(data.homeSubtitle || '');
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImageToBase64(file);
        setLogoData(base64);
      } catch (error) {
        console.error("Failed to compress image", error);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Save Class Settings
      await setDoc(doc(db, 'settings', 'class_info'), {
        className,
        logoData,
        homeTitle,
        homeSubtitle
      }, { merge: true });

      // Update Auth Credentials if provided
      const auth = getAuth();
      const user = auth.currentUser;
      let credentialsUpdated = false;

      if (user && (newEmail || newPassword)) {
        if (newEmail) {
          await updateEmail(user, newEmail.trim());
          credentialsUpdated = true;
        }
        if (newPassword) {
          await updatePassword(user, newPassword);
          credentialsUpdated = true;
        }
      }

      setMessage({ 
        text: `Pengaturan berhasil disimpan.${credentialsUpdated ? ' Kredensial login diperbarui.' : ''}`, 
        type: 'success' 
      });
      
      // Clear password field after save
      setNewPassword('');
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'Gagal menyimpan pengaturan.';
      if (error.code === 'auth/requires-recent-login') {
        errorMsg = 'Gagal mengubah kredensial: Silakan logout dan login kembali sebelum mengubah kredensial.';
      }
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center w-full py-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative border border-slate-200"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Settings size={20} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Pengaturan Admin</h2>
          </div>
          
          {message.text && (
            <div className={`mb-6 p-3 text-sm rounded-xl border text-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            
            {/* Class Settings Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Profil Kelas</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Logo Kelas</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-400 text-xl">
                    {logoData ? <img src={logoData} alt="Logo" className="w-full h-full object-cover" /> : 'Logo'}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                      <Upload size={16} />
                      <span>Ubah Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas / Angkatan</label>
                <input 
                  type="text" 
                  value={className} 
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder="Vanguard '24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Utama Beranda</label>
                <input 
                  type="text" 
                  value={homeTitle} 
                  onChange={(e) => setHomeTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder="Kebersamaan & Cerita Dalam Satu Ruang"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sub-judul Beranda</label>
                <textarea 
                  value={homeSubtitle} 
                  onChange={(e) => setHomeSubtitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 resize-none h-20"
                  placeholder="Tempat menyimpan kenangan, mengenal lebih dekat anggota kelas, dan melihat jadwal perkuliahan secara real-time."
                />
              </div>
            </div>

            {/* Auth Settings Section */}
            <div className="space-y-4 mt-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Ganti Kredensial Login</h3>
              <p className="text-xs text-slate-500">Isi bagian ini HANYA JIKA Anda ingin mengubah email atau password admin saat ini.</p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Baru</label>
                <input 
                  type="email" 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  minLength={6}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
