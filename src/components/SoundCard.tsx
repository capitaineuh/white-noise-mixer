import React, { useState } from 'react';
import { Play, Pause, Trash2, Info } from 'lucide-react';
import { Sound } from '@/types/sound';
import VolumeSlider from './VolumeSlider';
import useSoundPlayer from '../hooks/useSoundPlayer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db, storage } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { toast } from '../components/ui/use-toast';
import { useSoundContext } from '../contexts/SoundContext';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const audioRef = useSoundPlayer(sound);
  const { refreshSounds } = useSoundContext();
  
  const handleDelete = async () => {
    try {
      if (sound.id) {
        // Supprimer le document Firestore
        await deleteDoc(doc(db, 'sounds', sound.id));

        // Supprimer les fichiers de stockage
        if (sound.soundUrl) {
          const soundRef = ref(storage, sound.soundUrl);
          await deleteObject(soundRef);
        }
        if (sound.imageUrl) {
          const imageRef = ref(storage, sound.imageUrl);
          await deleteObject(imageRef);
        }

        // Rafraîchir la liste des sons
        await refreshSounds();

        toast({
          title: "Succès",
          description: "Le son a été supprimé avec succès",
        });
      }
    } catch (error) {
      console.error('Error deleting sound:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du son",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div 
        className={cn(
          "sound-card animate-fade-in relative",
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
            <div className="flex justify-between items-start">
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

              <div className="flex gap-2">
                {sound.description && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDescription(true)}
                    className="text-mindful-400 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    <Info size={16} />
                  </Button>
                )}
                {sound.userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="text-mindful-400 hover:text-white hover:bg-destructive/20"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </div>
            
            <div>
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

        {/* Description Popup */}
        {showDescription && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
            onClick={() => setShowDescription(false)}
          >
            <div className="absolute inset-0 bg-mindful-900/60 backdrop-blur-sm" />
            <div 
              className="relative bg-mindful-800/95 p-6 rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {sound.name}
                    </h3>
                    <p className="text-sm text-mindful-400">
                      {sound.category.charAt(0).toUpperCase() + sound.category.slice(1)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDescription(false)}
                    className="text-mindful-400 hover:text-white hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </div>
                <div className="bg-mindful-900/50 rounded-lg p-4">
                  <p className="text-white/90 leading-relaxed">
                    {sound.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-mindful-800 border-mindful-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le son</AlertDialogTitle>
            <AlertDialogDescription className="text-mindful-300">
              Êtes-vous sûr de vouloir supprimer ce son ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-mindful-700 hover:bg-mindful-600 border-mindful-600 text-white">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SoundCard;
