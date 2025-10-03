import { Button } from "@/components/ui/button";
import { SoundCategory } from "@/types/sound";
import { useState, useRef, useEffect, Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SoundFiltersProps {
  onCategoryChange: (category: SoundCategory | null) => void;
  onMySoundsChange?: (enabled: boolean) => void;
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

export function SoundFilters({ onCategoryChange, onMySoundsChange }: SoundFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory | null>('tous');
  const [myOnly, setMyOnly] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (category: SoundCategory) => {
    // sélectionner une catégorie désactive "Mes sons"
    if (myOnly) {
      setMyOnly(false);
      if (onMySoundsChange) onMySoundsChange(false);
    }
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

  const handleMySoundsClick = () => {
    const next = !myOnly;
    setMyOnly(next);
    // Quand on active "Mes sons", on annule la catégorie sélectionnée
    if (next) {
      setSelectedCategory('tous');
      onCategoryChange(null);
    }
    if (onMySoundsChange) onMySoundsChange(next);
  };

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, []);

  return (
    <div className="relative mb-4">
      {/* Bouton gauche */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-mindful-800/90 hover:bg-mindful-700 text-white rounded-full p-1 shadow-lg transition-all duration-200"
          aria-label="Faire défiler vers la gauche"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Bouton droit */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-mindful-800/90 hover:bg-mindful-700 text-white rounded-full p-1 shadow-lg transition-all duration-200"
          aria-label="Faire défiler vers la droite"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Container avec scroll horizontal */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <Fragment key={category.value}>
            <Button
              variant={!myOnly && selectedCategory === category.value ? "default" : "outline"}
              onClick={() => handleCategoryClick(category.value)}
              className="rounded-full text-white whitespace-nowrap flex-shrink-0"
            >
              {category.label}
            </Button>
            {category.value === 'tous' && (
              <Button
                variant={myOnly ? "default" : "outline"}
                onClick={handleMySoundsClick}
                className="rounded-full text-white whitespace-nowrap flex-shrink-0"
              >
                Mes sons
              </Button>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
} 