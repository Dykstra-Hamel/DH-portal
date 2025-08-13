export const inngestConfig = {
  id: 'dh-portal',
  name: 'DH Portal Automation',
  retries: process.env.INNGEST_DEV === 'true' ? 1 : 3,
  isDev: process.env.INNGEST_DEV === 'true',
  // In development, we still provide the app ID but no keys
  // This helps the dev server identify and link the app
  eventKey: process.env.INNGEST_DEV === 'true' ? undefined : process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_DEV === 'true' ? undefined : process.env.INNGEST_SIGNING_KEY,
  // Additional dev server configuration
  devServerUrl: process.env.INNGEST_DEV === 'true' ? 'http://localhost:8288' : undefined,
};