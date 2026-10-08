'use client';
import { useEffect } from 'react';

// Registers the PWA service worker (offline support). Runs once per page load.
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Only register on the live site / localhost, never inside iframes or previews.
    if (window.self !== window.top) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* offline support is best-effort; the site works fine without it */
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}
