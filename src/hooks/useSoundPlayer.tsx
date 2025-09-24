import { useEffect, useRef, useCallback } from 'react';
import { Sound } from '@/types/sound';

// Custom hook pour gérer la lecture audio
const useSoundPlayer = (sound: Sound) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);

  // Créer un élément audio si nécessaire (une seule fois)
  useEffect(() => {
    if (!sound.soundUrl) {
      console.error('URL audio manquante pour le son:', sound.name);
      return;
    }

    if (!audioRef.current && !isInitializedRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = sound.volume;
      audio.preload = 'auto';
      
      // Configuration pour une meilleure qualité audio
      audio.crossOrigin = 'anonymous';
      
      try {
        audio.src = sound.soundUrl;
        audio.load(); // Force le chargement de l'audio
        audioRef.current = audio;
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Erreur lors du chargement de l\'audio:', error);
      }
    }
    
    return () => {
      if (audioRef.current && isInitializedRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [sound.soundUrl, sound.name]); // Retiré sound.volume des dépendances

  // Gérer la lecture/pause avec fade in/out
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    if (sound.isPlaying) {
      // Fade in progressif
      const fadeIn = () => {
        audio.volume = 0;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // Fade in progressif sur 200ms
            const fadeInInterval = setInterval(() => {
              if (audio.volume < sound.volume) {
                audio.volume = Math.min(audio.volume + 0.05, sound.volume);
              } else {
                clearInterval(fadeInInterval);
              }
            }, 20);
          }).catch(error => {
            console.error('Audio playback failed:', error);
          });
        }
      };
      
      fadeIn();
    } else {
      // Fade out progressif avant pause
      const fadeOut = () => {
        const fadeOutInterval = setInterval(() => {
          if (audio.volume > 0.01) {
            audio.volume = Math.max(audio.volume - 0.05, 0);
          } else {
            audio.pause();
            clearInterval(fadeOutInterval);
          }
        }, 20);
      };
      
      fadeOut();
    }
  }, [sound.isPlaying, sound.volume]);

  // Mettre à jour le volume sans recréer l'audio
  useEffect(() => {
    if (audioRef.current && sound.isPlaying) {
      // Transition fluide du volume si le son est en cours de lecture
      const audio = audioRef.current;
      const currentVolume = audio.volume;
      const targetVolume = sound.volume;
      
      if (Math.abs(currentVolume - targetVolume) > 0.01) {
        const volumeInterval = setInterval(() => {
          const diff = targetVolume - audio.volume;
          const step = diff * 0.1;
          
          if (Math.abs(diff) < 0.01) {
            audio.volume = targetVolume;
            clearInterval(volumeInterval);
          } else {
            audio.volume += step;
          }
        }, 16); // ~60fps
        
        return () => clearInterval(volumeInterval);
      }
    } else if (audioRef.current) {
      // Si le son n'est pas en cours de lecture, mettre à jour directement
      audioRef.current.volume = sound.volume;
    }
  }, [sound.volume, sound.isPlaying]);

  return audioRef;
};

export default useSoundPlayer;
