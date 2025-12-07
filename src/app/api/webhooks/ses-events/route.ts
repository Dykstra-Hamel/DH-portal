/**
 * AWS SES Events Webhook Endpoint
 *
 * Receives SNS notifications from AWS SES for email events (bounces, complaints, deliveries, etc.)
 * This endpoint must be subscribed to the SNS topics configured for SES event destinations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SnsMessage } from '@/types/ses-events';
import { processSnsMessage } from '@/lib/aws-ses/event-processor';
import crypto from 'crypto';

/**
 * Verify SNS message signature for security
 * This prevents spoofed webhook requests
 *
 * @param message - SNS message to verify
 * @returns True if signature is valid
 */
async function verifySnsSignature(message: SnsMessage): Promise<boolean> {
  try {
    // Fetch the certificate from AWS
    const certUrl = message.SigningCertURL;

    // Validate the certificate URL is from AWS
    const url = new URL(certUrl);
    if (
      !url.hostname.endsWith('.amazonaws.com') ||
      url.protocol !== 'https:'
    ) {
      console.error('Invalid SNS certificate URL:', certUrl);
      return false;
    }

    // Fetch the certificate
    const certResponse = await fetch(certUrl);
    if (!certResponse.ok) {
      console.error('Failed to fetch SNS certificate');
      return false;
    }

    const cert = await certResponse.text();

    // Build the string to sign based on message type
    let stringToSign = '';

    if (message.Type === 'SubscriptionConfirmation') {
      stringToSign = [
        'Message',
        message.Message,
        'MessageId',
        message.MessageId,
        'SubscribeURL',
        message.SubscribeURL,
        'Timestamp',
        message.Timestamp,
        'Token',
        message.Token,
        'TopicArn',
        message.TopicArn,
        'Type',
        message.Type,
      ].join('\n') + '\n';
    } else if (message.Type === 'Notification') {
      stringToSign = [
        'Message',
        message.Message,
        'MessageId',
        message.MessageId,
        ...(message.Subject ? ['Subject', message.Subject] : []),
        'Timestamp',
        message.Timestamp,
        'TopicArn',
        message.TopicArn,
        'Type',
        message.Type,
      ].join('\n') + '\n';
    } else {
      console.error('Unknown SNS message type:', message.Type);
      return false;
    }

    // Verify the signature
    const verifier = crypto.createVerify('RSA-SHA1');
    verifier.update(stringToSign, 'utf8');

    const signatureBuffer = Buffer.from(message.Signature, 'base64');
    const isValid = verifier.verify(cert, signatureBuffer);

    return isValid;
  } catch (error) {
    console.error('Error verifying SNS signature:', error);
    return false;
  }
}

/**
 * Handle SNS subscription confirmation
 * AWS SNS requires us to visit the SubscribeURL to confirm the subscription
 *
 * @param message - SNS subscription confirmation message
 * @returns Success status
 */
async function handleSubscriptionConfirmation(
  message: SnsMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!message.SubscribeURL) {
      return { success: false, error: 'No SubscribeURL in message' };
    }

    // Visit the subscription URL to confirm
    const response = await fetch(message.SubscribeURL);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to confirm subscription: ${response.status}`,
      };
    }

    console.log(
      `SNS subscription confirmed for topic: ${message.TopicArn}`
    );

    return { success: true };
  } catch (error) {
    console.error('Error confirming SNS subscription:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to confirm subscription',
    };
  }
}

/**
 * POST handler for SNS webhook
 * Receives and processes AWS SES email events
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the SNS message
    const body = await request.text();
    let snsMessage: SnsMessage;

    try {
      snsMessage = JSON.parse(body);
    } catch (parseError) {
      console.error('Failed to parse SNS message:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // Verify SNS signature for security
    const isValid = await verifySnsSignature(snsMessage);

    if (!isValid) {
      console.error('Invalid SNS signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle subscription confirmation
    if (snsMessage.Type === 'SubscriptionConfirmation') {
      const result = await handleSubscriptionConfirmation(snsMessage);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription confirmed',
      });
    }

    // Handle notification (email event)
    if (snsMessage.Type === 'Notification') {
      const result = await processSnsMessage(snsMessage.Message);

      if (!result.success) {
        console.error('Failed to process SES event:', result.error);
        // Return 200 anyway to prevent SNS from retrying
        // (failed events are logged, don't want infinite retries)
        return NextResponse.json({
          success: false,
          error: result.error,
          warning: 'Event processing failed but acknowledged',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Event processed',
      });
    }

    // Unknown message type
    console.warn('Unknown SNS message type:', snsMessage.Type);
    return NextResponse.json(
      { success: false, error: 'Unknown message type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in SES webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for health check
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'SES webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
