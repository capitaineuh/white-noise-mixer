import { Timestamp } from 'firebase/firestore';

export type SoundCategory = 'tous' | 'nature' | 'asmr' | 'animaux' | 'lofi' | 'jazz' | 'cours' | 'podcast' | 'frequences' | 'autres';

export interface Sound {
  id: string;
  name: string;
  description: string;
  soundUrl: string;
  imageUrl: string;
  volume: number;
  isPlaying: boolean;
  userId?: string;
  isPublic: boolean;
  category: SoundCategory;
  createdAt?: Timestamp;
} 