import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/ui/use-toast';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { useSoundContext } from '../contexts/SoundContext';

const AddCustomSoundButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [soundFile, setSoundFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { refreshSounds } = useSoundContext();

  const handleSoundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSoundFile(e.target.files[0]);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!user || !soundFile || !imageFile || !name) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs et sélectionner les fichiers",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload du fichier audio
      const soundRef = ref(storage, `sounds/${user.uid}/${Date.now()}_${soundFile.name}`);
      const soundSnapshot = await uploadBytes(soundRef, soundFile);
      const soundUrl = await getDownloadURL(soundSnapshot.ref);

      // Upload de l'image
      const imageRef = ref(storage, `images/${user.uid}/${Date.now()}_${imageFile.name}`);
      const imageSnapshot = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(imageSnapshot.ref);

      // Ajouter le son à la base de données
      await addDoc(collection(db, 'sounds'), {
        name,
        soundUrl,
        imageUrl,
        userId: user.uid,
        isPublic: false,
        volume: 0.5,
        createdAt: new Date()
      });

      // Rafraîchir la liste des sons
      await refreshSounds();

      toast({
        title: "Succès",
        description: "Votre son a été ajouté avec succès",
      });

      setOpen(false);
      setName('');
      setSoundFile(null);
      setImageFile(null);
    } catch (error) {
      console.error('Error adding custom sound:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du son",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 border-mindful-700 bg-transparent text-white hover:bg-mindful-800"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Ajouter un son</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-mindful-800 border-mindful-700 text-white">
        <DialogHeader>
          <DialogTitle>Ajouter un son personnalisé</DialogTitle>
          <DialogDescription className="text-mindful-300">
            Ajoutez votre propre son et son image
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Nom du son
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-mindful-700 border-mindful-600 text-white"
              placeholder="Nom du son"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sound" className="text-white">
              Fichier audio (MP3)
            </Label>
            <Input
              id="sound"
              type="file"
              accept="audio/mp3"
              onChange={handleSoundFileChange}
              className="bg-mindful-700 border-mindful-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image" className="text-white">
              Image (PNG)
            </Label>
            <Input
              id="image"
              type="file"
              accept="image/png"
              onChange={handleImageFileChange}
              className="bg-mindful-700 border-mindful-600 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            className="bg-mindful-700 hover:bg-mindful-600 border-mindful-600 text-white"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={loading}
          >
            {loading ? "Ajout en cours..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomSoundButton; 