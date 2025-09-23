import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  remainingTime: number;
  onClear: () => void;
  className?: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ remainingTime, onClear, className }) => {
  const hours = Math.floor(remainingTime / 60);
  const minutes = remainingTime % 60;

  const formatTime = () => {
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    }
    return `${minutes}min`;
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 bg-mindful-800/50 rounded-full text-sm border border-mindful-700",
      className
    )}>
      <span className="text-white/90">{formatTime()}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 rounded-full hover:bg-mindful-700"
        onClick={onClear}
      >
        <X size={12} className="text-white/90" />
      </Button>
    </div>
  );
};

export default TimerDisplay; 