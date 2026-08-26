import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Hash, ShieldCheck, Mail, Phone, Heart } from 'lucide-react';

interface MemberDetailModalProps {
  member: any;
  onClose: () => void;
}

export function MemberDetailModal({ member, onClose }: MemberDetailModalProps) {
  if (!member) return null;

  const imageSrc = member.photoUrl || member.photoData || member.photo;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative border border-slate-100 my-8"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X size={18} />
          </button>

          <div className="relative h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={member.name || 'Foto Anggota'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                <User size={48} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <h3 className="text-2xl font-bold leading-tight">{member.name || 'Tanpa Nama'}</h3>
              <p className="text-sm text-indigo-200 font-medium mt-0.5">{member.nim || '-'}</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {member.role && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">Jabatan / Peran</p>
                  <p className="text-sm font-bold text-indigo-950">{member.role}</p>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <Hash size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">NIM</p>
                  <p className="text-sm font-semibold text-slate-800">{member.nim || '-'}</p>
                </div>
              </div>

              {member.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm font-semibold text-slate-800">{member.email}</p>
                  </div>
                </div>
              )}

              {member.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Nomor HP / WhatsApp</p>
                    <p className="text-sm font-semibold text-slate-800">{member.phone}</p>
                  </div>
                </div>
              )}

              {member.hobbies && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Heart size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Hobi</p>
                    <p className="text-sm font-semibold text-slate-800">{member.hobbies}</p>
                  </div>
                </div>
              )}

              {member.bio && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Catatan / Bio</p>
                  <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{member.bio}"
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}