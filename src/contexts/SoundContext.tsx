/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSounds } from '../hooks/useSounds';
import { Sound } from '../types/sound';

// Types
export interface SoundWithState extends Sound {
  isPlaying: boolean;
}

export interface SavedMix {
  id: string;
  name: string;
  date: Date;
  imageUrl?: string; // Image optionnelle pour le mix
  isPublic: boolean; // Mix public ou privé
  sounds: {
    id: string;
    volume: number;
    isPlaying: boolean;
  }[];
}

export interface SoundContextType {
  sounds: SoundWithState[];
  loading: boolean;
  error: string | null;
  toggleSound: (id: string) => void;
  updateVolume: (id: string, volume: number) => void;
  savedMixes: SavedMix[];
  setSavedMixes: React.Dispatch<React.SetStateAction<SavedMix[]>>;
  saveMix: (name?: string, imageUrl?: string, isPublic?: boolean) => void;
  loadMix: (mixId: string) => void;
  refreshSounds: () => Promise<void>;
  setTimer: (minutes: number, mixId?: string) => void;
  remainingTime: number | null;
  clearTimer: () => void;
  isAlarmMode: boolean;
  setIsAlarmMode: (mode: boolean) => void;
  scheduledMixId: string | null;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { sounds, loading, error, refreshSounds } = useSounds();
  const [localSounds, setLocalSounds] = useState<SoundWithState[]>([]);
  const [savedMixes, setSavedMixes] = useState<SavedMix[]>([]);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [isAlarmMode, setIsAlarmMode] = useState(false);
  const [scheduledMixId, setScheduledMixId] = useState<string | null>(null);

  useEffect(() => {
    // Préserver l'état de lecture des sons existants lors du rechargement
    setLocalSounds(prevLocalSounds => {
      // Si c'est la première fois qu'on charge des sons, initialiser avec isPlaying: false
      if (prevLocalSounds.length === 0) {
        return sounds.map(sound => ({ ...sound, isPlaying: false }));
      }
      
      // Sinon, préserver l'état de lecture des sons existants
      return sounds.map(newSound => {
        const existingSound = prevLocalSounds.find(s => s.id === newSound.id);
        if (existingSound) {
          return { ...newSound, isPlaying: existingSound.isPlaying };
        }
        return { ...newSound, isPlaying: false };
      });
    });
  }, [sounds]);

  useEffect(() => {
    const savedMixesData = localStorage.getItem('savedMixes');
    if (savedMixesData) {
      try {
        type StoredSavedMix = Omit<SavedMix, 'date'> & { date: string };
        const parsedMixes = JSON.parse(savedMixesData) as StoredSavedMix[];
        const mixesWithDates: SavedMix[] = parsedMixes.map((mix) => ({
          ...mix,
          date: new Date(mix.date)
        }));
        setSavedMixes(mixesWithDates);
      } catch (error) {
        console.error('Failed to parse saved mixes:', error);
        localStorage.removeItem('savedMixes');
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('savedMixes', JSON.stringify(savedMixes));
    } catch (error) {
      console.error('Failed to save mixes to localStorage:', error);
    }
  }, [savedMixes]);

  const toggleSound = (id: string) => {
    setLocalSounds(prevSounds =>
      prevSounds.map(sound =>
        sound.id === id
          ? { ...sound, isPlaying: !sound.isPlaying }
          : sound
      )
    );
  };

  const updateVolume = (id: string, volume: number) => {
    setLocalSounds(prevSounds =>
      prevSounds.map(sound =>
        sound.id === id
          ? { ...sound, volume }
          : sound
      )
    );
  };

  const saveMix = (name?: string, imageUrl?: string, isPublic?: boolean) => {
    const activeSounds = localSounds.filter(sound => sound.isPlaying);
    
    if (activeSounds.length === 0) {
      return;
    }

    const newMix: SavedMix = {
      id: Date.now().toString(),
      name: name || `Mix ${savedMixes.length + 1}`,
      date: new Date(),
      imageUrl: imageUrl || undefined,
      isPublic: isPublic || false,
      sounds: activeSounds.map(sound => ({
        id: sound.id,
        volume: sound.volume,
        isPlaying: true
      }))
    };

    setSavedMixes(prev => {
      const updatedMixes = [newMix, ...prev];
      return updatedMixes;
    });
  };

  const loadMix = useCallback((mixId: string) => {
    const mixToLoad = savedMixes.find(mix => mix.id === mixId);
    
    if (!mixToLoad) {
      return;
    }

    setLocalSounds(prevSounds => {
      const resetSounds = prevSounds.map(sound => ({
        ...sound,
        isPlaying: false,
        volume: 0.5
      }));

      const updatedSounds = resetSounds.map(sound => {
        const savedSound = mixToLoad.sounds.find(s => s.id === sound.id);
        if (savedSound) {
          return {
            ...sound,
            isPlaying: savedSound.isPlaying,
            volume: savedSound.volume
          };
        }
        return sound;
      });

      return updatedSounds;
    });
  }, [savedMixes]);

  const setTimer = useCallback((minutes: number, mixId?: string) => {
    if (timerId) {
      clearInterval(timerId);
    }

    const endTime = Date.now() + minutes * 60 * 1000;
    
    const newTimerId = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000 / 60);
      
      if (remaining <= 0) {
        if (isAlarmMode && mixId) {
          // Charger et démarrer le mix programmé
          loadMix(mixId);
        } else {
          // Mode arrêt automatique : arrêter tous les sons
          setLocalSounds(prevSounds =>
            prevSounds.map(sound => ({ ...sound, isPlaying: false }))
          );
        }
        clearInterval(newTimerId);
        setRemainingTime(null);
        setTimerId(null);
        setScheduledMixId(null);
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    setTimerId(newTimerId);
    setRemainingTime(minutes);
    setScheduledMixId(mixId || null);
  }, [isAlarmMode, loadMix, timerId]);

  const clearTimer = useCallback(() => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
      setRemainingTime(null);
      setScheduledMixId(null);
    }
  }, [timerId]);

  // Nettoyer le timer lors du démontage
  useEffect(() => {
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [timerId]);

  return (
    <SoundContext.Provider value={{
      sounds: localSounds,
      loading,
      error,
      toggleSound,
      updateVolume,
      savedMixes,
      setSavedMixes,
      saveMix,
      loadMix,
      refreshSounds,
      setTimer,
      remainingTime,
      clearTimer,
      isAlarmMode,
      setIsAlarmMode,
      scheduledMixId
    }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundContext = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return context;
};
