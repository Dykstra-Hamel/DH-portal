'use client';

import { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallResult {
  isInstalled: boolean;
  isIOS: boolean;
  canInstall: boolean;
  showInstallButton: boolean;
  handleInstall: () => Promise<void>;
}

export function usePWAInstall(): UsePWAInstallResult {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Detect if already running as standalone PWA
    const standaloneIOS = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(standaloneIOS || standaloneMedia);

    // Detect iOS/Safari
    const ios = /iPad|iPhone|iPod/i.test(navigator.userAgent) && !('MSStream' in window);
    setIsIOS(ios);

    type PWAWindow = Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent };

    const applyStashedPrompt = () => {
      const stashed = (window as PWAWindow).__pwaInstallPrompt;
      if (stashed) {
        deferredPrompt.current = stashed;
        setCanInstall(true);
      }
    };

    // Case 1: inline script already captured the event before this hook mounted
    applyStashedPrompt();

    // Case 2: hook mounted before the event fired — inline script will dispatch
    // 'pwa-prompt-ready' when it captures it, so we pick it up here
    window.addEventListener('pwa-prompt-ready', applyStashedPrompt);

    // Case 3: no inline script (e.g. SSR cache miss) — catch the event directly
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt.current = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-ready', applyStashedPrompt);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;

    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
    }

    deferredPrompt.current = null;
    delete (window as Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt;
  };

  const showInstallButton = !isInstalled && (isIOS || canInstall);

  return {
    isInstalled,
    isIOS,
    canInstall,
    showInstallButton,
    handleInstall,
  };
}
