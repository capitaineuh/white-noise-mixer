import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Volume2 } from 'lucide-react';

interface BackgroundAudioInstructionsProps {
  onClose: () => void;
}

const BackgroundAudioInstructions: React.FC<BackgroundAudioInstructionsProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Vérifier si on est sur mobile et si l'utilisateur n'a pas déjà vu ces instructions
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasSeenInstructions = localStorage.getItem('backgroundAudioInstructionsSeen');
    
    if (isMobile && !hasSeenInstructions) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('backgroundAudioInstructionsSeen', 'true');
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-mindful-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold text-white">
              Lecture en arrière-plan
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-mindful-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 text-mindful-300">
          <p className="text-sm">
            Pour que la musique continue quand vous fermez votre iPhone :
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                <Volume2 className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">1. Ajoutez à l'écran d'accueil</p>
                <p className="text-xs">Utilisez le bouton "Partager" puis "Sur l'écran d'accueil"</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                <Volume2 className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">2. Lancez depuis l'écran d'accueil</p>
                <p className="text-xs">Ouvrez l'app depuis l'icône sur votre écran d'accueil</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                <Volume2 className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">3. Activez le son</p>
                <p className="text-xs">Démarrez une piste audio puis fermez l'écran</p>
              </div>
            </div>
          </div>

          <div className="bg-mindful-900/50 rounded-lg p-3 mt-4">
            <p className="text-xs text-mindful-400">
              💡 <strong>Astuce :</strong> La lecture continue automatiquement quand vous verrouillez votre iPhone si l'app a été lancée depuis l'écran d'accueil.
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">
            J'ai compris
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundAudioInstructions;
