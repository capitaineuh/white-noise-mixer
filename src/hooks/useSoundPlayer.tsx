import { useEffect, useRef } from 'react';
import { Sound } from '@/types/sound';

// Custom hook pour gérer la lecture audio
const useSoundPlayer = (sound: Sound) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);
  // Anti-course condition pour ignorer des résolutions play() tardives (iOS/Safari)
  const playRequestIdRef = useRef(0);
  // Pointeurs d'intervalles pour nettoyage fiable
  const fadeInIntervalRef = useRef<number | null>(null);
  const fadeOutIntervalRef = useRef<number | null>(null);

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

  // Gérer la lecture/pause avec fade in/out (ne dépend que de isPlaying)
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    // Toujours nettoyer les intervalles existants avant toute action
    if (fadeInIntervalRef.current) {
      clearInterval(fadeInIntervalRef.current);
      fadeInIntervalRef.current = null;
    }
    if (fadeOutIntervalRef.current) {
      clearInterval(fadeOutIntervalRef.current);
      fadeOutIntervalRef.current = null;
    }

    if (sound.isPlaying) {
      // Relancer proprement: démuter et préparer volume
      audio.muted = false;
      audio.volume = 0;

      const currentPlayId = ++playRequestIdRef.current;
      const startPlayback = async () => {
        try {
          const playPromise = audio.play();
          if (playPromise) await playPromise;
          // Ignorer si un autre play a été demandé ou si on n'est plus en lecture
          if (currentPlayId !== playRequestIdRef.current || !sound.isPlaying) return;

          // Fade in progressif
          fadeInIntervalRef.current = window.setInterval(() => {
            if (!audioRef.current) return;
            const target = sound.volume;
            if (audio.volume < target) {
              audio.volume = Math.min(audio.volume + 0.05, target);
            } else if (fadeInIntervalRef.current) {
              clearInterval(fadeInIntervalRef.current);
              fadeInIntervalRef.current = null;
            }
          }, 20);
        } catch (error) {
          // Fallback blob pour cas iOS/safari m4a typés video/mp4
          try {
            const response = await fetch(sound.soundUrl || '', { mode: 'cors' });
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
            if (currentPlayId !== playRequestIdRef.current || !sound.isPlaying) {
              // Si une pause est survenue entre temps, ne pas lancer le fade et nettoyer
              URL.revokeObjectURL(objectUrl);
              if (previousSrc && previousSrc.startsWith('blob:')) URL.revokeObjectURL(previousSrc);
              return;
            }

            if (previousSrc && previousSrc.startsWith('blob:')) {
              URL.revokeObjectURL(previousSrc);
            }

            fadeInIntervalRef.current = window.setInterval(() => {
              if (!audioRef.current) return;
              const target = sound.volume;
              if (audio.volume < target) {
                audio.volume = Math.min(audio.volume + 0.05, target);
              } else if (fadeInIntervalRef.current) {
                clearInterval(fadeInIntervalRef.current);
                fadeInIntervalRef.current = null;
              }
            }, 20);
          } catch (e) {
            console.error('Échec du fallback blob pour lecture audio:', e);
          }
        }
      };

      startPlayback();
    } else {
      // Pause immédiate fiable (iOS): couper le son, annuler fade-in, puis pause
      audio.muted = true;
      audio.pause();
      // Laisser volume à 0 pour éviter brièveté sonore lors d'une reprise
      audio.volume = 0;

      // Lancer un petit fade-out si volume > 0 par sécurité (ne devrait pas arriver)
      if (audio.volume > 0) {
        fadeOutIntervalRef.current = window.setInterval(() => {
          if (!audioRef.current) return;
          if (audio.volume > 0.01) {
            audio.volume = Math.max(audio.volume - 0.05, 0);
          } else if (fadeOutIntervalRef.current) {
            clearInterval(fadeOutIntervalRef.current);
            fadeOutIntervalRef.current = null;
          }
        }, 20);
      }
    }
  }, [sound.isPlaying, sound.name, sound.soundUrl, sound.volume]);

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
