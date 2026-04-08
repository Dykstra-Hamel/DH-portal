export interface FieldMapQuoteData {
  inspectorName: string;
  clientName: string;
  clientAddress: string;
  planName: string;
  initialPrice: number | null;
  recurringPrice: number | null;
  billingFrequency: string | null;
  pestTypes: string[];
  notes: string;
  companyName: string;
}

export function generateFieldMapQuoteEmailTemplate(data: FieldMapQuoteData): string {
  const {
    inspectorName,
    clientName,
    clientAddress,
    planName,
    initialPrice,
    recurringPrice,
    billingFrequency,
    pestTypes,
    notes,
    companyName,
  } = data;

  const initialPriceDisplay = initialPrice != null ? `$${initialPrice.toFixed(2)}` : 'TBD';
  const recurringDisplay =
    recurringPrice != null && billingFrequency
      ? `$${recurringPrice.toFixed(2)} ${billingFrequency}`
      : recurringPrice != null
      ? `$${recurringPrice.toFixed(2)}`
      : 'TBD';

  const pestList =
    pestTypes.length > 0
      ? pestTypes.join(', ')
      : 'General pest control';

  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Field Inspection Quote</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#8b5cf6;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Field Inspection Quote
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                ${companyName}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                Hi team, a new field inspection quote has been submitted by <strong>${inspectorName}</strong>.
              </p>

              <!-- Client Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Client</p>
                    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">${clientName}</p>
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Address</p>
                    <p style="margin:0;font-size:15px;color:#374151;">${clientAddress}</p>
                  </td>
                </tr>
              </table>

              <!-- Pest Types -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Pests Identified</p>
                    <p style="margin:0;font-size:15px;color:#374151;">${pestList}</p>
                  </td>
                </tr>
              </table>

              <!-- Plan & Pricing -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Recommended Plan</p>
                    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">${planName}</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-right:12px;">
                          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Initial Price</p>
                          <p style="margin:0;font-size:20px;font-weight:700;color:#111827;">${initialPriceDisplay}</p>
                        </td>
                        <td width="50%" style="padding-left:12px;">
                          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Recurring Price</p>
                          <p style="margin:0;font-size:20px;font-weight:700;color:#111827;">${recurringDisplay}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${notes ? `
              <!-- Notes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Notes</p>
                    <p style="margin:0;font-size:15px;color:#374151;white-space:pre-wrap;">${notes}</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">
                This quote was generated from a field inspection by ${inspectorName}. Please follow up with the client to confirm and schedule service.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f3f4f6;background:#f9fafb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                ${companyName} &mdash; Field Inspection System
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
