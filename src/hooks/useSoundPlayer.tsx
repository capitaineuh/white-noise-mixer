
import { useEffect, useRef } from 'react';
import { Sound } from '../contexts/SoundContext';

// Custom hook pour gérer la lecture audio
const useSoundPlayer = (sound: Sound) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Créer un élément audio si nécessaire
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = sound.volume;
      audio.src = sound.soundUrl;
      audioRef.current = audio;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [sound.soundUrl]);

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
