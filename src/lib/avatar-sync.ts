'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AvatarSyncResult {
  updated: boolean;
  error?: string;
}

/**
 * Extract avatar URL from user metadata, checking multiple possible fields
 */
function extractAvatarFromUser(user: User): string | null {
  if (!user.user_metadata) return null;

  // Check for various avatar fields that OAuth providers might use
  const avatarUrl = user.user_metadata.avatar_url ||
                   user.user_metadata.picture ||
                   user.user_metadata.profile_image ||
                   user.user_metadata.profile_picture_url;

  return avatarUrl || null;
}

/**
 * Check if avatar sync is needed (rate limiting - only once per day)
 */
async function shouldSyncAvatar(userId: string): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('updated_at')
      .eq('id', userId)
      .single();

    if (!profile) return true; // No profile found, sync needed

    // Check if profile was last updated more than 24 hours ago
    const lastUpdate = new Date(profile.updated_at);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    return hoursSinceUpdate >= 24;
  } catch (error) {
    console.error('Error checking avatar sync timing:', error);
    return false; // Don't sync if we can't determine timing
  }
}

/**
 * Sync user avatar from OAuth metadata to profile table
 */
export async function syncUserAvatar(user: User): Promise<AvatarSyncResult> {
  if (!user?.id) {
    return { updated: false, error: 'No user provided' };
  }

  try {
    // Check if sync is needed (rate limiting)
    const needsSync = await shouldSyncAvatar(user.id);
    if (!needsSync) {
      return { updated: false };
    }

    const supabase = createClient();
    const newAvatarUrl = extractAvatarFromUser(user);

    // Get current profile to compare avatar
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    // Only update if avatar has changed or is missing
    if (currentProfile?.avatar_url === newAvatarUrl) {
      return { updated: false };
    }

    // Update the profile with new avatar
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: newAvatarUrl
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating avatar:', updateError);
      return { updated: false, error: updateError.message };
    }

    console.log(`Avatar synced for user ${user.id}:`, {
      old: currentProfile?.avatar_url,
      new: newAvatarUrl
    });

    return { updated: true };
  } catch (error) {
    console.error('Error syncing avatar:', error);
    return {
      updated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync avatar on auth state changes (login events)
 */
export function setupAvatarSyncListener() {
  const supabase = createClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      // Only sync on sign-in events to avoid unnecessary calls
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await syncUserAvatar(session.user);
        } catch (error) {
          console.error('Avatar sync failed on login:', error);
        }
      }
    }
  );

  return subscription;
}