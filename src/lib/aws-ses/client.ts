/**
 * AWS SES v2 Client Configuration
 *
 * Provides a singleton SESv2Client instance configured for the us-east-1 region.
 * Uses AWS credentials from environment variables or IAM role.
 */

import { SESv2Client } from '@aws-sdk/client-sesv2';

// AWS Configuration from environment
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Validate required configuration
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.warn(
    'AWS credentials not found in environment variables. ' +
    'Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set.'
  );
}

/**
 * Singleton SESv2Client instance
 * Configured for us-east-1 region with credentials from environment
 */
export const sesClient = new SESv2Client({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      }
    : undefined, // Will fall back to IAM role if running on AWS infrastructure
});

/**
 * Get the configured AWS region
 */
export const getSESRegion = (): string => {
  return AWS_REGION;
};

/**
 * Check if AWS SES is properly configured
 */
export const isSESConfigured = (): boolean => {
  return !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);
};

export default sesClient;
