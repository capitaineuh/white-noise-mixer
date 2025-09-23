import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sound, SoundCategory } from '@/types/sound';
import { Timestamp } from 'firebase/firestore';

export function useSounds() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSounds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const soundsRef = collection(db, 'sounds');
      
      // Récupérer les sons publics
      const publicQuery = query(soundsRef, where('isPublic', '==', true));
      const publicSoundsSnapshot = await getDocs(publicQuery);
      const publicSounds = publicSoundsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description || '',
          soundUrl: data.soundUrl,
          imageUrl: data.imageUrl,
          isPublic: data.isPublic,
          volume: data.volume !== undefined ? data.volume : 0.5,
          isPlaying: false,
          category: data.category || 'autres' as SoundCategory,
          userId: data.userId
        };
      });

      // Récupérer les sons personnalisés de l'utilisateur
      let allSounds = [...publicSounds];
      
      if (user) {
        const userSoundsQuery = query(
          soundsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const userSoundsSnapshot = await getDocs(userSoundsQuery);
        const userSounds = userSoundsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description || '',
            soundUrl: data.soundUrl,
            imageUrl: data.imageUrl,
            isPublic: data.isPublic,
            volume: data.volume !== undefined ? data.volume : 0.5,
            isPlaying: false,
            category: data.category || 'autres' as SoundCategory,
            userId: data.userId
          };
        });

        // Filtrer les doublons en donnant la priorité aux sons de l'utilisateur
        const seenIds = new Set(userSounds.map(sound => sound.id));
        const filteredPublicSounds = publicSounds.filter(sound => !seenIds.has(sound.id));
        allSounds = [...userSounds, ...filteredPublicSounds];
      }

      console.log('Sons chargés:', allSounds.map(s => ({ id: s.id, name: s.name })));
      setSounds(allSounds);
    } catch (error) {
      console.error('Error fetching sounds:', error);
      setError('Une erreur est survenue lors du chargement des sons');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  const toggleSound = (soundId: string) => {
    setSounds(prevSounds =>
      prevSounds.map(sound =>
        sound.id === soundId
          ? { ...sound, isPlaying: !sound.isPlaying }
          : sound
      )
    );
  };

  const updateVolume = (soundId: string, volume: number) => {
    setSounds(prevSounds =>
      prevSounds.map(sound =>
        sound.id === soundId
          ? { ...sound, volume }
          : sound
      )
    );
  };

  return {
    sounds,
    loading,
    error,
    toggleSound,
    updateVolume,
    refreshSounds: fetchSounds
  };
}