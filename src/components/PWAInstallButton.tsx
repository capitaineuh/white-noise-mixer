import React, { useState, useEffect } from 'react';
import { Download, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';

// Type pour l'événement beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      // Pour les navigateurs qui supportent display-mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Pour iOS Safari
      type NavigatorWithStandalone = Navigator & { standalone?: boolean };
      const nav = window.navigator as NavigatorWithStandalone;
      if (nav.standalone === true) {
        setIsInstalled(true);
        return;
      }

      // Vérifier si l'app est dans le menu home sur mobile
      if (window.matchMedia('(display-mode: fullscreen)').matches) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      
      toast({
        title: "App installée !",
        description: "L'application a été installée avec succès sur votre appareil.",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback pour les navigateurs qui ne supportent pas beforeinstallprompt
      toast({
        title: "Installation manuelle",
        description: "Utilisez le menu de votre navigateur pour ajouter cette app à votre écran d'accueil.",
        variant: "default",
      });
      return;
    }

    try {
      // Afficher le prompt d'installation
      await deferredPrompt.prompt();
      
      // Attendre la réponse de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: "Installation en cours...",
          description: "L'application va être installée sur votre appareil.",
        });
      } else {
        toast({
          title: "Installation annulée",
          description: "Vous pouvez installer l'app plus tard depuis le menu de votre navigateur.",
          variant: "default",
        });
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
      toast({
        title: "Erreur d'installation",
        description: "Une erreur est survenue. Essayez d'installer l'app depuis le menu de votre navigateur.",
        variant: "destructive",
      });
    }
  };

  const handleIOSInstall = () => {
    toast({
      title: "Installation sur iOS",
      description: "Appuyez sur le bouton de partage et sélectionnez 'Ajouter à l'écran d'accueil'.",
      variant: "default",
    });
  };

  // Ne pas afficher le bouton si l'app est déjà installée
  if (isInstalled) {
    return null;
  }

  // Détecter iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

  // Pour iOS, afficher un bouton d'aide à l'installation
  if (isIOS && !isInStandaloneMode) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleIOSInstall}
              className="flex items-center gap-2 bg-transparent border-mindful-700 text-white hover:bg-mindful-800"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Installer</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Installer l'app sur votre appareil</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Afficher le bouton d'installation pour les autres navigateurs
  if (!showInstallButton) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-transparent border-mindful-700 text-white hover:bg-mindful-800 animate-pulse"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Installer</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Installer l'application sur votre appareil</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PWAInstallButton;
