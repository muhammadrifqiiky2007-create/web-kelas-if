import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ScheduleItem } from '../types';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Edit2, Trash2, Clock, MapPin, User as UserIcon } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function Schedule() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    // Note: To properly order by day, we either need a dayIndex or we sort on the client side.
    // For simplicity, we fetch all and sort on client based on DAYS array.
    const q = query(collection(db, 'schedule'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem));
      // Client side sort
      data.sort((a, b) => {
        const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.time.localeCompare(b.time);
      });
      setItems(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'schedule'));
    
    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      try {
        await deleteDoc(doc(db, 'schedule', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'schedule');
      }
    }
  };

  // Group items by day
  const groupedItems = DAYS.reduce((acc, day) => {
    const dayItems = items.filter(item => item.day === day);
    if (dayItems.length > 0) {
      acc[day] = dayItems;
    }
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Jadwal Mata Kuliah</h1>
          <p className="text-slate-500">Jadwal perkuliahan kelas minggu ini.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Tambah Jadwal</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 w-32 bg-slate-200 rounded mb-4"></div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
                <div className="h-16 bg-slate-50 rounded-xl"></div>
                <div className="h-16 bg-slate-50 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Clock size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada jadwal</h3>
          <p className="text-slate-500">Jadwal perkuliahan akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <AnimatePresence>
            {Object.entries(groupedItems).map(([day, dayItems]) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                <div className="sticky top-16 z-10 bg-slate-50/90 backdrop-blur py-3 mb-2">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                    {day}
                  </h2>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col divide-y divide-slate-200">
                  {dayItems.map((item) => (
                    <div key={item.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors relative group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      
                      <div className="flex-shrink-0 w-full sm:w-32">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-semibold text-sm">
                          <Clock size={14} />
                          {item.time}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-1 sm:mb-2">{item.course}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <UserIcon size={14} className="text-slate-400" />
                            <span className="truncate">{item.lecturer}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-slate-400" />
                            <span className="truncate">{item.room}</span>
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="absolute top-4 right-4 sm:static sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => openEditModal(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {isModalOpen && isAdmin && (
        <ScheduleModal 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}

function ScheduleModal({ item, onClose }: { item: ScheduleItem | null, onClose: () => void }) {
  const [day, setDay] = useState(item?.day || 'Senin');
  const [time, setTime] = useState(item?.time || '');
  const [course, setCourse] = useState(item?.course || '');
  const [lecturer, setLecturer] = useState(item?.lecturer || '');
  const [room, setRoom] = useState(item?.room || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!day || !time.trim() || !course.trim() || !lecturer.trim() || !room.trim()) {
      alert("Semua kolom wajib diisi!");
      return;
    }
    
    setSaving(true);
    try {
      if (item) {
        await updateDoc(doc(db, 'schedule', item.id), {
          day,
          time: time.trim(),
          course: course.trim(),
          lecturer: lecturer.trim(),
          room: room.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'schedule'), {
          day,
          time: time.trim(),
          course: course.trim(),
          lecturer: lecturer.trim(),
          room: room.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, item ? OperationType.UPDATE : OperationType.CREATE, 'schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center w-full py-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border border-slate-200"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {item ? 'Edit Jadwal' : 'Tambah Jadwal'}
          </h2>
          
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hari</label>
                <select 
                  value={day} 
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 appearance-none"
                  required
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jam</label>
                <input 
                  type="text" 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder="08:00 - 10:00"
                  maxLength={50}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mata Kuliah</label>
              <input 
                type="text" 
                value={course} 
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                placeholder="Nama mata kuliah"
                maxLength={150}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosen Pengampu</label>
              <input 
                type="text" 
                value={lecturer} 
                onChange={(e) => setLecturer(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                placeholder="Nama dosen"
                maxLength={150}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ruangan / Tempat</label>
              <input 
                type="text" 
                value={room} 
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                placeholder="Misal: Gedung A Lt. 2"
                maxLength={100}
                required
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
