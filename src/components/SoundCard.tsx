
import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Sound } from '../contexts/SoundContext';
import VolumeSlider from './VolumeSlider';
import useSoundPlayer from '../hooks/useSoundPlayer';
import { cn } from '@/lib/utils';

interface SoundCardProps {
  sound: Sound;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
}

const SoundCard: React.FC<SoundCardProps> = ({ 
  sound, 
  onToggle, 
  onVolumeChange 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useSoundPlayer(sound);
  
  return (
    <div 
      className={cn(
        "sound-card animate-fade-in",
        sound.isPlaying && "sound-card-active"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative group">
        <img 
          src={sound.imageUrl} 
          alt={sound.name} 
          className="sound-card-img"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-mindful-900/90 via-mindful-900/30 to-transparent flex flex-col justify-between p-4">
          <div className="flex justify-end">
            <button
              onClick={onToggle}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                sound.isPlaying 
                  ? "bg-primary text-white shadow-lg" 
                  : "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              )}
              aria-label={sound.isPlaying ? "Pause" : "Play"}
            >
              {sound.isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} className="ml-0.5" />
              )}
            </button>
          </div>
          
          <div className="mt-auto">
            <h3 className="text-white font-medium text-lg mb-1">{sound.name}</h3>
            
            <div className={cn(
              "transition-opacity duration-300",
              (isHovered || sound.isPlaying) ? "opacity-100" : "opacity-0"
            )}>
              <VolumeSlider 
                value={sound.volume} 
                onChange={onVolumeChange} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundCard;
