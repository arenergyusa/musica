export interface MediaItem {
  id: string;
  title: string;
  artist: string;
  category: "music_video" | "web_series" | "exclusive_audio" | "behind_the_scenes";
  duration: string;
  thumbnail: string;
  videoUrl?: string;
  releaseDate: string;
  isExclusive: boolean;
  views: string;
  description: string;
}

export const MEDIA_CATALOG: MediaItem[] = [
  {
    id: "m1",
    title: "52 Gaj Ka Daman — VIP Remastered",
    artist: "Pranjal Dahiya & Renuka Panwar",
    category: "music_video",
    duration: "4:15",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    releaseDate: "2026-01-10",
    isExclusive: true,
    views: "1.2M",
    description: "Exclusive VIP 4K Remastered version of the record-breaking Haryanvi anthem. Produced under Musica Originals."
  },
  {
    id: "m2",
    title: "Gypsy (Balam Thanedar) — Director Cut",
    artist: "G D Kaur & Pranjal Dahiya",
    category: "music_video",
    duration: "3:48",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://www.youtube.com/embed/74_yJny-uB0",
    releaseDate: "2026-02-01",
    isExclusive: false,
    views: "850K",
    description: "High-octane Haryanvi beat track with exclusive behind-the-scenes footage for Musica Subscribers."
  },
  {
    id: "m3",
    title: "Chaudhary: Desi Swag — Season 1 Episode 1",
    artist: "Musica Original Series",
    category: "web_series",
    duration: "24:30",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    releaseDate: "2026-03-15",
    isExclusive: true,
    views: "420K",
    description: "A gritty Haryanvi drama series capturing rural culture, music production rivalry, and triumph."
  },
  {
    id: "m4",
    title: "Haryanvi Folk Beats — Studio Unplugged",
    artist: "Desi Rockstars Ensemble",
    category: "exclusive_audio",
    duration: "18:45",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    releaseDate: "2026-04-05",
    isExclusive: true,
    views: "310K",
    description: "Lossless Hi-Res Audio stream of traditional Haryanvi Dholak & Sarangi instrumental fusion."
  },
  {
    id: "m5",
    title: "Making of 'Khatola' — Behind The Scenes",
    artist: "Musica Studios",
    category: "behind_the_scenes",
    duration: "8:20",
    thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://www.youtube.com/embed/fJ9rUzIMcZQ",
    releaseDate: "2026-05-12",
    isExclusive: false,
    views: "190K",
    description: "Exclusive BTS access showing the location shoot, choreography rehearsals, and artist interviews."
  },
  {
    id: "m6",
    title: "Bullet Aala Balam — 4K Official Video",
    artist: "Vicky Kajla & Ruchika Jangid",
    category: "music_video",
    duration: "3:55",
    thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
    releaseDate: "2026-06-01",
    isExclusive: true,
    views: "640K",
    description: "Energetic wedding dance track featuring Dolby Atmos 5.1 surround sound audio mix."
  }
];
