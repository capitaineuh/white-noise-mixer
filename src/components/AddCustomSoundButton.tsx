import React, { useState, useEffect } from 'react';
import { Plus, Info } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSoundContext } from '@/contexts/SoundContext';
import { SoundCategory } from "@/types/sound";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const AddCustomSoundButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [soundFile, setSoundFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [category, setCategory] = useState<SoundCategory>("autres");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { refreshSounds } = useSoundContext();

  useEffect(() => {
    console.log('État de l\'authentification:', {
      user,
      isConnected: !!user,
      userId: user?.uid,
      email: user?.email,
      provider: user?.providerData?.[0]?.providerId
    });
  }, [user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !soundFile || !imageFile) return;

    setLoading(true);
    try {
      // Upload sound file
      const soundRef = ref(storage, `sounds/${user.uid}/${Date.now()}_${soundFile.name}`);
      await uploadBytes(soundRef, soundFile);
      const soundUrl = await getDownloadURL(soundRef);

      // Upload image file
      const imageRef = ref(storage, `images/${user.uid}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(imageRef);

      // Add to Firestore
      await addDoc(collection(db, 'sounds'), {
        name,
        description,
        soundUrl,
        imageUrl,
        userId: user.uid,
        isPublic,
        volume: 0.5,
        category,
        createdAt: serverTimestamp()
      });

      toast({
        title: "Son ajouté",
        description: "Votre son a été ajouté avec succès",
      });

      // Reset form
      setName('');
      setDescription('');
      setSoundFile(null);
      setImageFile(null);
      setCategory('autres');
      setIsPublic(false);
      setOpen(false);

      // Refresh sounds list
      await refreshSounds();
    } catch (error) {
      console.error('Error adding sound:', error);
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
    console.log('Utilisateur non connecté, bouton masqué');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4" />
          Ajouter un son
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-mindful-900 border-mindful-800 p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-white text-xl mb-2">Ajouter un nouveau son</DialogTitle>
          <DialogDescription className="text-white/70">
            Ajoutez un son personnalisé à votre collection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white text-sm font-medium">
                Nom du son
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-mindful-800 border-mindful-700 text-white h-10"
                placeholder="Ex: Pluie douce"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white text-sm font-medium">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-mindful-800 border-mindful-700 text-white h-10"
                placeholder="Ex: Son de pluie légère parfait pour la concentration"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-white text-sm font-medium">
                Catégorie
              </Label>
              <Select value={category} onValueChange={(value: SoundCategory) => setCategory(value)}>
                <SelectTrigger className="bg-mindful-800 border-mindful-700 text-white h-10">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent className="bg-mindful-800 border-mindful-700">
                  <SelectItem value="nature" className="text-white hover:bg-mindful-700">Nature</SelectItem>
                  <SelectItem value="asmr" className="text-white hover:bg-mindful-700">ASMR</SelectItem>
                  <SelectItem value="animaux" className="text-white hover:bg-mindful-700">Animaux</SelectItem>
                  <SelectItem value="lofi" className="text-white hover:bg-mindful-700">Lo-Fi</SelectItem>
                  <SelectItem value="jazz" className="text-white hover:bg-mindful-700">Jazz</SelectItem>
                  <SelectItem value="cours" className="text-white hover:bg-mindful-700">Cours</SelectItem>
                  <SelectItem value="podcast" className="text-white hover:bg-mindful-700">Podcast</SelectItem>
                  <SelectItem value="frequences" className="text-white hover:bg-mindful-700">Fréquences</SelectItem>
                  <SelectItem value="autres" className="text-white hover:bg-mindful-700">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="sound" className="text-white text-sm font-medium">
                  Fichier audio (M4A, MP3)
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Informations sur les fichiers"
                      className="text-white/70 hover:text-white focus:outline-none"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-mindful-800 border-mindful-700 text-white w-80">
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Importer un enregistrement Dictaphone (iPhone)</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Envoi des fichiers : un par envoi.</li>
                        <li>Dictaphone : durée maximale 5 minutes.</li>
                      </ul>
                      <div className="space-y-1">
                        <p className="font-medium">Étapes</p>
                        <ol className="list-decimal pl-4 space-y-1 text-white/90">
                          <li>Ouvrez l’app Dictaphone et choisissez votre enregistrement.</li>
                          <li>Touchez l’icône de partage (carré avec flèche vers le haut).</li>
                          <li>Choisissez « Enregistrer dans Fichiers » et validez l’emplacement.</li>
                          <li>Revenez ici, cliquez sur « Fichier audio », sélectionnez le fichier depuis Fichiers, puis validez.</li>
                        </ol>
                        <p className="text-white/70">Un message d’erreur s’affichera si les conditions ci-dessus ne sont pas respectées.</p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="relative">
                <Input
                  id="sound"
                  type="file"
                  accept="audio/*"
                  onChange={handleSoundFileChange}
                  className="bg-mindful-800 border-mindful-700 text-white h-10 w-full text-sm
                    file:mr-2 file:py-1.5
                    file:rounded-md file:border-0
                    file:text-xs file:font-medium
                    file:bg-mindful-700 file:text-white
                    file:hover:bg-mindful-600
                    hover:cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                    truncate"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-white text-sm font-medium">
                Image (PNG, JPG)
              </Label>
              <div className="relative">
                <Input
                  id="image"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleImageFileChange}
                  className="bg-mindful-800 border-mindful-700 text-white h-10 w-full text-sm
                    file:mr-2 file:py-1.5
                    file:rounded-md file:border-0
                    file:text-xs file:font-medium
                    file:bg-mindful-700 file:text-white
                    file:hover:bg-mindful-600
                    hover:cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                    truncate"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Checkbox
                id="isPublic"
                checked={isPublic}
                onCheckedChange={(checked: boolean) => setIsPublic(checked)}
                className="border-mindful-700 data-[state=checked]:bg-primary w-5 h-5"
              />
              <Label htmlFor="isPublic" className="text-white text-sm">
                Rendre ce son public
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading || !name || !soundFile || !imageFile}
              className="bg-primary hover:bg-primary/90 text-white disabled:bg-mindful-700 w-full sm:w-auto"
            >
              {loading ? 'Ajout en cours...' : 'Ajouter le son'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomSoundButton; 