import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Logs visibles uniquement en développement (vite dev server)
export function devLog(...args: unknown[]): void {
  // import.meta.env.DEV est true en dev, false en build prod
  // window check pour éviter d'exécuter côté SSR/hors navigateur
  // eslint-disable-next-line no-console
  if (typeof window !== 'undefined' && import.meta.env && (import.meta.env as any).DEV) {
    console.log('[DEV]', ...args)
  }
}