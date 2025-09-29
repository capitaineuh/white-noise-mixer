import React, { useCallback, useEffect } from 'react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Slider from '@radix-ui/react-slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useVolumeControl } from '@/hooks/useVolumeControl';

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
  const { toggleMute, setVolume, isMuted } = useVolumeControl({
    onChange,
    currentVolume: value
  });

  // Déterminer quelle icône afficher en fonction du niveau de volume
  const getVolumeIcon = useCallback(() => {
    if (value === 0) return <VolumeX size={18} />;
    if (value < 0.33) return <Volume size={18} />;
    if (value < 0.66) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  }, [value]);

  const handleVolumeIconClick = () => {
    toggleMute();
  };

  const handleSliderChange = (newValue: number) => {
    setVolume(newValue);
  };

  // Raccourcis clavier pour le volume
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Seulement si le slider est focusé ou hovered
      if (!event.target || !(event.target as Element).closest('.volume-slider-container')) {
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          event.preventDefault();
          setVolume(Math.min(value + 0.1, 1));
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          event.preventDefault();
          setVolume(Math.max(value - 0.1, 0));
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          toggleMute();
          break;
        case 'Home':
          event.preventDefault();
          setVolume(0);
          break;
        case 'End':
          event.preventDefault();
          setVolume(1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [value, setVolume, toggleMute]);

  return (
    <div className={cn(
      "group flex items-center gap-3 w-full px-1 select-none volume-slider-container", 
      className
    )}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleVolumeIconClick}
              className="text-white/80 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
              aria-label={value === 0 ? "Unmute" : "Mute"}
            >
              {getVolumeIcon()}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{value === 0 ? "Unmute" : "Mute"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="relative flex-1 py-2">
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[value]}
          max={1}
          step={0.01}
          onValueChange={([newValue]) => handleSliderChange(newValue)}
          onValueCommit={([newValue]) => handleSliderChange(newValue)}
          aria-label="Volume"
        >
          <Slider.Track className="bg-mindful-700/50 relative grow rounded-full h-[3px] group-hover:h-[5px] transition-all">
            <Slider.Range className="absolute bg-white/80 group-hover:bg-white rounded-full h-full transition-colors" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-3 h-3 bg-white rounded-full shadow-lg transition-transform 
              hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
              group-hover:scale-110 group-hover:w-4 group-hover:h-4"
          />
        </Slider.Root>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs font-medium text-white/70 w-9 text-right tabular-nums">
              {Math.round(value * 100)}%
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Volume actuel</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default VolumeSlider;
