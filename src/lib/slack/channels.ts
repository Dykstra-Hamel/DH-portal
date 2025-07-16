import { NotificationChannels } from './types';

// Slack channel configuration
// These can be overridden by environment variables
export const SLACK_CHANNELS: NotificationChannels = {
  PROJECT_REQUESTS: process.env.SLACK_CHANNEL_PROJECT_REQUESTS || '#--project-requests',
};

// Helper to get channel by type
export function getChannelForNotificationType(type: keyof NotificationChannels): string {
  return SLACK_CHANNELS[type];
}

// Helper to validate channel exists
export function isValidChannel(channel: string): boolean {
  return channel.startsWith('#') || channel.startsWith('C'); // Channel name or ID
}