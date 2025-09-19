# Retell Webhook Documentation

This document explains how the two Retell webhook endpoints work in the PMP Central system.

## Overview

The system has two webhook endpoints that handle call events and create tickets:

- **Inbound Webhook** (`retell-inbound-ticket`) - For incoming calls
- **Outbound Webhook** (`retell-outbound-ticket`) - For outgoing calls

The main difference is how they handle ticket creation and the `action_required` dynamic variable.

## Inbound Webhook

**Endpoint**: `/api/webhooks/retell-inbound-ticket`

### How It Works

1. **Creates active tickets** - When calls start, tickets are created with status `new`
2. **Uses caller's phone number** - Finds/creates customer based on `from_number`
3. **Processes call analysis** - Uses AI qualification and action required logic
4. **Conditional email sending** - Only sends emails when `action_required === "true"`

### Ticket Status Logic

- **During call**: Ticket starts as `new` (active)
- **After analysis**:
  - If `action_required === "true"`: Keeps ticket active, **sends email**
  - If `action_required === "false"`: **Closes ticket**, no email
  - If no `action_required`: Uses standard qualification logic (qualified/contacted/resolved)

### Use Case

Perfect for customer service lines where most calls need follow-up, but some can be closed immediately.

---

## Outbound Webhook

**Endpoint**: `/api/webhooks/retell-outbound-ticket`

### How It Works

1. **Creates closed tickets** - When calls start, tickets are created with status `closed`
2. **Uses called party's phone number** - Finds/creates customer based on `to_number`
3. **Only opens if needed** - Tickets only become active if follow-up is required
4. **Conditional email sending** - Only sends emails when tickets are opened

### Ticket Status Logic

- **During call**: Ticket starts as `closed` (inactive)
- **After analysis**:
  - If `action_required === "true"`: **Opens ticket** (changes to `new`), **sends email**
  - If `action_required === "false"`: **Stays closed**, no email
  - If no `action_required`: **Stays closed**, no email

### Special Handling

- **Call transfers**: Always create active tickets regardless of `action_required`
- **Phone number handling**: Uses agent's phone for `from_number`, customer's phone for main lookup

### Use Case

Perfect for cold calling or outbound sales where most calls don't need follow-up, but interested prospects should get immediate attention.

---

## Call Transfer Handling

Both webhooks have special logic for call transfers:

- When `disconnect_reason === "call_transfer"`, tickets are always created as active
- This ensures transferred calls get proper follow-up regardless of other settings
- Email notifications are sent for transfers (they're treated as requiring action)

---

## Phone Number Display

The system normalizes phone number display for consistency:

- **Inbound calls**: Display uses normalized `phone_number` field when available
- **Outbound calls**: Display uses formatted phone numbers
- **Backend storage**: Maintains both raw and normalized formats

---

## Email Notifications

### When Emails Are Sent

- **Inbound**: Only when `action_required === "true"` OR call transfer
- **Outbound**: Only when `action_required === "true"` OR call transfer
- **Requirements**:
  - Company has email notifications enabled
  - Valid email recipients configured
  - Successful call completion or transfer

### Email Content

- Call summary and analysis
- Customer information
- Business data (if provided)
- Call transcript and recording (if available)

---

## Key Differences Summary

| Feature                   | Inbound Webhook              | Outbound Webhook             |
| ------------------------- | ---------------------------- | ---------------------------- |
| **Default ticket status** | `new` (active)               | `closed` (inactive)          |
| **Customer lookup**       | `from_number` (caller)       | `to_number` (called party)   |
| **Default behavior**      | Creates work for staff       | Stays out of the way         |
| **Best for**              | Customer service             | Cold calling/sales           |
| **Email trigger**         | `action_required === "true"` | `action_required === "true"` |

---

## Implementation Notes

### Security

- Both webhooks verify Retell signatures using `RETELL_WEBHOOK_SECRET`
- Rate limited to 50 requests per minute per IP

### Data Handling

- Automatic customer creation/lookup by phone number
- Complete call record tracking with analysis data
- Archived calls are filtered out of the main Call Records page
- **Unanswered call handling**: Creates call records and tickets even for calls that go to voicemail, are busy, or not answered

### Configuration

- No special database setup required
- Retell agents should be configured to provide `action_required` in post-call analysis
- Email notification settings are managed per company
