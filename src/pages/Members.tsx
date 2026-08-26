import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { UserPlus, Pencil, Trash2, X, Upload, Shield, Users } from 'lucide-react';
import { compressImageToBase64 } from '../utils';

export default function Members() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Modal State Form Tambah/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [role, setRole] = useState('');
  const [photoData, setPhotoData] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'members'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMembers(data);
    });
    return unsub;
  }, []);

  // Pemisah Pengurus & Anggota + Pengurutan NIM
  const coreRoles = ['ketua', 'wakil', 'sekretaris', 'bendahara'];
  
  const leaders = members
    .filter((m) => m.role && m.role.trim() !== '')
    .sort((a, b) => {
      const roleA = a.role.toLowerCase();
      const roleB = b.role.toLowerCase();
      const indexA = coreRoles.findIndex(r => roleA.includes(r));
      const indexB = coreRoles.findIndex(r => roleB.includes(r));
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.role.localeCompare(b.role);
    });

  const regularMembers = members
    .filter((m) => !m.role || m.role.trim() === '')
    .sort((a, b) => {
      const nimA = (a.nim || '').toString().replace(/\D/g, '');
      const nimB = (b.nim || '').toString().replace(/\D/g, '');
      if (nimA && nimB) return Number(nimA) - Number(nimB);
      return (a.name || '').localeCompare(b.name || '');
    });

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setNim('');
    setRole('');
    setPhotoData('');
    setEmail('');
    setPhone('');
    setHobbies('');
    setBio('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, member: any) => {
    e.stopPropagation();
    setEditingId(member.id);
    setName(member.name || '');
    setNim(member.nim || '');
    setRole(member.role || '');
    setPhotoData(member.photoUrl || member.photoData || '');
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setHobbies(member.hobbies || '');
    setBio(member.bio || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Yakin ingin menghapus anggota ini?')) {
      try {
        await deleteDoc(doc(db, 'members', id));
      } catch (err) {
        console.error('Gagal menghapus:', err);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImageToBase64(file);
        setPhotoData(base64);
      } catch (err) {
        console.error('Gagal memproses gambar:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      nim,
      role,
      photoData,
      photoUrl: photoData,
      email,
      phone,
      hobbies,
      bio,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'members', editingId), payload);
      } else {
        await addDoc(collection(db, 'members'), payload);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Gagal menyimpan data:', err);
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 pb-6 pt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Anggota Kelas</h1>
          <p className="text-sm text-slate-500 mt-1">Klik pada anggota untuk melihat detail profil lengkap.</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 shrink-0"
          >
            <UserPlus size={18} />
            <span>Tambah Anggota</span>
          </button>
        )}
      </div>

      {/* Section 1: Pengurus Kelas */}
      {leaders.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm tracking-wider uppercase">
            <Shield size={18} />
            <h2>Pengurus Kelas</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {leaders.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isAdmin={isAdmin}
                onClick={() => setSelectedMember(member)}
                onEdit={(e) => handleOpenEdit(e, member)}
                onDelete={(e) => handleDelete(e, member.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Anggota Kelas (Urut NIM) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm tracking-wider uppercase">
          <Users size={18} />
          <h2>Anggota Kelas ({regularMembers.length})</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {regularMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isAdmin={isAdmin}
              onClick={() => setSelectedMember(member)}
              onEdit={(e) => handleOpenEdit(e, member)}
              onDelete={(e) => handleDelete(e, member.id)}
            />
          ))}
        </div>
      </section>

      {/* Modal Detail Profil Anggota */}
      <MemberDetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      {/* Modal Form Tambah/Edit (Admin Only) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative border border-slate-100 my-8"
            >
              <button
                onClick={() => setIsFormOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-slate-900 mb-6">
                {editingId ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Foto Anggota</label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-400">
                      {photoData ? <img src={photoData} alt="Preview" className="w-full h-full object-cover" /> : '?'}
                    </div>
                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700 w-full">
                      <Upload size={16} />
                      <span>Upload Foto</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">NIM</label>
                    <input
                      type="text"
                      required
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jabatan / Peran (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ketua Kelas, Wakil, Bendahara"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email (Opsional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">No HP / WA (Opsional)</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hobi (Opsional)</label>
                  <input
                    type="text"
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bio / Catatan (Opsional)</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-700 text-sm shadow-md shadow-indigo-200"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberCard({
  member,
  isAdmin,
  onClick,
  onEdit,
  onDelete,
}: {
  member: any;
  isAdmin: boolean;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const imageSrc = member.photoUrl || member.photoData;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer text-center group relative"
    >
      {isAdmin && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 p-1 rounded-xl shadow-xs border border-slate-100">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-slate-100 border border-slate-200 group-hover:border-indigo-500 transition-colors">
        {imageSrc ? (
          <img src={imageSrc} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xl">
            {member.name ? member.name.charAt(0) : '?'}
          </div>
        )}
      </div>

      <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
        {member.name || 'Tanpa Nama'}
      </h3>
      <p className="text-xs text-slate-400 mt-0.5">{member.nim || '-'}</p>

      {member.role && (
        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-semibold border border-indigo-100">
          {member.role}
        </span>
      )}
    </motion.div>
  );
}