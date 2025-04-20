import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useSounds, { Sound as SoundType } from '../hooks/useSounds';

// Types
export interface Sound extends SoundType {
  isPlaying: boolean;
}

export interface SavedMix {
  id: string;
  name: string;
  date: Date;
  sounds: {
    id: string;
    volume: number;
    isPlaying: boolean;
  }[];
}

interface SoundContextType {
  sounds: Sound[];
  loading: boolean;
  error: string | null;
  toggleSound: (id: string) => void;
  updateVolume: (id: string, volume: number) => void;
  savedMixes: SavedMix[];
  setSavedMixes: React.Dispatch<React.SetStateAction<SavedMix[]>>;
  saveMix: (name?: string) => void;
  loadMix: (mixId: string) => void;
  refreshSounds: () => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { sounds, loading, error, refreshSounds } = useSounds();
  const [localSounds, setLocalSounds] = useState<Sound[]>([]);
  const [savedMixes, setSavedMixes] = useState<SavedMix[]>([]);

  useEffect(() => {
    setLocalSounds(sounds.map(sound => ({ ...sound, isPlaying: false })));
  }, [sounds]);

  useEffect(() => {
    const savedMixesData = localStorage.getItem('savedMixes');
    if (savedMixesData) {
      try {
        const parsedMixes = JSON.parse(savedMixesData);
        const mixesWithDates = parsedMixes.map((mix: any) => ({
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

  const saveMix = (name?: string) => {
    const activeSounds = localSounds.filter(sound => sound.isPlaying);
    
    if (activeSounds.length === 0) {
      return;
    }

    const newMix: SavedMix = {
      id: Date.now().toString(),
      name: name || `Mix ${savedMixes.length + 1}`,
      date: new Date(),
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

  const loadMix = (mixId: string) => {
    const mixToLoad = savedMixes.find(mix => mix.id === mixId);
    
    if (!mixToLoad) {
      return;
    }

    const resetSounds = localSounds.map(sound => ({
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

    setLocalSounds(updatedSounds);
  };

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
      refreshSounds
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
