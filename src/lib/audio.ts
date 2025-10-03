let sharedAudioContext: (AudioContext | null) = null;
let isContextResumed = false;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedAudioContext) return sharedAudioContext;
  const AC: typeof AudioContext | undefined =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    sharedAudioContext = new AC();
    
    // Configurer l'AudioContext pour la lecture en arrière-plan
    if (sharedAudioContext.state === 'suspended') {
      // Sur mobile, on doit attendre une interaction utilisateur
      console.log('AudioContext créé mais suspendu - en attente d\'interaction utilisateur');
    }
  } catch {
    sharedAudioContext = null;
  }
  return sharedAudioContext;
}

export async function resumeSharedAudioContext(): Promise<void> {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
      isContextResumed = true;
      console.log('AudioContext reprend - lecture en arrière-plan activée');
    } catch (error) {
      console.warn('Impossible de reprendre l\'AudioContext:', error);
    }
  } else if (ctx.state === 'running') {
    isContextResumed = true;
  }
}

// Fonction pour maintenir l'AudioContext actif en arrière-plan
export function keepAudioContextAlive(): void {
  const ctx = getSharedAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  // Créer un nœud de gain silencieux pour maintenir l'AudioContext actif
  try {
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0; // Silence total
    gainNode.connect(ctx.destination);
    
    // Le nœud sera automatiquement nettoyé par le garbage collector
    setTimeout(() => {
      try {
        gainNode.disconnect();
      } catch {
        // ignore
      }
    }, 100);
  } catch {
    // ignore
  }
}

// Vérifier si l'AudioContext est prêt pour la lecture en arrière-plan
export function isAudioContextReady(): boolean {
  const ctx = getSharedAudioContext();
  return ctx !== null && ctx.state === 'running' && isContextResumed;
}


