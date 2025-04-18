import { useState, useEffect } from 'react';
import { db } from '../lib/firebase'; // Assurez-vous que le chemin est correct
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from './useAuth'; // Importez le hook d'authentification

export interface Sound {
  id: string;
  imageUrl: string;
  soundUrl: string;
  name: string;
  volume: number;
  isPublic: boolean;
  isPlaying: boolean; // Add this line
}

const useSounds = () => {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Utilisez le hook d'authentification

  useEffect(() => {
    const fetchSounds = async () => {
      setLoading(true);
      setError(null);
      try {
        const soundsRef = collection(db, 'sounds');
        let q = query(soundsRef, where('isPublic', '==', true)); // Récupère les sons publics

        if (user) {
          // Si l'utilisateur est connecté, récupère aussi ses sons privés
          const userSoundsQuery = query(soundsRef, where('userId', '==', user.uid)); // Assurez-vous d'avoir un champ userId dans vos documents
          const publicSoundsSnapshot = await getDocs(q);
          const userSoundsSnapshot = await getDocs(userSoundsQuery);

          const defaultVolume = 0.5;

          const publicSounds = publicSoundsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              volume: doc.data().volume !== undefined ? doc.data().volume : defaultVolume,
            } as Sound));

          const userSounds = userSoundsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            volume: doc.data().volume !== undefined ? doc.data().volume : defaultVolume,
          } as Sound));

          console.log('Fetched sounds:', [...publicSounds, ...userSounds]);
          setSounds([...publicSounds, ...userSounds]);
        } else {
          // Si l'utilisateur n'est pas connecté, récupère seulement les sons publics
          const publicSoundsSnapshot = await getDocs(q);
          setSounds(publicSoundsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), volume: doc.data().volume !== undefined ? doc.data().volume : 0.5 } as Sound)));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch sounds');
      } finally {
        setLoading(false);
      }

    };

    fetchSounds();
  }, [user]); // Ré-exécute le hook quand l'état de l'utilisateur change

  return { sounds, loading, error };
};

export default useSounds;