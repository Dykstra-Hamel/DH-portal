// import { Resend } from 'resend';

// if (!process.env.RESEND_API_KEY) {
//   throw new Error('RESEND_API_KEY environment variable is required');
// }

// export const resend = new Resend(process.env.RESEND_API_KEY);

// MailerSend configuration
if (!process.env.MAILERSEND_API_TOKEN) {
  throw new Error('MAILERSEND_API_TOKEN environment variable is required');
}

export const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN;
export const MAILERSEND_FROM_EMAIL = 'noreply@nwexterminating.com';

// Re-export all email services
export * from './project-notifications';
export * from './lead-notifications';
export * from './types';
