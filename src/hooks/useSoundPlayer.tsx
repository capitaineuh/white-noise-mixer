import { useEffect, useRef } from 'react';
import { Sound } from '@/types/sound';

// Custom hook pour gérer la lecture audio
const useSoundPlayer = (sound: Sound) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Créer un élément audio si nécessaire
  useEffect(() => {
    if (!sound.soundUrl) {
      console.error('URL audio manquante pour le son:', sound.name);
      return;
    }

    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = sound.volume;
      
      try {
        audio.src = sound.soundUrl;
        audio.load(); // Force le chargement de l'audio
        audioRef.current = audio;
      } catch (error) {
        console.error('Erreur lors du chargement de l\'audio:', error);
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [sound.soundUrl, sound.name, sound.volume]);

  // Gérer la lecture/pause
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (sound.isPlaying) {
      const playPromise = audioRef.current.play();
      
      // Gérer l'erreur "play() failed because the user didn't interact with the document first"
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio playback failed:', error);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [sound.isPlaying]);

  // Mettre à jour le volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = sound.volume;
    }
  }, [sound.volume]);

  return audioRef;
};

export default useSoundPlayer;
