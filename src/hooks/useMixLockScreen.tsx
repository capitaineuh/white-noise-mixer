import { useEffect } from 'react';
import { useSoundContext } from '@/contexts/SoundContext';

// Hook pour gérer l'affichage de l'image du mix sur l'écran de verrouillage
export const useMixLockScreen = () => {
  const { sounds } = useSoundContext();

  useEffect(() => {
    // Trouver le mix actuellement actif (sons en cours de lecture)
    const activeMix = sounds.filter(sound => sound.isPlaying);
    
    if (activeMix.length > 0) {
      // Chercher une image de mix personnalisée
      // Pour l'instant, on utilise la première image disponible
      // Dans une version future, on pourrait stocker l'image du mix actuel
      const mixImage = activeMix.find(sound => sound.imageUrl)?.imageUrl;
      
      if (mixImage) {
        // Mettre à jour le favicon avec l'image du mix
        updateFavicon(mixImage);
      } else {
        // Retour au favicon par défaut
        resetFavicon();
      }
    } else {
      // Aucun son actif, retour au favicon par défaut
      resetFavicon();
    }
  }, [sounds]);

  const updateFavicon = (imageUrl: string) => {
    // Créer un nouveau lien pour le favicon
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    
    if (link) {
      // Créer une nouvelle image pour redimensionner
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Créer un canvas pour redimensionner l'image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Taille cible pour le favicon (32x32)
          canvas.width = 32;
          canvas.height = 32;
          
          // Dessiner l'image redimensionnée
          ctx.drawImage(img, 0, 0, 32, 32);
          
          // Convertir en favicon
          const faviconUrl = canvas.toDataURL('image/png');
          
          // Mettre à jour le favicon
          link.href = faviconUrl;
          
          // Ajouter un attribut data pour identifier qu'il s'agit d'un favicon personnalisé
          link.setAttribute('data-mix-favicon', 'true');
        }
      };
      
      img.src = imageUrl;
    }
  };

  const resetFavicon = () => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    
    if (link && link.hasAttribute('data-mix-favicon')) {
      // Remettre le favicon par défaut
      link.href = '/ico/favicon-16x16.png';
      link.removeAttribute('data-mix-favicon');
    }
  };
};

// Hook pour gérer les métadonnées de l'écran de verrouillage (pour mobile)
export const useLockScreenMetadata = () => {
  const { sounds } = useSoundContext();

  useEffect(() => {
    const activeMix = sounds.filter(sound => sound.isPlaying);
    
    if (activeMix.length > 0) {
      // Créer un titre pour l'écran de verrouillage
      const mixTitle = activeMix.length === 1 
        ? activeMix[0].name 
        : `Mix (${activeMix.length} sons)`;
      
      // Mettre à jour le titre de la page
      const originalTitle = document.title;
      document.title = `${mixTitle} - Bruits Blancs`;
      
      // Cleanup: remettre le titre original quand on quitte
      return () => {
        document.title = originalTitle;
      };
    }
  }, [sounds]);
};
