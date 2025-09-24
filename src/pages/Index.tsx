import React, { useEffect, useState } from 'react';
import { useSoundContext } from '../contexts/SoundContext';
import SoundCard from '../components/SoundCard';
import SaveMixDialog from '../components/SaveMixDialog';
import Header from '../components/Header';
import BuyMeACoffeeButton from "../components/ui/bmc";
import { SoundFilters } from "@/components/SoundFilters";
import { SoundCategory } from "@/types/sound";
import AddCustomSoundButton from "@/components/AddCustomSoundButton";

const Index: React.FC = () => {
  const { sounds, toggleSound, updateVolume, loading, error } = useSoundContext();
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory | null>(null);

  useEffect(() => {
    // Précharger les images
    sounds.forEach(sound => {
      const img = new Image();
      img.src = sound.imageUrl;
    });
  }, [sounds]);

  const filteredSounds = selectedCategory
    ? sounds.filter((sound) => sound.category === selectedCategory)
    : sounds;

  return (
    <div className="min-h-screen flex flex-col bg-mindful">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BuyMeACoffeeButton />
          <div className="flex items-center gap-4">
            <SaveMixDialog />
            <AddCustomSoundButton />
          </div>
        </div>
        
        <div className="mb-8">
          <SoundFilters onCategoryChange={setSelectedCategory} />
        </div>

        {loading && <p className="text-center">Chargement...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredSounds.map(sound => (
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
