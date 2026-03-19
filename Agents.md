# DH Portal — Agent Reference

This file contains reference information for AI agents (Claude, etc.) working in this codebase. It documents external APIs, integration patterns, and context that is not derivable from the source code alone.

---

## WorkWave PestPac API

**Source**: WorkWave Developer Portal — `https://developer.workwave.com/documentation`
**Purpose**: PestPac is the pest control field service management platform used by companies in this app. The API allows reading and writing customers, locations, orders, services, routes, payments, and more.

---

### Authentication

Every request requires two headers:

```
ApiKey: {your_api_key}
tenant-id: {your_tenant_id}
Content-Type: application/json
```

- The API key is obtained from the WorkWave developer portal per company/tenant.
- Store as environment variables: `PESTPAC_API_KEY`, `PESTPAC_TENANT_ID`
- There is no OAuth flow — all requests use static API key + tenant ID.

**Example curl:**
```bash
curl -X GET "https://api.workwave.com/pestpac/v1/clients" \
  -H "ApiKey: YOUR_API_KEY" \
  -H "tenant-id: YOUR_TENANT_ID" \
  -H "Content-Type: application/json"
```

---

### Base URL

```
https://api.workwave.com/pestpac/v1/
```

All endpoints are relative to this base URL.

---

### Core Principles

- **REST**: Standard HTTP methods — GET, POST, PUT, PATCH, DELETE
- **JSON**: All request bodies and responses are `application/json`
- **PATCH for partial updates**: Use PATCH to update individual fields. PUT replaces the entire resource.
- **OData-style filtering**: Query parameters follow OData conventions
- **Pagination**: Required for large collections — use `$top` + `$skip`

---

### Query Parameters

| Parameter   | Description                                      | Example                          |
|-------------|--------------------------------------------------|----------------------------------|
| `$filter`   | Filter results by field value                    | `$filter=lastName eq 'Smith'`    |
| `$top`      | Max number of records to return (page size)      | `$top=25`                        |
| `$skip`     | Number of records to skip (offset for paging)   | `$skip=50`                       |
| `$orderby`  | Sort results                                     | `$orderby=lastName asc`          |
| `$select`   | Return only specified fields                     | `$select=clientID,firstName`     |
| `$expand`   | Include related sub-resources inline             | `$expand=locations`              |

---

### HTTP Response Codes

| Code | Meaning                                                        |
|------|----------------------------------------------------------------|
| 200  | OK — successful GET, PUT, PATCH                                |
| 201  | Created — successful POST                                      |
| 204  | No Content — successful DELETE                                 |
| 400  | Bad Request — validation error, check request body/params     |
| 401  | Unauthorized — missing or invalid API key                      |
| 403  | Forbidden — valid key but insufficient permissions             |
| 404  | Not Found — resource does not exist                            |
| 409  | Conflict — duplicate or constraint violation                   |
| 500  | Internal Server Error — retry with backoff                     |

---

### Key Resources & Endpoint Patterns

All resources follow consistent REST URL patterns:

#### Clients (Customers)
```
GET    /clients                          List all clients
POST   /clients                          Create a client
GET    /clients/{clientID}               Get a single client
PUT    /clients/{clientID}               Replace a client
PATCH  /clients/{clientID}               Partial update a client
DELETE /clients/{clientID}               Delete a client
```

#### Locations (Service Sites)
```
GET    /clients/{clientID}/locations     List locations for a client
POST   /clients/{clientID}/locations     Add a location to a client
GET    /locations/{locationID}           Get a single location
PATCH  /locations/{locationID}           Update a location
DELETE /locations/{locationID}           Delete a location
```

#### Orders
```
GET    /orders                           List orders
POST   /orders                           Create an order
GET    /orders/{orderID}                 Get a single order
PATCH  /orders/{orderID}                 Update an order
DELETE /orders/{orderID}                 Delete an order
```

#### Services (Order Line Items)
```
GET    /orders/{orderID}/services        List services on an order
POST   /orders/{orderID}/services        Add a service to an order
PATCH  /services/{serviceID}             Update a service
DELETE /services/{serviceID}             Remove a service
```

#### Service Types
```
GET    /servicetypes                     List all service types
GET    /servicetypes/{serviceTypeID}     Get a service type
```

#### Employees
```
GET    /employees                        List employees
GET    /employees/{employeeID}           Get a single employee
POST   /employees                        Create an employee
PATCH  /employees/{employeeID}           Update an employee
```

#### Routes
```
GET    /routes                           List routes
GET    /routes/{routeID}                 Get a single route
POST   /routes                           Create a route
PATCH  /routes/{routeID}                 Update a route
GET    /routes/{routeID}/stops           Get route stops
```

#### Invoices & Billing
```
GET    /invoices                         List invoices
GET    /invoices/{invoiceID}             Get a single invoice
POST   /invoices                         Create an invoice
PATCH  /invoices/{invoiceID}             Update an invoice
```

#### Payments
```
POST   /payments                         Process a payment
GET    /payments/{paymentID}             Get payment details
```

**Payment request body fields:**
- `clientID` — the client being charged
- `amount` — payment amount (decimal)
- `paymentMethod` — payment method type
- `referenceNumber` — optional reference

#### Documents
```
POST   /documents                        Upload a document (multipart/form-data)
GET    /documents/{documentID}           Retrieve a document
DELETE /documents/{documentID}           Delete a document
```

**Document upload** uses `multipart/form-data` (not JSON). Include file binary + metadata fields.

#### Webhooks
```
GET    /webhooks                         List registered webhooks
POST   /webhooks                         Register a webhook
DELETE /webhooks/{webhookID}             Remove a webhook
```

**Webhook events include:** order created/updated, payment processed, service completed, route updated, and others.
Webhook payloads are POST'd to your registered callback URL with a JSON body describing the event.

---

### Pagination Pattern

Always paginate large collection requests. Example fetching all clients in pages of 50:

```typescript
async function getAllClients() {
  const pageSize = 50;
  let skip = 0;
  let allClients = [];
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `https://api.workwave.com/pestpac/v1/clients?$top=${pageSize}&$skip=${skip}`,
      {
        headers: {
          'ApiKey': process.env.PESTPAC_API_KEY!,
          'tenant-id': process.env.PESTPAC_TENANT_ID!,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await res.json();
    allClients = [...allClients, ...(data.value ?? [])];
    hasMore = (data.value?.length ?? 0) === pageSize;
    skip += pageSize;
  }

  return allClients;
}
```

---

### Using PATCH (Partial Updates)

PATCH only sends the fields you want to change — do not include unchanged fields:

```typescript
// Only update the phone number — don't send the full client object
await fetch(`https://api.workwave.com/pestpac/v1/clients/${clientID}`, {
  method: 'PATCH',
  headers: {
    'ApiKey': process.env.PESTPAC_API_KEY!,
    'tenant-id': process.env.PESTPAC_TENANT_ID!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ phone: '(512) 555-1234' }),
});
```

---

### Error Handling

- Always check response status before parsing body
- Retry on 500 errors with exponential backoff (same pattern as Gemini calls in this codebase — see `src/lib/gemini/form-parser.ts`)
- 401 means the API key or tenant ID is wrong — do not retry
- 400 usually means a missing required field — check the request body
- Responses follow the shape: `{ value: [...] }` for collections, or a single object for single-resource endpoints

---

### Environment Variables Required

Add to `.env.local` for local development and to Vercel env for production:

```
PESTPAC_API_KEY=your_api_key_here
PESTPAC_TENANT_ID=your_tenant_id_here
```

---

### Integration Notes for This Codebase

- API calls should be made **server-side only** (in Next.js API routes under `src/app/api/`) — never expose the API key to the client
- Follow the same auth pattern as other API routes: use `getAuthenticatedUser()` from `@/lib/api-utils` to verify the DH Portal session before proxying to PestPac
- Map PestPac `clientID` to DH Portal `customer.id` via a mapping table or a stored field on the customer record
- The full endpoint reference listing is at `https://developer.workwave.com/documentation` — the endpoint list includes hundreds of endpoints across all resource types; consult the live docs for the complete field schemas on each resource
