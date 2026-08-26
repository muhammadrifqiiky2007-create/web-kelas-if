import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Home() {
  const [title, setTitle] = useState("Kebersamaan & Cerita \n Dalam Satu Ruang");
  const [subtitle, setSubtitle] = useState("Tempat menyimpan kenangan, mengenal lebih dekat anggota kelas, dan melihat jadwal perkuliahan secara real-time.");
  const [bannerUrl, setBannerUrl] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'class_info'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.homeTitle) setTitle(data.homeTitle);
        if (data.homeSubtitle) setSubtitle(data.homeSubtitle);
        if (data.bannerData) setBannerUrl(data.bannerData);
      }
    });
    return unsub;
  }, []);

  return (
    <div className="relative min-h-screen -m-4 sm:-m-8 p-4 sm:p-8 overflow-hidden flex flex-col justify-between">
      {/* Dynamic Fullpage Background Image */}
      {bannerUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        >
          {/* Lapisan overlay gelap tipis dengan efek blur halus agar konten di atasnya tetap sangat jelas */}
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col gap-12 sm:gap-16 pb-10 max-w-6xl mx-auto w-full">
        <section className="text-center max-w-3xl mx-auto pt-8 sm:pt-16">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm mb-6 ${
              bannerUrl 
                ? 'bg-white/10 text-indigo-200 border border-white/20 backdrop-blur-md' 
                : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <Sparkles size={16} />
            Selamat Datang di Kelas Kami Tercinta
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 whitespace-pre-line ${
              bannerUrl ? 'text-white drop-shadow-md' : 'text-slate-900'
            }`}
          >
            {title}
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-lg sm:text-xl mb-10 leading-relaxed whitespace-pre-line max-w-2xl mx-auto ${
              bannerUrl ? 'text-slate-200 drop-shadow-sm' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </motion.p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link 
              to="/members" 
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30"
            >
              Lihat Anggota
            </Link>
            <Link 
              to="/gallery" 
              className={`px-6 py-3 rounded-xl font-medium transition-colors shadow-sm ${
                bannerUrl 
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              Jelajahi Galeri
            </Link>
          </motion.div>
        </section>

        {/* Feature Cards Section */}
        <section className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          <FeatureCard 
            icon={<Users size={24} className="text-indigo-600" />}
            title="Anggota Kelas"
            description="Kenali lebih dekat profil dan wajah-wajah ceria teman-teman sekelas."
            delay={0.4}
            hasBanner={!!bannerUrl}
          />
          <FeatureCard 
            icon={<Sparkles size={24} className="text-amber-500" />}
            title="Momen Penting"
            description="Galeri foto perjalanan kita, dari masa orientasi hingga kelulusan."
            delay={0.5}
            hasBanner={!!bannerUrl}
          />
          <FeatureCard 
            icon={<BookOpen size={24} className="text-emerald-600" />}
            title="Jadwal Kuliah"
            description="Update jadwal mata kuliah, dosen, dan ruangan agar tidak ketinggalan kelas."
            delay={0.6}
            hasBanner={!!bannerUrl}
          />
        </section>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay,
  hasBanner 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  delay: number,
  hasBanner: boolean
}) {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`p-6 rounded-3xl border shadow-sm flex flex-col gap-4 transition-all ${
        hasBanner
          ? 'bg-white/10 border-white/20 backdrop-blur-md text-white hover:bg-white/15'
          : 'bg-white border-slate-200 text-slate-900 hover:shadow-md'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
        hasBanner 
          ? 'bg-white/10 border-white/20' 
          : 'bg-slate-50 border-slate-100'
      }`}>
        {icon}
      </div>
      <h3 className={`text-lg font-bold ${hasBanner ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <p className={`leading-relaxed text-sm ${hasBanner ? 'text-slate-200' : 'text-slate-500'}`}>{description}</p>
    </motion.div>
  );
}