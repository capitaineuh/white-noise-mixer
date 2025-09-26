import { useEffect, useRef } from 'react';
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
      audio.volume = 0;
      audio.preload = 'auto';
      // iOS/Android: éviter plein écran vidéo
      // @ts-expect-error playsInline n'est pas toujours typé
      audio.playsInline = true;
      // Meilleur support CORS
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
  }, [sound.soundUrl, sound.name]);

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
          }).catch(async (error) => {
            console.warn('Lecture audio directe échouée, tentative de fallback blob:', error);
            try {
              // Télécharger et forcer un blob audio pour corriger les types m4a marqués video/mp4
              const response = await fetch(sound.soundUrl, { mode: 'cors' });
              const blob = await response.blob();
              const nameLower = (sound.name || '').toLowerCase();
              let forcedType = blob.type;
              if (!forcedType || forcedType === 'video/mp4') {
                if (nameLower.endsWith('.m4a') || nameLower.endsWith('.m4b')) forcedType = 'audio/mp4';
                else if (nameLower.endsWith('.mp3') || nameLower.endsWith('.mpeg')) forcedType = 'audio/mpeg';
                else if (nameLower.endsWith('.wav')) forcedType = 'audio/wav';
                else if (nameLower.endsWith('.aac')) forcedType = 'audio/aac';
                else if (nameLower.endsWith('.flac')) forcedType = 'audio/flac';
                else if (nameLower.endsWith('.aiff') || nameLower.endsWith('.aif')) forcedType = 'audio/aiff';
              }

              const audioBlob = forcedType ? new Blob([blob], { type: forcedType }) : blob;
              const objectUrl = URL.createObjectURL(audioBlob);
              const previousSrc = audio.src;
              audio.src = objectUrl;
              const play2 = audio.play();
              if (play2) await play2;

              // Nettoyage de l'ancien Object URL si existant
              if (previousSrc && previousSrc.startsWith('blob:')) {
                URL.revokeObjectURL(previousSrc);
              }

              // Fade in après fallback
              const fadeInInterval = setInterval(() => {
                if (audio.volume < sound.volume) {
                  audio.volume = Math.min(audio.volume + 0.05, sound.volume);
                } else {
                  clearInterval(fadeInInterval);
                }
              }, 20);
            } catch (e) {
              console.error('Échec du fallback blob pour lecture audio:', e);
            }
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
  }, [sound.isPlaying, sound.volume, sound.soundUrl, sound.name]);

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
