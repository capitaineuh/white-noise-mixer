import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useSoundContext } from '@/contexts/SoundContext';

interface TimerDialogProps {
  onSetTimer: (minutes: number, mixId?: string) => void;
  className?: string;
}

const PRESET_TIMES = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '4h', value: 240 },
];

const TimerDialog: React.FC<TimerDialogProps> = ({ onSetTimer, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customHours, setCustomHours] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const { isAlarmMode, setIsAlarmMode, savedMixes } = useSoundContext();
  const [selectedMixId, setSelectedMixId] = useState<string>('');

  const handlePresetClick = (minutes: number) => {
    if (isAlarmMode && !selectedMixId) return;
    onSetTimer(minutes, isAlarmMode ? selectedMixId : undefined);
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    const totalMinutes = (customHours * 60) + customMinutes;
    if (totalMinutes > 0) {
      if (isAlarmMode && !selectedMixId) return;
      onSetTimer(totalMinutes, isAlarmMode ? selectedMixId : undefined);
      setIsOpen(false);
    }
  };

  const toggleMode = () => {
    setIsAlarmMode(!isAlarmMode);
    setSelectedMixId('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "flex items-center gap-2 bg-transparent border-mindful-700 text-white hover:bg-mindful-800",
            className
          )}
        >
          <img
            src="/ico/lhorloge.png"
            alt="Minuterie"
            width={24}
            height={24}
            className="opacity-80 group-hover:opacity-100 transition-opacity"
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-mindful-900/95 border-mindful-700">
        <DialogHeader>
          <div className="flex items-center justify-center gap-3">
            <DialogTitle className="text-center text-white">
              {isAlarmMode ? "Sonnerie" : "Arrêt automatique"}
            </DialogTitle>
            <button 
              className="p-1 rounded-full hover:bg-mindful-800 transition-colors"
              onClick={toggleMode}
            >
              <img
                src={isAlarmMode ? "/ico/lhorloge.png" : "/ico/alarme-sonore.png"}
                alt={isAlarmMode ? "Passer en mode arrêt" : "Passer en mode sonnerie"}
                width={24}
                height={24}
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
            </button>
            <span className="text-xs italic text-white/60">← click !</span>
          </div>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {isAlarmMode && (
            <div className="space-y-2">
              <p className="text-sm text-center text-white/70">Sélectionnez un mix à démarrer</p>
              <div className="relative">
                <select
                  value={selectedMixId}
                  onChange={(e) => setSelectedMixId(e.target.value)}
                  className="w-full px-4 py-3 bg-mindful-800 border border-mindful-700 rounded-md text-white appearance-none cursor-pointer
                    hover:bg-mindful-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50
                    [&>option]:py-2 [&>option]:px-4 [&>option]:bg-mindful-900/95 [&>option]:text-white
                    [&>option:hover]:bg-mindful-800"
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'none'
                  }}
                >
                  <option value="" className="!text-white/70">
                    Sélectionnez un mix
                  </option>
                  {savedMixes.map((mix) => (
                    <option 
                      key={mix.id} 
                      value={mix.id}
                    >
                      {mix.name} ({new Date(mix.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-white/70 border-l border-mindful-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {savedMixes.length === 0 && (
                <p className="text-xs text-center text-white/50 italic">
                  Aucun mix sauvegardé. Créez d'abord un mix pour pouvoir le programmer.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESET_TIMES.map((time) => (
              <Button
                key={time.value}
                variant="outline"
                onClick={() => handlePresetClick(time.value)}
                className="w-full border-mindful-700 text-white hover:bg-mindful-800"
                disabled={isAlarmMode && !selectedMixId}
              >
                {time.label}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-center text-white/70">Ou personnalisez votre minuterie</p>
            <div className="flex gap-3 items-center justify-center">
              <div className="space-y-1">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 px-3 py-2 bg-mindful-800 border-mindful-700 rounded-md text-white placeholder-white/50"
                />
                <p className="text-xs text-center text-white/70">Heures</p>
              </div>
              <div className="space-y-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 px-3 py-2 bg-mindful-800 border-mindful-700 rounded-md text-white placeholder-white/50"
                />
                <p className="text-xs text-center text-white/70">Minutes</p>
              </div>
            </div>
            <Button 
              onClick={handleCustomSubmit}
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={(customHours === 0 && customMinutes === 0) || (isAlarmMode && !selectedMixId)}
            >
              {isAlarmMode ? "Démarrer la sonnerie programmée" : "Démarrer la minuterie"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimerDialog; 