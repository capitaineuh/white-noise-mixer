
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useSounds, { Sound as SoundType } from '../hooks/useSounds'; // Importez le hook useSounds et l'interface Sound

// Types
export interface Sound extends SoundType {
  isPlaying: boolean; // Ajoutez isPlaying à l'interface Sound
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
  sounds: Sound[]; // Inclut maintenant isPlaying
  loading: boolean;
  error: string | null;
  // setSounds: React.Dispatch<React.SetStateAction<Sound[]>>; // Supprimé car géré en interne
  toggleSound: (id: string) => void;
  updateVolume: (id: string, volume: number) => void;
  savedMixes: SavedMix[];
  setSavedMixes: React.Dispatch<React.SetStateAction<SavedMix[]>>;
  saveMix: (name?: string) => void;
  loadMix: (mixId: string) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { sounds, loading, error } = useSounds(); // Utilisez le hook useSounds
  const [localSounds, setLocalSounds] = useState<Sound[]>([]);
  const [savedMixes, setSavedMixes] = useState<SavedMix[]>([]);

  useEffect(() => {
    // Initialise l'état local avec les sons récupérés et ajoute isPlaying
    setLocalSounds(sounds.map(sound => ({ ...sound, isPlaying: false })));
  }, [sounds]);

  useEffect(() => {
      const savedMixesData = localStorage.getItem('savedMixes');
      if (savedMixesData) {
          try {
              setSavedMixes(JSON.parse(savedMixesData));
          } catch (error) {
              console.error('Failed to parse saved mixes:', error);
          }
      }
  }, []);

  useEffect(() => {
      if (savedMixes.length > 0) {
          localStorage.setItem('savedMixes', JSON.stringify(savedMixes));
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

  // Sauvegarder le mélange actuel
  const saveMix = (name?: string) => {
    const activeSounds = sounds.filter(sound => sound.isPlaying);
    
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

    setSavedMixes(prev => [newMix, ...prev]);
  };

  // Charger un mélange sauvegardé
  const loadMix = (mixId: string) => {
    const mixToLoad = savedMixes.find(mix => mix.id === mixId);
    
    if (!mixToLoad) {
      return;
    }

    // Réinitialiser tous les sons d'abord
    const resetSounds = sounds.map(sound => ({
      ...sound,
      isPlaying: false,
      volume: 0.5
    }));

    // Appliquer les paramètres du mélange sauvegardé
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

    setSounds(updatedSounds);
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
      loadMix
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
