/**
 * Development Email Mailer
 * 
 * In development mode, emails are logged to console and saved to local files
 * instead of being sent via the actual email service.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  devPath?: string;
}

class DevMailer {
  private isDev: boolean;
  private emailDir: string;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development' || process.env.INNGEST_DEV === 'true';
    this.emailDir = join(process.cwd(), '.dev-emails');
    
    // Create dev emails directory if it doesn't exist
    if (this.isDev) {
      try {
        mkdirSync(this.emailDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    if (!this.isDev) {
      // In production, use the actual email service
      return this.sendProductionEmail(emailData);
    }

    // Development mode - log and save to file
    return this.sendDevEmail(emailData);
  }

  private async sendDevEmail(emailData: EmailData): Promise<EmailResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `email-${timestamp}-${emailData.to.replace('@', '-at-')}.html`;
    const filePath = join(this.emailDir, fileName);

    // Create HTML preview of the email
    const emailHtml = this.generateEmailPreview(emailData);

    try {
      // Save email to file
      writeFileSync(filePath, emailHtml, 'utf-8');

      // Log to console
      console.log('\\n📧 [DEV EMAIL SENT]');
      console.log('═══════════════════');
      console.log('To:', emailData.to);
      console.log('From:', emailData.from || 'noreply@dh-portal.local');
      console.log('Subject:', emailData.subject);
      console.log('File:', filePath);
      
      if (emailData.templateData) {
        console.log('Template Data:', JSON.stringify(emailData.templateData, null, 2));
      }
      
      if (emailData.metadata) {
        console.log('Metadata:', JSON.stringify(emailData.metadata, null, 2));
      }
      
      console.log('═══════════════════\\n');

      return {
        success: true,
        messageId: `dev-${timestamp}`,
        devPath: filePath
      };

    } catch (error) {
      console.error('❌ Error saving dev email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private generateEmailPreview(emailData: EmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Preview - ${emailData.subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-preview {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .email-header {
            background: #2563eb;
            color: white;
            padding: 20px;
        }
        .email-header h1 {
            margin: 0;
            font-size: 18px;
        }
        .email-meta {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .meta-row {
            margin: 5px 0;
            display: flex;
        }
        .meta-label {
            font-weight: 600;
            width: 80px;
            color: #6b7280;
        }
        .meta-value {
            flex: 1;
        }
        .email-content {
            padding: 30px 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .dev-info {
            padding: 15px 20px;
            background: #fff3cd;
            color: #856404;
            font-size: 14px;
        }
        .template-data {
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
        }
        .template-data pre {
            background: #ffffff;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
            border: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="email-preview">
        <div class="email-header">
            <h1>📧 Development Email Preview</h1>
        </div>
        
        <div class="email-meta">
            <div class="meta-row">
                <span class="meta-label">To:</span>
                <span class="meta-value">${emailData.to}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">From:</span>
                <span class="meta-value">${emailData.from || 'noreply@dh-portal.local'}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Subject:</span>
                <span class="meta-value">${emailData.subject}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Time:</span>
                <span class="meta-value">${new Date().toLocaleString()}</span>
            </div>
        </div>
        
        <div class="dev-info">
            ⚠️ This email was captured in development mode and not actually sent.
        </div>
        
        <div class="email-content">
            ${emailData.html || this.convertTextToHtml(emailData.text || 'No content provided')}
        </div>
        
        ${emailData.templateData ? `
        <div class="template-data">
            <h3>Template Data</h3>
            <pre>${JSON.stringify(emailData.templateData, null, 2)}</pre>
        </div>
        ` : ''}
        
        ${emailData.metadata ? `
        <div class="template-data">
            <h3>Email Metadata</h3>
            <pre>${JSON.stringify(emailData.metadata, null, 2)}</pre>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
  }

  private convertTextToHtml(text: string): string {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  private async sendProductionEmail(emailData: EmailData): Promise<EmailResult> {
    // This would integrate with your actual email service (Resend, etc.)
    // For now, just return a mock response
    console.log('🚀 Would send production email to:', emailData.to);
    
    return {
      success: true,
      messageId: 'prod-' + Date.now()
    };
  }
}

// Export singleton instance
export const devMailer = new DevMailer();