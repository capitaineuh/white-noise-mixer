import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderOpen } from 'lucide-react';
import { useSoundContext } from '@/contexts/SoundContext';

const LoadMixDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { savedMixes, loadMix } = useSoundContext();

  const handleLoad = (mixId: string) => {
    loadMix(mixId);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-white/10">
          <FolderOpen className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Charger un mix</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {savedMixes.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Aucun mix sauvegardé
            </p>
          ) : (
            <div className="space-y-2">
              {savedMixes.map((mix) => (
                <Button
                  key={mix.id}
                  variant="outline"
                  onClick={() => handleLoad(mix.id)}
                  className="w-full justify-start"
                >
                  <span className="truncate">{mix.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(mix.date).toLocaleDateString()}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadMixDialog; 