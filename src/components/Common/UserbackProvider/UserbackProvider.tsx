'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
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

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_USERBACK_TOKEN;

    if (!token) {
      console.warn(
        'NEXT_PUBLIC_USERBACK_TOKEN not found. Userback widget will not be initialized.'
      );
      return;
    }

    console.log(
      'Initializing Userback widget with token:',
      token.substring(0, 10) + '...'
    );

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
  }, [user, profile, loading]);

  return (
    <UserbackContext.Provider value={{ userback }}>
      {children}
    </UserbackContext.Provider>
  );
}

export function useUserback(): UserbackContextType | null {
  return useContext(UserbackContext);
}
