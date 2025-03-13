
import React from 'react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({ 
  value, 
  onChange,
  className
}) => {
  // Déterminer quelle icône afficher en fonction du niveau de volume
  const getVolumeIcon = () => {
    if (value === 0) return <VolumeX size={18} />;
    if (value < 0.33) return <Volume size={18} />;
    if (value < 0.66) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };

  return (
    <div className={cn("flex items-center gap-2 w-full px-1", className)}>
      <button 
        onClick={() => onChange(0)}
        className="text-white/80 hover:text-white transition-colors"
        aria-label="Mute"
      >
        {getVolumeIcon()}
      </button>
      
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="volume-slider flex-1"
      />
      
      <span className="text-xs text-white/70 w-8 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
};

export default VolumeSlider;
