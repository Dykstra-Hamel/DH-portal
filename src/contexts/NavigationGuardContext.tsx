'use client';
import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/Common/ConfirmationModal/ConfirmationModal';

interface NavigationGuardContextType {
  registerGuard: (fn: () => boolean) => void;
  unregisterGuard: () => void;
  hasActiveGuard: () => boolean;
  requestNavigation: (path: string) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const guardFnRef = useRef<(() => boolean) | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const registerGuard = useCallback((fn: () => boolean) => {
    guardFnRef.current = fn;
  }, []);

  const unregisterGuard = useCallback(() => {
    guardFnRef.current = null;
  }, []);

  const hasActiveGuard = useCallback(() => {
    return guardFnRef.current?.() ?? false;
  }, []);

  const requestNavigation = useCallback((path: string) => {
    if (guardFnRef.current?.()) {
      setPendingPath(path);
      setModalOpen(true);
    } else {
      router.push(path);
    }
  }, [router]);

  return (
    <NavigationGuardContext.Provider value={{ registerGuard, unregisterGuard, hasActiveGuard, requestNavigation }}>
      {children}
      <ConfirmationModal
        isOpen={modalOpen}
        title="You have unsaved content"
        message="Your content edits haven&apos;t been saved. If you leave now, those changes will be lost."
        confirmText="Leave without saving"
        cancelText="Stay and save"
        confirmVariant="danger"
        onConfirm={() => {
          setModalOpen(false);
          if (pendingPath) router.push(pendingPath);
          setPendingPath(null);
        }}
        onCancel={() => {
          setModalOpen(false);
          setPendingPath(null);
        }}
      />
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) throw new Error('useNavigationGuard must be used within NavigationGuardProvider');
  return ctx;
}
