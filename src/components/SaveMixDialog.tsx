import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SaveAll } from 'lucide-react';
import { useSoundContext } from '@/contexts/SoundContext';

const SaveMixDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mixName, setMixName] = useState('');
  const { saveMix } = useSoundContext();

  const handleSave = () => {
    saveMix(mixName);
    setMixName('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-white/10">
          <SaveAll className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sauvegarder le mix</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <input
            type="text"
            placeholder="Nom du mix"
            value={mixName}
            onChange={(e) => setMixName(e.target.value)}
            className="w-full px-3 py-2 bg-background border rounded-md"
          />
          <Button onClick={handleSave} className="w-full">
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveMixDialog; 