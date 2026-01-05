'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import Userback from '@userback/widget';
import { useUser } from '@/hooks/useUser';

interface UserbackContextType {
  userback: any;
}

const UserbackContext = createContext<UserbackContextType | null>(null);

interface UserbackProviderProps {
  children: ReactNode;
}

export function UserbackProvider({ children }: UserbackProviderProps) {
  const [userback, setUserback] = useState<any>(null);
  const { user, profile, loading } = useUser();
  const pathname = usePathname();

  // Check if current route is a public route
  const isPublicRoute = () => {
    if (!pathname) return false;

    // Public routes where Userback should not show
    const publicRoutes = [
      /^\/campaign\//, // Campaign landing pages
      /^\/[^/]+\/quote\//, // Quote landing pages (e.g., /company-slug/quote/id)
      /^\/unsubscribe/, // Unsubscribe page
      /^\/login/, // Login page
      /^\/sign-up/, // Sign up page
      /^\/auth\//, // Auth callback pages
    ];

    return publicRoutes.some(route => route.test(pathname));
  };

  useEffect(() => {
    // Don't initialize Userback on public routes
    if (isPublicRoute()) {
      return;
    }

    const token = process.env.NEXT_PUBLIC_USERBACK_TOKEN;

    if (!token) {
      console.warn(
        'NEXT_PUBLIC_USERBACK_TOKEN not found. Userback widget will not be initialized.'
      );
      return;
    }

    const initUserback = async () => {
      try {
        const userData = user
          ? {
              id: user.id,
              info: {
                name: profile
                  ? `${profile.first_name}`
                  : user.user_metadata?.first_name
                    ? `${user.user_metadata.first_name}`
                    : user.email || 'User',
                email: user.email || '',
              },
            }
          : undefined;

        const instance = await Userback(token, {
          user_data: userData,
          autohide: false,
        });

        setUserback(instance);
      } catch (error) {
        console.error('Failed to initialize Userback:', error);
      }
    };

    // Only initialize after user data is loaded (or confirmed not authenticated)
    if (!loading) {
      initUserback();
    }
  }, [user, profile, loading, pathname]);

  return (
    <UserbackContext.Provider value={{ userback }}>
      {children}
    </UserbackContext.Provider>
  );
}

export function useUserback(): UserbackContextType | null {
  return useContext(UserbackContext);
}
