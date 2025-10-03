import { useEffect, useRef } from 'react';
import { getSharedAudioContext, resumeSharedAudioContext, keepAudioContextAlive, isAudioContextReady } from '@/lib/audio';
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
  // WebAudio: source et gain par son
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  // Crossfade pour éviter les coupures nettes en boucle
  const crossfadeRef = useRef<number | null>(null);

  // Créer un élément audio si nécessaire (une seule fois)
  useEffect(() => {
    if (!sound.soundUrl) {
      console.error('URL audio manquante pour le son:', sound.name);
      return;
    }

    if (!audioRef.current && !isInitializedRef.current) {
      const audio = new Audio();
      audio.loop = true;
      // Laisser le volume élément à 1, on pilote via WebAudio (gain)
      audio.volume = 1;
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

        // Init WebAudio chain si disponible
        const ctx = getSharedAudioContext();
        if (ctx) {
          try {
            const source = ctx.createMediaElementSource(audio);
            const gain = ctx.createGain();
            gain.gain.value = 0; // démarrage silencieux
            source.connect(gain);
            gain.connect(ctx.destination);
            sourceNodeRef.current = source;
            gainNodeRef.current = gain;
          } catch (e) {
            // Si le source a déjà été créé pour cet élément (ne devrait pas), ignorer
            console.warn('WebAudio init error:', e);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'audio:', error);
      }
    }
    
    return () => {
      if (audioRef.current && isInitializedRef.current) {
        try {
          if (fadeInIntervalRef.current) clearInterval(fadeInIntervalRef.current);
          if (fadeOutIntervalRef.current) clearInterval(fadeOutIntervalRef.current);
          if (crossfadeRef.current) clearInterval(crossfadeRef.current);
          if (gainNodeRef.current) {
            try { gainNodeRef.current.disconnect(); } catch (e) {
              // ignore disconnect errors
            }
          }
          if (sourceNodeRef.current) {
            try { sourceNodeRef.current.disconnect(); } catch (e) {
              // ignore disconnect errors
            }
          }
        } finally {
          audioRef.current.pause();
          audioRef.current = null;
          sourceNodeRef.current = null;
          gainNodeRef.current = null;
          isInitializedRef.current = false;
        }
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
    if (crossfadeRef.current) {
      clearInterval(crossfadeRef.current);
      crossfadeRef.current = null;
    }

    if (sound.isPlaying) {
      // Relancer proprement: démuter et préparer volume
      audio.muted = false;
      audio.volume = 1; // piloté via gain
      // Préparer WebAudio gain
      const ctx = getSharedAudioContext();
      const gain = gainNodeRef.current;
      if (ctx && gain) {
        try { gain.gain.cancelScheduledValues(ctx.currentTime); } catch (e) {
          // ignore cancellation errors
        }
        gain.gain.value = 0;
      }

      const currentPlayId = ++playRequestIdRef.current;
      const startPlayback = async () => {
        try {
          // iOS: s'assurer que l'AudioContext est actif
          await resumeSharedAudioContext();
          
          // Maintenir l'AudioContext actif pour la lecture en arrière-plan
          keepAudioContextAlive();
          
          const playPromise = audio.play();
          if (playPromise) await playPromise;
          // Ignorer si un autre play a été demandé ou si on n'est plus en lecture
          if (currentPlayId !== playRequestIdRef.current || !sound.isPlaying) return;

          // Fade in progressif (via WebAudio si dispo)
          const g = gainNodeRef.current;
          const context = getSharedAudioContext();
          if (g && context) {
            try { g.gain.cancelScheduledValues(context.currentTime); } catch (e) {
              // ignore cancellation errors
            }
            g.gain.setValueAtTime(0, context.currentTime);
            g.gain.linearRampToValueAtTime(sound.volume, context.currentTime + 0.2);
          } else {
            // Fallback sur volume HTML si WebAudio indispo
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
          }
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

            const g = gainNodeRef.current;
            const context = getSharedAudioContext();
            if (g && context) {
              try { g.gain.cancelScheduledValues(context.currentTime); } catch (e) {
                // ignore cancellation errors
              }
              g.gain.setValueAtTime(0, context.currentTime);
              g.gain.linearRampToValueAtTime(sound.volume, context.currentTime + 0.2);
            } else {
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
            }
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
      // Laisser volume à 1 pour éviter brièveté sonore lors d'une reprise
      audio.volume = 1;
      // Mettre le gain à 0 également
      const ctx = getSharedAudioContext();
      const gain = gainNodeRef.current;
      if (ctx && gain) {
        try { gain.gain.cancelScheduledValues(ctx.currentTime); } catch (e) {
          // ignore cancellation errors
        }
        gain.gain.setValueAtTime(0, ctx.currentTime);
      }

      // Nettoyer immédiatement tous les intervalles pour éviter les boucles
      if (fadeInIntervalRef.current) {
        clearInterval(fadeInIntervalRef.current);
        fadeInIntervalRef.current = null;
      }
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
      if (crossfadeRef.current) {
        clearInterval(crossfadeRef.current);
        crossfadeRef.current = null;
      }
    }
  }, [sound.isPlaying, sound.name, sound.soundUrl, sound.volume]);

  // Mettre à jour le volume sans recréer l'audio (pilotage via gain si dispo)
  useEffect(() => {
    if (audioRef.current && sound.isPlaying) {
      // Transition fluide du volume si le son est en cours de lecture
      const ctx = getSharedAudioContext();
      const gain = gainNodeRef.current;
      if (ctx && gain) {
        try { gain.gain.cancelScheduledValues(ctx.currentTime); } catch (e) {
          // ignore cancellation errors
        }
        gain.gain.linearRampToValueAtTime(sound.volume, ctx.currentTime + 0.1);
        return;
      }
      // Fallback si pas de WebAudio
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
        }, 16);
        return () => clearInterval(volumeInterval);
      }
    } else if (audioRef.current) {
      // Si le son n'est pas en cours de lecture, mettre à jour directement
      const ctx = getSharedAudioContext();
      const gain = gainNodeRef.current;
      if (ctx && gain) {
        try { gain.gain.cancelScheduledValues(ctx.currentTime); } catch (e) {
          // ignore cancellation errors
        }
        gain.gain.setValueAtTime(sound.volume, ctx.currentTime);
      } else {
        audioRef.current.volume = sound.volume;
      }
    }
  }, [sound.volume, sound.isPlaying]);

  // Gérer le crossfade pour éviter les coupures nettes en boucle
  useEffect(() => {
    if (!audioRef.current || !sound.isPlaying) return;

    const audio = audioRef.current;
    const ctx = getSharedAudioContext();
    const gain = gainNodeRef.current;

    const handleTimeUpdate = () => {
      if (!audio || !audio.loop) return;

      const duration = audio.duration;
      const currentTime = audio.currentTime;
      
      // Détecter quand on approche de la fin (dernières 2 secondes)
      const crossfadeStartTime = duration - 2;
      const crossfadeDuration = 1.5; // 1.5 secondes de crossfade
      
      if (currentTime >= crossfadeStartTime && currentTime < duration) {
        // Calculer le progress du crossfade (0 à 1)
        const crossfadeProgress = (currentTime - crossfadeStartTime) / crossfadeDuration;
        
        if (gain && ctx) {
          // Réduire légèrement le volume vers la fin
          const targetVolume = sound.volume * (1 - crossfadeProgress * 0.3); // Réduction de 30% max
          try { 
            gain.gain.cancelScheduledValues(ctx.currentTime); 
          } catch (e) {
            // ignore cancellation errors
          }
          gain.gain.setValueAtTime(targetVolume, ctx.currentTime);
        }
      } else if (currentTime < 0.5 && crossfadeRef.current === null) {
        // Au début de la boucle, faire un fade-in rapide
        if (gain && ctx) {
          try { 
            gain.gain.cancelScheduledValues(ctx.currentTime); 
          } catch (e) {
            // ignore cancellation errors
          }
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(sound.volume, ctx.currentTime + 0.3);
        }
      }
    };

    const handleSeeked = () => {
      // Quand on revient au début (loop), faire un fade-in rapide
      if (audio.currentTime < 0.5) {
        if (gain && ctx) {
          try { 
            gain.gain.cancelScheduledValues(ctx.currentTime); 
          } catch (e) {
            // ignore cancellation errors
          }
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(sound.volume, ctx.currentTime + 0.3);
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('seeked', handleSeeked);

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('seeked', handleSeeked);
      }
    };
  }, [sound.isPlaying, sound.volume]);

  // Maintenir l'AudioContext actif en arrière-plan quand des sons jouent
  useEffect(() => {
    if (!sound.isPlaying) return;

    // Vérifier périodiquement l'état de l'AudioContext
    const interval = setInterval(() => {
      if (sound.isPlaying && !isAudioContextReady()) {
        console.log('AudioContext suspendu - tentative de reprise');
        resumeSharedAudioContext().then(() => {
          keepAudioContextAlive();
        });
      }
    }, 5000); // Vérifier toutes les 5 secondes

    return () => clearInterval(interval);
  }, [sound.isPlaying]);

  return audioRef;
};

export default useSoundPlayer;
