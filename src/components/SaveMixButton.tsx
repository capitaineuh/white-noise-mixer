
import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSoundContext } from '../contexts/SoundContext';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/ui/use-toast';

const SaveMixButton: React.FC = () => {
  const [mixName, setMixName] = useState('');
  const [open, setOpen] = useState(false);
  const { saveMix, sounds } = useSoundContext();
  const { user } = useAuth();

  const activeSounds = sounds.filter(sound => sound.isPlaying);
  const canSave = activeSounds.length > 0 && user;

  const handleSave = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour sauvegarder un mix",
        variant: "destructive",
      });
      return;
    }

    if (activeSounds.length === 0) {
      toast({
        title: "Aucun son actif",
        description: "Activez au moins un son pour sauvegarder un mix",
        variant: "destructive",
      });
      return;
    }

    saveMix(mixName || undefined);
    setMixName('');
    setOpen(false);
    
    toast({
      title: "Mix sauvegardé",
      description: "Votre mix a été sauvegardé avec succès",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`
            flex items-center gap-2 bg-mindful-700 hover:bg-mindful-600 
            border-mindful-600 text-white ${!canSave && 'opacity-50 cursor-not-allowed'}
          `}
          disabled={!canSave}
        >
          <Save size={16} />
          <span>Sauvegarder le mix</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-mindful-800 border-mindful-700 text-white">
        <DialogHeader>
          <DialogTitle>Sauvegarder le mix</DialogTitle>
          <DialogDescription className="text-mindful-300">
            Donnez un nom à votre mix pour le retrouver facilement
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Nom du mix
            </Label>
            <Input
              id="name"
              placeholder={`Mix ${new Date().toLocaleDateString()}`}
              value={mixName}
              onChange={(e) => setMixName(e.target.value)}
              className="bg-mindful-700 border-mindful-600 text-white"
            />
          </div>
          <div>
            <p className="text-sm text-mindful-300">
              Sons actifs: {activeSounds.map(s => s.name).join(', ')}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="bg-mindful-700 hover:bg-mindful-600 border-mindful-600 text-white">
            Annuler
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white">
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveMixButton;
