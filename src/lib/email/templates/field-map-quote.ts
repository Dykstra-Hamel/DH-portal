interface QuoteLineItemEmailData {
  type: string;
  coveredPestLabels?: string[];
  otherLabel?: string;
  initialCost?: number | null;
  recurringCost?: number | null;
  frequency?: string | null;
}

export interface FieldMapQuoteData {
  inspectorName: string;
  clientName: string;
  clientAddress: string;
  quoteLineItems: QuoteLineItemEmailData[];
  totalInitial: number;
  totalRecurring: number;
  billingFrequency: string | null;
  pestTypes: string[];
  notes: string;
  companyName: string;
}

function fmt(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function lineItemLabel(item: QuoteLineItemEmailData): string {
  if (item.type === 'other') return item.otherLabel || 'Other';
  return (item.coveredPestLabels?.join(', ') || 'Pest Treatment') + ' Treatment';
}

export function generateFieldMapQuoteEmailTemplate(data: FieldMapQuoteData): string {
  const {
    inspectorName,
    clientName,
    clientAddress,
    quoteLineItems,
    totalInitial,
    totalRecurring,
    billingFrequency,
    pestTypes,
    notes,
    companyName,
  } = data;

  const pestList = pestTypes.length > 0 ? pestTypes.join(', ') : 'General pest control';

  const lineItemsHtml = quoteLineItems.length > 0
    ? quoteLineItems.map((item, i) => {
        const label = lineItemLabel(item);
        const freq = item.frequency ? ` &mdash; ${item.frequency.charAt(0).toUpperCase()}${item.frequency.slice(1)}` : '';
        const pricing = [
          item.initialCost != null ? `Initial: ${fmt(item.initialCost)}` : null,
          item.recurringCost != null ? `Recurring: ${fmt(item.recurringCost)}${item.frequency ? `/${item.frequency}` : ''}` : null,
        ].filter(Boolean).join(' &nbsp;&bull;&nbsp; ');
        return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${i + 1}. ${label}${freq}</p>
              ${pricing ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${pricing}</p>` : ''}
            </td>
          </tr>`;
      }).join('')
    : `<tr><td style="padding:10px 0;font-size:14px;color:#6b7280;">No line items added.</td></tr>`;

  const totalsHtml = `
    <tr>
      <td style="padding:12px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:4px;" colspan="2">Totals</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#374151;">Total Initial</td>
            <td align="right" style="font-size:15px;font-weight:700;color:#111827;">${fmt(totalInitial)}</td>
          </tr>
          ${totalRecurring > 0 ? `
          <tr>
            <td style="font-size:14px;color:#374151;padding-top:4px;">Total Recurring</td>
            <td align="right" style="font-size:15px;font-weight:700;color:#111827;padding-top:4px;">
              ${fmt(totalRecurring)}${billingFrequency ? ` / ${billingFrequency}` : ''}
            </td>
          </tr>` : ''}
        </table>
      </td>
    </tr>`;

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
            <td style="background:#0075de;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Field Inspection Quote
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${companyName}</p>
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

              <!-- Pests -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Pests Identified</p>
                    <p style="margin:0;font-size:15px;color:#374151;">${pestList}</p>
                  </td>
                </tr>
              </table>

              <!-- Quote Line Items -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Quote</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${lineItemsHtml}
                      ${totalsHtml}
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
