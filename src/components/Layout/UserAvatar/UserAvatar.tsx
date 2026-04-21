'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Settings, LogOut, Shield, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getAvatarColor } from '@/lib/avatarColor';
import styles from './UserAvatar.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  uploaded_avatar_url?: string;
  avatar_url?: string;
}

export function UserAvatar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const router = useRouter();
  const { isIOS, showInstallButton, handleInstall } = usePWAInstall();

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      router.push('/login');
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDropdownAction = (action: string) => {
    setShowDropdown(false);

    switch (action) {
      case 'profile':
        // Navigate to profile page when implemented
        console.log('Navigate to profile');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'admin':
        router.push('/admin');
        break;
      case 'install-app':
        if (isIOS) {
          setShowIOSInstructions(true);
        } else {
          handleInstall();
        }
        break;
      case 'signout':
        handleSignOut();
        break;
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name.charAt(0)}${user.user_metadata.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getAvatarUrl = () => {
    if (avatarError) return null;

    // Uploaded avatar takes highest priority
    if (profile?.uploaded_avatar_url) return profile.uploaded_avatar_url;

    // Fall back to OAuth provider avatar
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
    if (user?.user_metadata?.picture) return user.user_metadata.picture;
    if (user?.user_metadata?.profile_image) return user.user_metadata.profile_image;

    return null;
  };

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    return user?.email || 'User';
  };

  const getUserRole = () => {
    if (profile?.role === 'admin') {
      return 'Administrator';
    }
    return 'User';
  };

  const isAdmin = profile?.role === 'admin';

  if (loading) {
    return (
      <div className={styles.avatarContainer}>
        <div className={styles.avatarButton}>
          <div className={styles.avatarSkeleton}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.avatarContainer}>
      <button
        className={styles.avatarButton}
        onClick={toggleDropdown}
        aria-label="User menu"
      >
        <div
          className={styles.avatar}
          style={!getAvatarUrl() && user ? { backgroundColor: getAvatarColor(user.email!) } : undefined}
        >
          {getAvatarUrl() ? (
            <Image
              src={getAvatarUrl()!}
              alt={getDisplayName()}
              width={40}
              height={40}
              className={styles.avatarImage}
              onError={handleAvatarError}
            />
          ) : (
            <span className={styles.avatarInitials}>{getInitials()}</span>
          )}
        </div>
      </button>

      {showDropdown && (
        <>
          <div
            className={styles.backdrop}
            onClick={() => setShowDropdown(false)}
          />
          <div className={styles.userDropdown}>
            <div className={styles.dropdownHeader}>
              <div className={styles.userInfo}>
                <div
                  className={styles.avatarLarge}
                  style={!getAvatarUrl() && user ? { backgroundColor: getAvatarColor(user.email!) } : undefined}
                >
                  {getAvatarUrl() ? (
                    <Image
                      src={getAvatarUrl()!}
                      alt={getDisplayName()}
                      width={80}
                      height={80}
                      className={styles.avatarImageLarge}
                      onError={handleAvatarError}
                    />
                  ) : (
                    <span className={styles.avatarInitials}>
                      {getInitials()}
                    </span>
                  )}
                </div>
                <div className={styles.userDetails}>
                  <p className={styles.userName}>{getDisplayName()}</p>
                  <p className={styles.userEmail}>{user?.email}</p>
                  <span className={styles.userRole}>{getUserRole()}</span>
                </div>
              </div>
            </div>

            <div className={styles.dropdownContent}>
              {showInstallButton && (
                <button
                  className={`${styles.dropdownItem} ${styles.installButton}`}
                  onClick={() => handleDropdownAction('install-app')}
                >
                  <Download size={16} />
                  <span>Install App</span>
                </button>
              )}

              <button
                className={styles.dropdownItem}
                onClick={() => handleDropdownAction('profile')}
              >
                <User size={16} />
                <span>Profile</span>
              </button>

              {isAdmin && (
                <>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => handleDropdownAction('settings')}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>

                  <button
                    className={styles.dropdownItem}
                    onClick={() => handleDropdownAction('admin')}
                  >
                    <Shield size={16} />
                    <span>Admin Dashboard</span>
                  </button>
                </>
              )}

              <hr className={styles.dropdownDivider} />

              <button
                className={`${styles.dropdownItem} ${styles.signOut}`}
                onClick={() => handleDropdownAction('signout')}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
      {showIOSInstructions && (
        <div className={styles.iosModal} onClick={() => setShowIOSInstructions(false)}>
          <div className={styles.iosModalCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.iosModalTitle}>Install App</p>
            <p className={styles.iosModalInstructions}>
              Tap the <span className={styles.iosShareIcon}>⬆</span> <strong>Share</strong> icon
              in Safari&apos;s toolbar, then select <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
            </p>
            <button
              className={styles.iosModalClose}
              onClick={() => setShowIOSInstructions(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
