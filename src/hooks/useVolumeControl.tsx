import { useCallback, useRef } from 'react';

interface UseVolumeControlProps {
  onChange: (volume: number) => void;
  currentVolume: number;
}

export const useVolumeControl = ({ onChange, currentVolume }: UseVolumeControlProps) => {
  const volumeHistoryRef = useRef<number>(currentVolume);

  const setVolume = useCallback((newVolume: number) => {
    // Clamp volume entre 0 et 1
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    
    // Sauvegarder le volume précédent si on n'est pas à 0
    if (clampedVolume > 0) {
      volumeHistoryRef.current = clampedVolume;
    }
    
    onChange(clampedVolume);
  }, [onChange]);

  const toggleMute = useCallback(() => {
    if (currentVolume === 0) {
      // Unmute : restaurer le volume précédent ou 50% par défaut
      const restoreVolume = volumeHistoryRef.current > 0 ? volumeHistoryRef.current : 0.5;
      setVolume(restoreVolume);
    } else {
      // Mute : sauvegarder le volume actuel et mettre à 0
      volumeHistoryRef.current = currentVolume;
      setVolume(0);
    }
  }, [currentVolume, setVolume]);

  const adjustVolume = useCallback((delta: number) => {
    const newVolume = currentVolume + delta;
    setVolume(newVolume);
  }, [currentVolume, setVolume]);

  const setVolumePercentage = useCallback((percentage: number) => {
    setVolume(percentage / 100);
  }, [setVolume]);

  return {
    setVolume,
    toggleMute,
    adjustVolume,
    setVolumePercentage,
    isMuted: currentVolume === 0,
    previousVolume: volumeHistoryRef.current
  };
};
