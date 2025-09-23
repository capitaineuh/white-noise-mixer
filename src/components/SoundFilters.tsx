import { Button } from "@/components/ui/button";
import { SoundCategory } from "@/types/sound";
import { useState } from "react";

interface SoundFiltersProps {
  onCategoryChange: (category: SoundCategory | null) => void;
}

const categories: { value: SoundCategory; label: string }[] = [
  { value: 'tous', label: 'Tous' },
  { value: 'nature', label: 'Nature' },
  { value: 'asmr', label: 'ASMR' },
  { value: 'animaux', label: 'Animaux' },
  { value: 'lofi', label: 'Lofi' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'cours', label: 'Cours' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'frequences', label: 'Fréquences' },
  { value: 'autres', label: 'Autres' }
];

export function SoundFilters({ onCategoryChange }: SoundFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory | null>('tous');

  const handleCategoryClick = (category: SoundCategory) => {
    if (category === 'tous') {
      setSelectedCategory('tous');
      onCategoryChange(null);
    } else if (selectedCategory === category) {
      setSelectedCategory('tous');
      onCategoryChange(null);
    } else {
      setSelectedCategory(category);
      onCategoryChange(category);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {categories.map((category) => (
        <Button
          key={category.value}
          variant={selectedCategory === category.value ? "default" : "outline"}
          onClick={() => handleCategoryClick(category.value)}
          className="rounded-full text-white"
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
} 