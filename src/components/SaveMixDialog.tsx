import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SaveAll, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useSoundContext } from '@/contexts/SoundContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const SaveMixDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mixName, setMixName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const { saveMix, sounds } = useSoundContext();
  const { user } = useAuth();

  const activeSounds = sounds.filter(sound => sound.isPlaying);
  const canSave = activeSounds.length > 0 && user;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image valide.",
          variant: "destructive",
        });
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "L'image ne doit pas dépasser 5MB.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSave = async () => {
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

    if (!mixName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom pour le mix.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | undefined = undefined;

      // Upload de l'image si une image est sélectionnée
      if (imageFile && user) {
        const imageRef = ref(storage, `mix-images/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Sauvegarder le mix
      saveMix(mixName, imageUrl, isPublic);

      toast({
        title: "Mix sauvegardé !",
        description: `Le mix "${mixName}" a été sauvegardé avec succès.`,
      });

      // Reset form
      setMixName('');
      setImageFile(null);
      setImagePreview(null);
      setIsPublic(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving mix:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du mix.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={!canSave}
          className={`flex items-center gap-2 bg-primary hover:bg-primary/90 text-white border-primary ${
            !canSave ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <SaveAll size={16} />
          <span>Sauvegarder le mix</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-mindful-800 border-mindful-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Sauvegarder le mix</DialogTitle>
          <p className="text-sm text-mindful-400">
            Sons actifs: {activeSounds.map(s => s.name).join(', ')}
          </p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Nom du mix */}
          <div className="space-y-2">
            <Label htmlFor="mixName" className="text-white text-sm font-medium">
              Nom du mix
            </Label>
            <Input
              id="mixName"
              type="text"
              placeholder="Mon mix relaxant..."
              value={mixName}
              onChange={(e) => setMixName(e.target.value)}
              className="bg-mindful-900 border-mindful-700 text-white placeholder:text-mindful-400"
            />
          </div>

          {/* Upload d'image */}
          <div className="space-y-2">
            <Label className="text-white text-sm font-medium">
              Image du mix (optionnel)
            </Label>
            <p className="text-xs text-mindful-400">
              Cette image s'affichera lors du verrouillage d'écran sur mobile
            </p>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-mindful-700 rounded-lg p-6 text-center hover:border-mindful-600 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="imageUpload"
                />
                <Label
                  htmlFor="imageUpload"
                  className="cursor-pointer flex flex-col items-center gap-2 text-mindful-400 hover:text-white transition-colors"
                >
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">Cliquer pour ajouter une image</span>
                  <span className="text-xs">PNG, JPG (max 5MB)</span>
                </Label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Aperçu du mix"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeImage}
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Checkbox isPublic */}
          <div className="flex items-center space-x-3 pt-2">
            <Checkbox
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked: boolean) => setIsPublic(checked)}
              className="border-mindful-700 data-[state=checked]:bg-primary w-5 h-5"
            />
            <Label htmlFor="isPublic" className="text-white text-sm">
              Rendre ce mix public
            </Label>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            onClick={handleSave}
            disabled={loading || !mixName.trim()}
            className="bg-primary hover:bg-primary/90 text-white disabled:bg-mindful-700 w-full"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder le mix'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveMixDialog; 