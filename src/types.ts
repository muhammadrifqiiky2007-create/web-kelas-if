export interface ClassSettings {
  id?: string;
  logoData?: string;
  className?: string;
  homeTitle?: string;
  homeSubtitle?: string;
}

export interface Member {
  id: string;
  name: string;
  photoData: string;
  nim?: string;
  instagram?: string;
  role?: 'ketua' | 'wakil' | 'anggota';
  createdAt: any;
  updatedAt: any;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  photoData: string;
  date: string;
  createdAt: any;
  updatedAt: any;
}

export interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  course: string;
  lecturer: string;
  room: string;
  createdAt: any;
  updatedAt: any;
}
