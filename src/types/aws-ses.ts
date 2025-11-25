/**
 * TypeScript types for AWS SES operations
 */

export interface SesTenantInfo {
  tenantId: string;
  tenantName: string;
  tenantArn: string;
  sendingStatus: 'ENABLED' | 'PAUSED' | 'ENFORCED' | 'REINSTATED';
  createdTimestamp?: Date;
}

export interface SesIdentityInfo {
  identityArn: string;
  identityName: string;
  identityType: 'EMAIL_ADDRESS' | 'DOMAIN' | 'MANAGED_DOMAIN';
  verifiedForSendingStatus: boolean;
  dkimAttributes?: {
    signingEnabled: boolean;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TEMPORARY_FAILURE' | 'NOT_STARTED';
    tokens?: string[];
  };
}

export interface DkimToken {
  name: string;
  value: string;
  type: 'CNAME';
}

export interface SesConfigurationSet {
  name: string;
  arn?: string;
}

export interface SendEmailParams {
  tenantName: string;
  from: string;
  fromName?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  companyId: string;
  leadId?: string;
  templateId?: string;
  source?: string;
  tags?: string[];
  configurationSetName?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  tenantName?: string;
  sentAt?: string;
}

export interface TenantProvisioningParams {
  companyId: string;
  companyName: string;
  domain?: string;
}

export interface TenantProvisioningResult {
  success: boolean;
  error?: string;
  tenant?: SesTenantInfo;
  identity?: SesIdentityInfo;
  configurationSet?: SesConfigurationSet;
  dkimTokens?: DkimToken[];
}
