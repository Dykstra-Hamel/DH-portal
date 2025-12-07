# Test Data Seeding for Tickets and Support Cases

This document explains how to seed realistic test data for testing the tickets and support cases workflows.

## Overview

The `seed-tickets-support-cases.js` script creates realistic test data specifically for testing your tickets and support cases features without affecting your main company, user, and customer data.

## Prerequisites

- Run the main seed script first: `npm run seed`
- This ensures you have companies, users, and customers available for linking

## Usage

```bash
npm run seed-tickets
```

This command will:
1. Clear existing tickets and support cases
2. Create 20 realistic test tickets
3. Create 15 realistic test support cases

## What Gets Created

### Test Tickets (20 items)
- **Various Sources**: organic, referral, google_cpc, facebook_ads, etc.
- **Different Types**: phone_call, web_form, email, chat, in_person, etc.
- **Multiple Statuses**: new, contacted, qualified, quoted, in_progress, resolved, won, lost, unqualified
- **Realistic Scenarios**: Ant control, termite treatment, general pest control, etc.
- **Assignment Distribution**: 70% assigned to users, 30% unassigned
- **Timestamp Spread**: Created over the last 30 days with realistic business hours

### Test Support Cases (15 items)
- **Issue Types**: billing, scheduling, complaint, service_quality, treatment_request, re_service, general_inquiry, warranty_claim
- **Various Statuses**: new, assigned, in_progress, awaiting_customer, awaiting_internal, resolved, closed
- **Realistic Content**: Pest control specific scenarios and resolutions
- **Satisfaction Ratings**: 60% of resolved cases include customer satisfaction ratings (1-5)
- **Ticket Linking**: 30% of support cases are linked to tickets
- **Response Tracking**: Realistic first response times, resolution times, etc.

## Test Scenarios Included

### Tickets
- New leads from web forms and phone calls
- Qualified prospects with estimated values
- Won/lost deals with realistic outcomes
- Various pest control service types
- Different priority levels

### Support Cases
- **Billing Issues**: Payment problems, invoice discrepancies, service credits
- **Scheduling**: Appointment changes, technician delays, emergency requests
- **Complaints**: Treatment effectiveness, service quality, property damage
- **Service Quality**: Missed areas, insufficient explanations, rushed service
- **Treatment Requests**: Additional services, specific pest control, upgrades
- **Re-service**: Warranty claims, guarantee issues, follow-up treatments
- **General Inquiries**: Product questions, service availability, advice
- **Warranty Claims**: Coverage questions, guarantee periods, damage claims

## Data Relationships

- Tickets and support cases are linked to existing companies and customers
- Both are assigned to existing users in your database
- Some support cases reference tickets (to test ticket-to-case workflows)
- Realistic timestamps show progression through workflows

## Testing Workflows

This data allows you to test:

### Tickets Page (`/connections/review-qualify`)
- Filtering by different tabs (All Incoming, Completed Calls, etc.)
- Sorting by various columns
- Ticket qualification process
- Assignment workflows
- Status progression

### Support Cases Page (`/connections/customer-service`)
- Different issue type filtering
- Status-based workflow testing
- Assignment and reassignment
- Resolution tracking
- Customer satisfaction collection

## Regenerating Data

Run the script again anytime to get fresh test data:
```bash
npm run seed-tickets
```

**Note**: This will clear existing tickets and support cases, so only use on development/test environments.

## Script Details

- **File**: `scripts/seed-tickets-support-cases.js`
- **Dependencies**: Requires existing companies, customers, and users from main seed script
- **Environment**: Uses local Supabase connection from `.env.local`
- **Safety**: Includes error handling and validation

## Customization

To modify the test data:
1. Edit the arrays in the script (serviceTypes, scenarios, etc.)
2. Adjust the number of items created (currently 20 tickets, 15 support cases)
3. Modify timestamp ranges or assignment percentages
4. Add new issue types or statuses as needed