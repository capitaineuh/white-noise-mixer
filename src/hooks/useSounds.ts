import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase'; // Assurez-vous que le chemin est correct
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from './useAuth'; // Importez le hook d'authentification

export interface Sound {
  id: string;
  imageUrl: string;
  soundUrl: string;
  name: string;
  volume: number;
  isPublic: boolean;
  isPlaying: boolean;
  userId?: string;
}

const useSounds = () => {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Utilisez le hook d'authentification

  const fetchSounds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const soundsRef = collection(db, 'sounds');
      
      // Récupérer les sons publics
      const publicQuery = query(
        soundsRef,
        where('isPublic', '==', true)
      );
      const publicSoundsSnapshot = await getDocs(publicQuery);
      const publicSounds = publicSoundsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        volume: doc.data().volume !== undefined ? doc.data().volume : 0.5,
        isPlaying: false
      } as Sound));

      console.log('Public sounds:', publicSounds);

      if (user) {
        // Récupérer les sons personnalisés de l'utilisateur
        const userSoundsQuery = query(
          soundsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const userSoundsSnapshot = await getDocs(userSoundsQuery);
        const userSounds = userSoundsSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('User sound data:', data);
          return {
            id: doc.id,
            ...data,
            volume: data.volume !== undefined ? data.volume : 0.5,
            isPlaying: false
          } as Sound;
        });

        console.log('User sounds:', userSounds);
        setSounds([...userSounds, ...publicSounds]);
      } else {
        setSounds(publicSounds);
      }
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

  return { sounds, loading, error, refreshSounds: fetchSounds };
};

export default useSounds;