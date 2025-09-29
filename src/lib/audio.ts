let sharedAudioContext: (AudioContext | null) = null;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedAudioContext) return sharedAudioContext;
  const AC: typeof AudioContext | undefined = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  try {
    sharedAudioContext = new AC();
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
    } catch {
      // ignore
    }
  }
}


