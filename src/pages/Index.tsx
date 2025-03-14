
import React, { useEffect } from 'react';
import { useSoundContext } from '../contexts/SoundContext';
import SoundCard from '../components/SoundCard';
import SaveMixButton from '../components/SaveMixButton';
import Header from '../components/Header';

const Index: React.FC = () => {
  const { sounds, toggleSound, updateVolume } = useSoundContext();

  useEffect(() => {
    // Précharger les images
    sounds.forEach(sound => {
      const img = new Image();
      img.src = sound.image;
    });
  }, [sounds]);

  return (
    <div className="min-h-screen flex flex-col bg-mindful">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-4xl font-bold text-white">J'espère que ça te servira ! Bizou Cha ❤️</h1>
          <SaveMixButton />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {sounds.map(sound => (
            <SoundCard
              key={sound.id}
              sound={sound}
              onToggle={() => toggleSound(sound.id)}
              onVolumeChange={(volume) => updateVolume(sound.id, volume)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
