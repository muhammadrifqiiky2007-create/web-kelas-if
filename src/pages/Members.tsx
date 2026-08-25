import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Member } from '../types';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Edit2, Trash2, Upload, User as UserIcon } from 'lucide-react';
import { compressImageToBase64 } from '../utils';

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setMembers(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'members'));
    
    return () => unsubscribe();
  }, []);

  const getRolePriority = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'ketua':
        return 1;
      case 'wakil':
        return 2;
      default:
        return 3;
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    const priorityA = getRolePriority(a.role);
    const priorityB = getRolePriority(b.role);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    const nimA = a.nim ? String(a.nim) : '';
    const nimB = b.nim ? String(b.nim) : '';
    
    return nimA.localeCompare(nimB, undefined, { numeric: true });
  });

  const openAddModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus anggota ini?")) {
      try {
        await deleteDoc(doc(db, 'members', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'members');
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Struktur Kelas</h1>
          <p className="text-slate-500">Orang-Orang Hebat Di Dalam Kelas</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Tambah Anggota</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-3xl p-4 flex flex-col items-center gap-4 border border-slate-200 shadow-sm h-56">
              <div className="w-24 h-24 rounded-full bg-slate-200"></div>
              <div className="w-2/3 h-4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : sortedMembers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <UserIcon size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada anggota</h3>
          <p className="text-slate-500">Anggota kelas yang ditambahkan akan muncul di sini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {sortedMembers.map((member) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl p-6 flex flex-col items-center text-center border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group"
              >
                {isAdmin && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur rounded-full shadow-sm p-1 z-10">
                    <button onClick={() => openEditModal(member)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(member.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-4 border-4 border-slate-50 bg-slate-100 shadow-sm">
                  {member.photoData ? (
                    <img src={member.photoData} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <UserIcon size={32} />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-lg w-full truncate">{member.name}</h3>
                
                {member.role && (
                  <span className={`inline-block px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-full border capitalize ${
                    member.role === 'ketua' 
                      ? 'bg-red-50 text-red-700 border-red-100' 
                      : member.role === 'wakil' 
                      ? 'bg-blue-50 text-blue-700 border-blue-100' 
                      : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  }`}>
                    {member.role === 'ketua' ? 'Ketua Kelas' : member.role === 'wakil' ? 'Wakil Ketua' : member.role}
                  </span>
                )}
                
                {member.nim && (
                  <p className="text-xs text-slate-500 mt-1">{member.nim}</p>
                )}
                {member.instagram && (
                  <a 
                    href={`https://instagram.com/${member.instagram}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-500 hover:text-indigo-600 mt-2 font-medium hover:underline flex items-center justify-center gap-1 w-full"
                  >
                    @{member.instagram}
                  </a>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {isModalOpen && isAdmin && (
        <MemberModal 
          member={editingMember} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}

function MemberModal({ member, onClose }: { member: Member | null, onClose: () => void }) {
  const [name, setName] = useState(member?.name || '');
  const [nim, setNim] = useState(member?.nim || '');
  const [instagram, setInstagram] = useState(member?.instagram || '');
  const [role, setRole] = useState(member?.role || 'anggota');
  const [photoData, setPhotoData] = useState(member?.photoData || '');
  const [saving, setSaving] = useState(false);
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImageToBase64(file);
        setPhotoData(base64);
      } catch (error) {
        console.error("Failed to compress image", error);
        alert("Gagal memproses gambar.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !photoData) {
      alert("Nama dan foto wajib diisi!");
      return;
    }
    
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        nim: nim.trim(),
        instagram: instagram.trim(),
        role: role.trim(),
        photoData,
      };

      if (member) {
        await updateDoc(doc(db, 'members', member.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'members'), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, member ? OperationType.UPDATE : OperationType.CREATE, 'members');
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
            {member ? 'Edit Anggota' : 'Tambah Anggota'}
          </h2>
          
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Foto Anggota</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400">
                  {photoData ? <img src={photoData} alt="Preview" className="w-full h-full object-cover" /> : <UserIcon size={24} />}
                </div>
                <div className="flex-1">
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                    <Upload size={16} />
                    <span>Pilih Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                placeholder="Masukkan nama"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">NIM (Opsional)</label>
              <input 
                type="text" 
                value={nim} 
                onChange={(e) => setNim(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                placeholder="NIM mahasiswa"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kedudukan / Jabatan</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
              >
                <option value="anggota">Anggota</option>
                <option value="ketua">Ketua Kelas</option>
                <option value="wakil">Wakil Ketua</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Instagram (Opsional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400">@</span>
                </div>
                <input 
                  type="text" 
                  value={instagram} 
                  onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder="username"
                  maxLength={50}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
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