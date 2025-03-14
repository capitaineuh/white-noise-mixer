
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface Sound {
  id: string;
  name: string;
  file: string;
  image: string;
  volume: number;
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
  setSounds: React.Dispatch<React.SetStateAction<Sound[]>>;
  toggleSound: (id: string) => void;
  updateVolume: (id: string, volume: number) => void;
  savedMixes: SavedMix[];
  setSavedMixes: React.Dispatch<React.SetStateAction<SavedMix[]>>;
  saveMix: (name?: string) => void;
  loadMix: (mixId: string) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Les sons disponibles dans notre application
const initialSounds: Sound[] = [
  { id: '1', name: 'Forêt', file: '/sounds/forest.mp3', image: '/images/forest.png', volume: 0.5, isPlaying: false },
  { id: '2', name: 'Pluie sur une bâche', file: '/sounds/rainTente.mp3', image: '/images/tenteUnderRain.jpg', volume: 0.5, isPlaying: false },
  { id: '3', name: 'Campagne', file: '/sounds/campagne.mp3', image: '/images/campagne.png', volume: 0.5, isPlaying: false },
  { id: '4', name: 'Oiseaux', file: '/sounds/bird.mp3', image: '/images/bird.png', volume: 0.5, isPlaying: false },
  { id: '5', name: 'Vent', file: '/sounds/vent.mp3', image: '/images/vent.png', volume: 0.5, isPlaying: false },
  { id: '6', name: 'Feu de cheminer', file: '/sounds/feu.mp3', image: '/images/fire.png', volume: 0.5, isPlaying: false },
  { id: '7', name: 'Vagues', file: '/sounds/waves.mp3', image: '/images/waves.png', volume: 0.5, isPlaying: false },
  { id: '8', name: 'Ronronnement de chat', file: '/sounds/cat.mp3', image: '/images/cat.png', volume: 0.5, isPlaying: false },
  { id: '9', name: 'Centre-ville', file: '/sounds/ville.mp3', image: '/images/ville.png', volume: 0.5, isPlaying: false },
  { id: '10', name: 'Cloche de vaches', file: '/sounds/vaches.mp3', image: '/images/vache.png', volume: 0.5, isPlaying: false }
];

export const SoundProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [sounds, setSounds] = useState<Sound[]>(initialSounds);
  const [savedMixes, setSavedMixes] = useState<SavedMix[]>([]);

  // Charger les mélanges sauvegardés depuis le stockage local au chargement
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

  // Sauvegarder les mélanges dans le stockage local lorsqu'ils changent
  useEffect(() => {
    if (savedMixes.length > 0) {
      localStorage.setItem('savedMixes', JSON.stringify(savedMixes));
    }
  }, [savedMixes]);

  // Activer/désactiver la lecture d'un son
  const toggleSound = (id: string) => {
    setSounds(prevSounds => 
      prevSounds.map(sound => 
        sound.id === id 
          ? { ...sound, isPlaying: !sound.isPlaying } 
          : sound
      )
    );
  };

  // Mettre à jour le volume d'un son
  const updateVolume = (id: string, volume: number) => {
    setSounds(prevSounds => 
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
      sounds, 
      setSounds, 
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
