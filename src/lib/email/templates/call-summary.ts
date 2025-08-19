import { CallSummaryEmailData } from '../types';

export function generateCallSummaryEmailTemplate(
  recipientName: string,
  callData: CallSummaryEmailData
): string {
  const {
    companyName,
    customerName,
    customerEmail,
    customerPhone,
    fromNumber,
    callStatus,
    callDuration,
    callDate,
    sentiment,
    callSummary,
    pestIssue,
    streetAddress,
    homeSize,
    yardSize,
    decisionMaker,
    preferredServiceTime,
    contactedOtherCompanies,
    leadId,
    recordingUrl,
    disconnectReason,
  } = callData;

  const sentimentColors = {
    positive: '#10b981',
    neutral: '#f59e0b',
    negative: '#ef4444',
  };

  const statusColors = {
    completed: '#10b981',
    failed: '#ef4444',
    'no-answer': '#f59e0b',
    busy: '#f59e0b',
    cancelled: '#6b7280',
  };

  const sentimentColor = sentiment ? sentimentColors[sentiment] : '#6b7280';
  const statusColor = statusColors[callStatus as keyof typeof statusColors] || '#6b7280';
  const formattedDate = new Date(callDate).toLocaleString();
  const durationText = callDuration ? `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : 'N/A';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Call Summary Report</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155;">
      <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
            📞 Call Summary Report
          </h1>
          <p style="margin: 8px 0 0 0; color: #e2e8f0; font-size: 16px;">
            ${companyName}
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 32px;">

          <!-- Call Overview -->
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              📊 Call Overview
            </h3>
            
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Customer Phone:</span>
                <a href="tel:${customerPhone}" style="color: #1e40af; text-decoration: none;">${customerPhone}</a>
              </div>
              
              ${fromNumber ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                  <span style="font-weight: 500; color: #64748b;">From Number:</span>
                  <span style="color: #1e293b;">${fromNumber}</span>
                </div>
              ` : ''}
              
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                <span style="font-weight: 500; color: #64748b;">Call Status:</span>
                <span style="color: ${statusColor}; font-weight: 600;">${callStatus.toUpperCase()}</span>
              </div>
              
              ${sentiment ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                  <span style="font-weight: 500; color: #64748b;">Sentiment:</span>
                  <span style="color: ${sentimentColor}; font-weight: 600;">${sentiment.toUpperCase()}</span>
                </div>
              ` : ''}
              
              ${disconnectReason ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                  <span style="font-weight: 500; color: #64748b;">Disconnect Reason:</span>
                  <span style="color: #1e293b;">${disconnectReason}</span>
                </div>
              ` : ''}
            </div>
          </div>

          ${customerName || customerEmail || streetAddress ? `
            <!-- Customer Information -->
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                👤 Customer Information
              </h3>
              
              <div style="display: grid; gap: 12px;">
                ${customerName ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                    <span style="font-weight: 500; color: #64748b;">Name:</span>
                    <span style="color: #1e293b;">${customerName}</span>
                  </div>
                ` : ''}
                
                ${customerEmail ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                    <span style="font-weight: 500; color: #64748b;">Email:</span>
                    <a href="mailto:${customerEmail}" style="color: #1e40af; text-decoration: none;">${customerEmail}</a>
                  </div>
                ` : ''}
                
                ${streetAddress ? `
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; gap: 5px;">
                    <span style="font-weight: 500; color: #64748b;">Address:</span>
                    <span style="color: #1e293b; text-align: right; max-width: 300px;">${streetAddress}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${pestIssue || homeSize || yardSize || decisionMaker || preferredServiceTime ? `
            <!-- Service Details -->
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                🏠 Service Information
              </h3>
              
              <div style="display: grid; gap: 12px;">
                ${pestIssue ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                    <span style="font-weight: 500; color: #64748b;">Pest Issue:</span>
                    <span style="color: #1e293b;">${pestIssue}</span>
                  </div>
                ` : ''}
                
                ${homeSize ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                    <span style="font-weight: 500; color: #64748b;">Home Size:</span>
                    <span style="color: #1e293b;">${homeSize} sq ft</span>
                  </div>
                ` : ''}
                
                ${yardSize ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                    <span style="font-weight: 500; color: #64748b;">Yard Size:</span>
                    <span style="color: #1e293b;">${yardSize} sq ft</span>
                  </div>
                ` : ''}
                
                ${decisionMaker ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                    <span style="font-weight: 500; color: #64748b;">Decision Maker:</span>
                    <span style="color: #1e293b;">${decisionMaker}</span>
                  </div>
                ` : ''}
                
                ${preferredServiceTime ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                    <span style="font-weight: 500; color: #64748b;">Preferred Time:</span>
                    <span style="color: #1e293b;">${preferredServiceTime}</span>
                  </div>
                ` : ''}
                
                ${contactedOtherCompanies !== undefined ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; gap: 5px;">
                    <span style="font-weight: 500; color: #64748b;">Contacted Others:</span>
                    <span style="color: #1e293b;">${contactedOtherCompanies ? 'Yes' : 'No'}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${callSummary ? `
            <!-- Call Summary -->
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                📝 Call Summary
              </h3>
              <p style="margin: 0; color: #1e293b; line-height: 1.6;">${callSummary}</p>
            </div>
          ` : ''}


          ${recordingUrl ? `
            <!-- Recording Access -->
            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 24px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #92400e;">
                🎵 <strong>Call Recording Available</strong>
              </p>
              <a href="${recordingUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 500;">
                Listen to Recording
              </a>
            </div>
          ` : ''}

          <!-- Metadata -->
          <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px;">
            <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
              <strong>Call Details:</strong> ${formattedDate} • Duration: ${durationText}
              ${leadId ? ` • Lead ID: ${leadId}` : ''}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            This call summary was generated automatically by your phone system.
            <br>
            ${companyName} • Call Management System
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}