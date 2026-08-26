import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Shield, Hash, Instagram } from 'lucide-react';

export interface Member {
  id?: string;
  name: string;
  nim?: string;
  role?: string;
  photo?: string;
  instagram?: string;
  quote?: string;
  bio?: string;
}

interface MemberDetailModalProps {
  member: Member | null;
  onClose: () => void;
}

export function MemberDetailModal({ member, onClose }: MemberDetailModalProps) {
  return (
    <AnimatePresence>
      {member && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-center justify-center w-full py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden border border-slate-200"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>

              <div className="relative h-64 bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <User size={40} />
                  </div>
                )}
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold inline-flex items-center gap-1">
                      <Shield size={12} />
                      {member.role || 'Anggota Kelas'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{member.name}</h3>
                  {member.nim && (
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1">
                      <Hash size={14} />
                      NIM: {member.nim}
                    </p>
                  )}
                </div>

                {member.quote && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-sm italic text-slate-600">"{member.quote}"</p>
                  </div>
                )}

                {member.bio && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tentang</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{member.bio}</p>
                  </div>
                )}

                {member.instagram && (
                  <a
                    href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm hover:opacity-95 transition-opacity shadow-md shadow-pink-100"
                  >
                    <Instagram size={18} />
                    <span>@{member.instagram.replace('@', '')}</span>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}