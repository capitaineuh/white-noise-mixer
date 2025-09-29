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
  const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
  if (typeof window !== 'undefined' && isDev) {
    console.log('[DEV]', ...args)
  }
}