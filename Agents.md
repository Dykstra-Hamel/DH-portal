# DH Portal — Agent Reference

This file contains reference information for AI agents (Claude, etc.) working in this codebase. It documents external APIs, integration patterns, and context that is not derivable from the source code alone.

---

## WorkWave PestPac API

**Source**: WorkWave Developer Portal — `https://developer.workwave.com/documentation`
**Purpose**: PestPac is the pest control field service management platform used by companies in this app. The API allows reading and writing customers, locations, orders, services, routes, payments, and more.

---

### Authentication

The docs and this codebase use a combined auth pattern:

```
Authorization: Bearer {oauth_access_token}   # used in this app
ApiKey: {your_api_key}
tenant-id: {your_tenant_id}
Content-Type: application/json
```

- WorkWave docs examples commonly show `ApiKey` + `tenant-id`.
- In DH Portal, PestPac calls are authenticated with OAuth token + `ApiKey` + `tenant-id`.
- OAuth token endpoint used by this app: `https://is.workwave.com/oauth2/token?scope=openid`
- Company credentials are stored in `company_settings` (keys: `pestpac_api_key`, `pestpac_tenant_id`, `pestpac_oauth_client_id`, `pestpac_oauth_client_secret`, `pestpac_wwid_username`, `pestpac_wwid_password`).

**Example curl:**
```bash
curl -X GET "https://api.workwave.com/pestpac/v1/clients" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
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

### Endpoint Reference (Expanded)

The following resource groups are visible in the WorkWave portal captures (`2026-03-16`). This list is the working reference for agents in this repo.

#### Resource groups shown in docs

`ActivityLog`, `AdjustmentReason`, `Areas`, `AreaTypes`, `AutoComplete`, `Automation`, `BillTos`, `Branches`, `Builders`, `Bundles`, `Calls`, `CancelReasons`, `CompanySetup`, `Conditions`, `ConditionsLookups`, `Contacts`, `Corporations`, `Counties`, `CreditCardBilling`, `Devices`, `DeviceTypes`, `Diagrams`, `DiscountCodes`, `Divisions`, `Documents`, `Email`, `Employees`, `FinancedInvoices`, `FormComments`, `Frequencies`, `GainLoss`, `GLCode`, `Invoices`, `Jobs`, `Leads`, `ListManagement`, `LocationAreaTypes`, `LocationBundles`, `Locations`, `NoteCodes`, `Notes`, `NotificationMessage`, `Notifications`, `NotServicedReasons`, `PaymentAccounts`, `Payments`, `PayOverTime`, `ProgramTypes`, `Routes`, `SalesEvents`, `Schedules`, `Scheduling`, `ServiceClasses`, `ServiceOrderAttributeCategories`, `ServiceOrderAttributes`, `ServiceOrderBatches`, `ServiceOrders`, `Services`, `ServiceSetups`, `Skills`, `SourceClasses`, `Sources`, `States`, `TargetEvidenceTypes`, `TargetPests`, `Tasks`, `TaskTypes`, `TaxCodes`, `TechnicianRegions`, `Thresholds`, `TimeBlocks`, `Types`, `UserDefChoice`, `UserDefFields`, `WebHooks`.

#### High-use endpoint patterns in this codebase

##### Customers and locations
```
GET    /Locations
GET    /Locations/{locationID}
GET    /Clients/{clientID}
GET    /Contacts
```

##### Service orders (important for FieldMap)
```
GET    /ServiceOrders
GET    /ServiceOrders/{id}
POST   /ServiceOrders
PATCH  /ServiceOrders/{id}
DELETE /ServiceOrders/{id}
GET    /ServiceOrders/{id}/documents
GET    /ServiceOrders/{id}/conditions
POST   /ServiceOrders/{id}/notes
GET    /ServiceOrders/{id}/inspectionReport
POST   /ServiceOrders/{orderId}/lineItems
PUT    /ServiceOrders/{orderId}/lineItems/{lineItemId}
DELETE /ServiceOrders/{orderId}/lineItems/{lineItemId}
POST   /ServiceOrders/{orderId}/materials
PUT    /ServiceOrders/{orderId}/materials/{materialLineId}
DELETE /ServiceOrders/{orderId}/materials/{materialLineId}
POST   /ServiceOrders/{orderId}/targets
DELETE /ServiceOrders/{orderId}/targets/{targetCode}
GET    /ServiceOrders/{orderId}/attributes
POST   /ServiceOrders/{orderId}/attributes
DELETE /ServiceOrders/{orderId}/attributes/{attributeId}
```

##### Routes and schedule lookups
```
GET    /Routes
GET    /Routes/{routeID}
GET    /Routes/{routeID}/Stops     # supported for some tenants
GET    /lookups/Routes
GET    /lookups/Schedules
POST   /Scheduling/availableTimeWindows
```

##### Service setup and service catalog
```
GET    /ServiceSetups/{id}
PATCH  /ServiceSetups/{id}
POST   /ServiceSetups
GET    /lookups/Services
GET    /lookups/ServiceClasses
GET    /lookups/ServiceOrderAttributes
GET    /lookups/ServiceOrderAttributeCategories
```

##### Billing and payments
```
GET    /BillTos
GET    /Invoices
GET    /Payments
POST   /Payments
GET    /PaymentAccounts
POST   /PaymentAccounts/{cardId}/charge
POST   /PaymentAccounts/{cardId}/authorize
POST   /PaymentAccounts/return
POST   /PaymentAccounts/capture
```

##### Webhooks and activity
```
POST   /ActivityLog
GET    /WebHooks
POST   /WebHooks
PUT    /WebHooks/{id}
DELETE /WebHooks/{id}
```

##### Tasks and operational lookups
```
GET    /Tasks
POST   /Tasks
PUT    /Tasks/{id}
DELETE /Tasks/{id}
GET    /lookups/TaskTypes
GET    /lookups/TargetPests
GET    /lookups/TaxCodes
GET    /lookups/TechnicianRegions
GET    /TimeBlocks
```

#### Webhook entity/action support shown in docs

- `Bill-To`: create, update, delete
- `Branch`: create, update, delete
- `Card On File`: create, update, delete
- `Condition`: create, update, delete
- `Contacts`: create, update, delete
- `CreditMemo`: create, update, apply
- `Employee`: create, update, delete
- `Invoice`: create, update, void
- `Lead`: create, update, delete
- `Location`: create, update, delete
- `Notes`: create, update, delete
- `Payment`: create, update, apply
- `Service Order`: create, update, post, delete
- `Service Setup`: create, update, delete

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
