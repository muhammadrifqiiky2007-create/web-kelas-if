import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Home() {
  const [title, setTitle] = useState("Kebersamaan & Cerita \n Dalam Satu Ruang");
  const [subtitle, setSubtitle] = useState("Tempat menyimpan kenangan, mengenal lebih dekat anggota kelas, dan melihat jadwal perkuliahan secara real-time.");
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'class_info'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.homeTitle) setTitle(data.homeTitle);
        if (data.homeSubtitle) setSubtitle(data.homeSubtitle);
      }
    });
    return unsub;
  }, []);

  return (
    <div className="flex flex-col gap-12 sm:gap-20 pb-10">
      <section className="text-center max-w-3xl mx-auto pt-10 sm:pt-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 font-medium text-sm mb-6"
        >
          <Sparkles size={16} />
          Selamat Datang di Kelas Kami Tercinta
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-6 whitespace-pre-line"
        >
          {title}
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed whitespace-pre-line max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link to="/members" className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
            Lihat Anggota
          </Link>
          <Link to="/gallery" className="px-6 py-3 rounded-xl bg-white text-slate-600 font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
            Jelajahi Galeri
          </Link>
        </motion.div>
      </section>

      <section className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
        <FeatureCard 
          icon={<Users size={24} className="text-indigo-600" />}
          title="Anggota Kelas"
          description="Kenali lebih dekat profil dan wajah-wajah ceria teman-teman sekelas."
          delay={0.4}
        />
        <FeatureCard 
          icon={<Sparkles size={24} className="text-amber-500" />}
          title="Momen Penting"
          description="Galeri foto perjalanan kita, dari masa orientasi hingga kelulusan."
          delay={0.5}
        />
        <FeatureCard 
          icon={<BookOpen size={24} className="text-emerald-600" />}
          title="Jadwal Kuliah"
          description="Update jadwal mata kuliah, dosen, dan ruangan agar tidak ketinggalan kelas."
          delay={0.6}
        />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
    </motion.div>
  );
}
