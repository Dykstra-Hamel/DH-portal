/**
 * TypeScript types for AWS SES event notifications via SNS
 * Based on AWS SES Event Publishing documentation
 */

export interface SnsMessage {
  Type: 'Notification' | 'SubscriptionConfirmation';
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL: string;
  Token?: string; // For subscription confirmation
  SubscribeURL?: string; // For subscription confirmation
}

export type SesEventType =
  | 'Bounce'
  | 'Complaint'
  | 'Delivery'
  | 'Send'
  | 'Reject'
  | 'Open'
  | 'Click'
  | 'Rendering Failure'
  | 'DeliveryDelay'
  | 'Subscription';

export interface SesEvent {
  eventType: SesEventType;
  mail: SesMail;
  bounce?: SesBounce;
  complaint?: SesComplaint;
  delivery?: SesDelivery;
  send?: object;
  reject?: SesReject;
  open?: SesOpen;
  click?: SesClick;
  renderingFailure?: SesRenderingFailure;
  deliveryDelay?: SesDeliveryDelay;
}

export interface SesMail {
  timestamp: string;
  source: string;
  sourceArn?: string;
  sourceIp?: string;
  sendingAccountId?: string;
  messageId: string;
  destination: string[];
  headersTruncated?: boolean;
  headers?: Array<{
    name: string;
    value: string;
  }>;
  commonHeaders?: {
    from?: string[];
    to?: string[];
    messageId?: string;
    subject?: string;
  };
  tags?: Record<string, string[]>;
}

export interface SesBounce {
  bounceType: 'Undetermined' | 'Permanent' | 'Transient';
  bounceSubType: string;
  bouncedRecipients: Array<{
    emailAddress: string;
    action?: string;
    status?: string;
    diagnosticCode?: string;
  }>;
  timestamp: string;
  feedbackId: string;
  reportingMTA?: string;
  remoteMtaIp?: string;
}

export interface SesComplaint {
  complainedRecipients: Array<{
    emailAddress: string;
  }>;
  timestamp: string;
  feedbackId: string;
  userAgent?: string;
  complaintFeedbackType?:
    | 'abuse'
    | 'auth-failure'
    | 'fraud'
    | 'not-spam'
    | 'other'
    | 'virus';
  arrivalDate?: string;
  complaintSubType?: string;
}

export interface SesDelivery {
  timestamp: string;
  processingTimeMillis: number;
  recipients: string[];
  smtpResponse: string;
  reportingMTA: string;
  remoteMtaIp?: string;
}

export interface SesReject {
  reason: string;
}

export interface SesOpen {
  timestamp: string;
  userAgent: string;
  ipAddress: string;
}

export interface SesClick {
  timestamp: string;
  userAgent: string;
  ipAddress: string;
  link: string;
  linkTags?: Record<string, string[]>;
}

export interface SesRenderingFailure {
  templateName: string;
  errorMessage: string;
}

export interface SesDeliveryDelay {
  timestamp: string;
  delayType: 'InternalFailure' | 'General' | 'MailboxFull' | 'SpamDetected' | 'RecipientServerError';
  delayedRecipients: Array<{
    emailAddress: string;
    status?: string;
    diagnosticCode?: string;
  }>;
  expirationTime?: string;
}

export interface ProcessedSesEvent {
  eventType: SesEventType;
  messageId: string;
  recipientEmail: string;
  timestamp: string;
  bounceType?: string;
  bounceSubType?: string;
  complaintFeedbackType?: string;
  deliveryStatus?: string;
  rawEvent: SesEvent;
}
