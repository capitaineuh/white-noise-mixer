import { useEffect, useRef } from 'react';

// Hook pour gérer la lecture audio en arrière-plan sur mobile
export const useBackgroundAudio = () => {
  const isBackgroundAudioEnabled = useRef(false);

  useEffect(() => {
    // Détecter si on est sur iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!isMobile && !isIOS) return;

    // Gérer la visibilité de la page
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page cachée - activer la lecture en arrière-plan
        isBackgroundAudioEnabled.current = true;
        console.log('Lecture audio en arrière-plan activée');
      } else {
        // Page visible
        isBackgroundAudioEnabled.current = false;
        console.log('Retour en avant-plan');
      }
    };

    // Gérer les événements de cycle de vie de l'application
    const handlePageShow = () => {
      isBackgroundAudioEnabled.current = false;
    };

    const handlePageHide = () => {
      isBackgroundAudioEnabled.current = true;
    };

    // Gérer l'événement de suspension de l'application (iOS)
    const handleBeforeUnload = () => {
      isBackgroundAudioEnabled.current = true;
    };

    // Événements pour la gestion de la visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Pour iOS, gérer spécifiquement les événements de l'app
    if (isIOS) {
      // Empêcher la suspension de l'audio lors du verrouillage de l'écran
      const handleResume = () => {
        console.log('Application reprend - réactiver audio');
      };

      window.addEventListener('focus', handleResume);
      window.addEventListener('resume', handleResume);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pageshow', handlePageShow);
        window.removeEventListener('pagehide', handlePageHide);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('focus', handleResume);
        window.removeEventListener('resume', handleResume);
      };
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return isBackgroundAudioEnabled;
};
