import { createClient } from '@/lib/supabase/server';
import { WebClient } from '@slack/web-api';

/**
 * Maps a database user ID to a Slack user ID by email
 * Returns null if user not found or no Slack integration
 */
export async function getSlackUserIdByDatabaseUserId(
  userId: string
): Promise<string | null> {
  if (!process.env.SLACK_BOT_TOKEN) return null;

  const supabase = await createClient();

  // Get user email from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (!profile?.email) return null;

  // Look up Slack user by email
  const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

  try {
    const result = await slackClient.users.lookupByEmail({
      email: profile.email
    });

    if (result.ok && result.user?.id) {
      return result.user.id;
    }
  } catch (error) {
    console.error('Error looking up Slack user:', error);
  }

  return null;
}
