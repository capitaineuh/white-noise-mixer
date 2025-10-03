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
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadLabel, setUploadLabel] = useState<string>('');
  const { user } = useAuth();
  const { refreshSounds } = useSoundContext();
  
  // iOS: limiter la feuille d'actions aux fournisseurs de fichiers uniquement
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const iosAudioAccept = '.m4a,.mp3,.wav,.aac,.flac,.aiff,.aif,.caf,.m4b,.mpeg';
  const defaultAudioAccept = '.m4a,.mp3,.wav,.aac,.flac,.aiff,.aif,.caf,.m4b,.mpeg,audio/m4a,audio/mp4,audio/mpeg,audio/wav,audio/x-wav,audio/aac,audio/x-caf,audio/x-aiff,audio/flac';

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
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const fileName = file.name.toLowerCase();
    const fileType = (file.type || '').toLowerCase();

    const allowedExtensions = [
      '.m4a', '.mp3', '.wav', '.aac', '.flac', '.aiff', '.aif', '.caf', '.m4b', '.mpeg'
    ];
    const allowedMimes = [
      'audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav',
      'audio/aac', 'audio/x-aiff', 'audio/aiff', 'audio/flac', 'audio/x-caf',
      // iOS Voice Memos peut marquer .m4a comme video/mp4
      'video/mp4'
    ];

    const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    const hasAllowedMime = allowedMimes.includes(fileType);

    if (!hasAllowedExtension && !hasAllowedMime) {
      toast({
        title: 'Format non supporté',
        description: 'Veuillez sélectionner un fichier audio (m4a, mp3, wav, aac, flac, aiff).',
        variant: 'destructive',
      });
      return;
    }

    setSoundFile(file);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !soundFile) return;

    setLoading(true);
    setUploadProgress(0);
    setUploadLabel('Préparation…');
    try {
      // Upload sound file (forcer un contentType correct pour compat iOS)
      const soundRef = ref(storage, `sounds/${user.uid}/${Date.now()}_${soundFile.name}`);

      const lowerName = soundFile.name.toLowerCase();
      const inferContentType = () => {
        if (lowerName.endsWith('.m4a') || lowerName.endsWith('.m4b')) return 'audio/mp4';
        if (lowerName.endsWith('.mp3') || lowerName.endsWith('.mpeg')) return 'audio/mpeg';
        if (lowerName.endsWith('.wav')) return 'audio/wav';
        if (lowerName.endsWith('.aac')) return 'audio/aac';
        if (lowerName.endsWith('.flac')) return 'audio/flac';
        if (lowerName.endsWith('.aiff') || lowerName.endsWith('.aif')) return 'audio/aiff';
        if (lowerName.endsWith('.caf')) return 'audio/x-caf';
        return soundFile.type || 'application/octet-stream';
      };

      // Son: suivi de progression
      setUploadLabel('Envoi du son…');
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(soundRef, soundFile, { contentType: inferContentType() });
        task.on('state_changed', (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(pct * 0.6); // 60% du temps alloué au son
        }, (err) => reject(err), () => resolve());
      });
      const soundUrl = await getDownloadURL(soundRef);

      // Upload image file (optionnel) ou image par défaut du site
      let imageUrl: string = '/images/forest.png';
      if (imageFile) {
        const imageRef = ref(storage, `images/${user.uid}/${Date.now()}_${imageFile.name}`);
        setUploadLabel('Envoi de l’image…');
        await new Promise<void>((resolve, reject) => {
          const task = uploadBytesResumable(imageRef, imageFile);
          task.on('state_changed', (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            // Les 40% restants pour l'image
            setUploadProgress(60 + pct * 0.4);
          }, (err) => reject(err), () => resolve());
        });
        imageUrl = await getDownloadURL(imageRef);
      }

      // Add to Firestore
      setUploadLabel('Finalisation…');
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
      setUploadProgress(0);
      setUploadLabel('');
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
                accept={isIOS ? iosAudioAccept : defaultAudioAccept}
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

            {loading && (
              <div className="space-y-2">
                <div className="text-xs text-white/70">{uploadLabel} {Math.round(uploadProgress)}%</div>
                <div className="h-2 w-full bg-mindful-800 rounded">
                  <div
                    className="h-2 bg-white rounded transition-[width] duration-150"
                    style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }}
                  />
                </div>
              </div>
            )}

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
              disabled={loading || !name || !soundFile}
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