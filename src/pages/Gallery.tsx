import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { GalleryItem } from '../types';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Edit2, Trash2, Upload, Calendar as CalendarIcon, Image as ImageIcon } from 'lucide-react';
import { compressImageToBase64 } from '../utils';

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem));
      setItems(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'gallery'));
    
    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus foto ini dari galeri?")) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'gallery');
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Galeri Kelas</h1>
          <p className="text-slate-500">Kumpulan momen dan kenangan tak terlupakan.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Tambah Momen</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-3xl w-full" style={{ height: `${Math.floor(Math.random() * (400 - 250) + 250)}px` }}></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada foto</h3>
          <p className="text-slate-500">Momen yang ditambahkan akan muncul di sini.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="relative group break-inside-avoid bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="w-full relative bg-slate-100">
                  <img src={item.photoData} alt={item.title} className="w-full h-auto object-cover" loading="lazy" />
                  
                  {isAdmin && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => openEditModal(item)} className="p-2 bg-white/90 backdrop-blur text-slate-700 hover:text-indigo-600 rounded-full shadow-sm transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-white/90 backdrop-blur text-slate-700 hover:text-red-600 rounded-full shadow-sm transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-2">
                    <CalendarIcon size={12} />
                    <span>{item.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {isModalOpen && isAdmin && (
        <GalleryModal 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}

function GalleryModal({ item, onClose }: { item: GalleryItem | null, onClose: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [date, setDate] = useState(item?.date || new Date().toISOString().split('T')[0]);
  const [photoData, setPhotoData] = useState(item?.photoData || '');
  const [saving, setSaving] = useState(false);
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImageToBase64(file, 1024, 0.75); // Slightly larger max width for gallery
        setPhotoData(base64);
      } catch (error) {
        console.error("Failed to compress image", error);
        alert("Gagal memproses gambar.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !photoData || !date) {
      alert("Judul, foto, dan tanggal wajib diisi!");
      return;
    }
    
    setSaving(true);
    try {
      if (item) {
        await updateDoc(doc(db, 'gallery', item.id), {
          title: title.trim(),
          description: description.trim(),
          date,
          photoData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'gallery'), {
          title: title.trim(),
          description: description.trim(),
          date,
          photoData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, item ? OperationType.UPDATE : OperationType.CREATE, 'gallery');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center w-full py-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative border border-slate-200"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {item ? 'Edit Momen' : 'Tambah Momen'}
          </h2>
          
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Foto / Gambar</label>
              {photoData ? (
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mb-2 max-h-64 flex items-center justify-center">
                  <img src={photoData} alt="Preview" className="w-full max-h-64 object-contain" />
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white font-medium gap-2">
                    <Edit2 size={18} />
                    <span>Ganti Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              ) : (
                <label className="w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-colors text-slate-500 mb-2">
                  <Upload size={24} className="mb-2" />
                  <span className="text-sm font-medium">Klik untuk memilih foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul Momen</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                placeholder="Misal: Makrab Angkatan 2023"
                maxLength={150}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Singkat</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 resize-none h-24"
                placeholder="Ceritakan sedikit tentang momen ini..."
                maxLength={500}
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
