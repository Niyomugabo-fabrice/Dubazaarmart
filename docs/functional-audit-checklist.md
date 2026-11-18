# Functional audit and CRUD checklist

## Scope and test safety

The runtime modules present in this repository are products, orders/customers, inventory, procurement, settings/announcements, media, dashboard, health, and administrator authentication. Product category and brand are product fields, not independent resources. Promotions, coupons, services, FAQs, testimonials, and customer notifications do not have backend resources or CRUD endpoints; the homepage testimonials and other informational sections are static frontend content.

The checklist below describes the current implementation and the end-to-end checks still required. No isolated test database or automated integration/E2E test suite is configured. Do not run mutation checks against the local ignored `backend/.env` or a production database. The soft-delete migration must be reviewed and applied to a safe database before deploying the matching API build.

## CRUD implementation status

“Not DB-tested” means the route and application code exist, but persistence has not been exercised against an isolated database in this audit.

| Resource | Create | Read | Update | Delete/archive | Persistence test |
|---|---|---|---|---|---|
| Products | Implemented | Implemented | Implemented | Implemented as archive (`active=false`) | Not DB-tested |
| Customer orders | Implemented for storefront and admin | Implemented as admin list | Implemented for status, payment, and cancellation | Implemented as soft archive | Not DB-tested |
| Order items | Created with parent order | Returned with parent order | N/A independently | N/A independently; retained when an order is archived | Not DB-tested |
| Customers | Implemented by registration/checkout | Admin dashboard aggregation only | N/A | N/A | Not DB-tested |
| Administrator accounts | Implemented for admin provisioning | Implemented for admin list | N/A | N/A | Not DB-tested |
| Inventory balances | Created by product entry and procurement receipt | Implemented as summary | Implemented as stock/target adjustments | Stock can be removed with an audit movement; record deletion is N/A | Not DB-tested |
| Stock movements | Appended by stock-changing workflows | Implemented as movement list | N/A; append-only | N/A; append-only | Not DB-tested |
| Company purchase orders | Implemented | Implemented as filtered list | Implemented for supported fields | Implemented as soft archive | Not DB-tested |
| Website settings | Seeded as the primary settings record | Implemented | Implemented | N/A; singleton settings | Not DB-tested |
| Announcements | Implemented | Implemented for active and admin lists | Implemented | Implemented | Not DB-tested |
| Media assets | Implemented as upload to Cloudinary | Returned upload URL; no managed read endpoint | N/A | N/A; no managed delete endpoint | Not DB-tested |
| Dashboard and health | N/A | Implemented | N/A | N/A | Not DB-tested |
| Categories and brands | N/A as standalone resources | Product fields/static category content | N/A as standalone resources | N/A as standalone resources | N/A |
| Promotions, coupons, FAQs, services, notifications | Not implemented as backend resources | Not implemented | Not implemented | Not implemented | N/A |

## End-to-end test checklist

For every applicable operation, verify the full path: frontend UI → API request → controller/DTO validation → application service → repository → database transaction/constraint → response → updated UI after refresh. Use a disposable test database and unique test records.

### Products

- [ ] Create with valid values and an uploaded image; verify the response and persisted row.
- [ ] Reject invalid prices, quantities, malformed images, and duplicate SKUs; verify useful UI errors and no partial row.
- [ ] Read the public active catalog and admin list; verify search/category filters and refresh consistency.
- [ ] Update fields and images; verify omitted fields remain unchanged and persisted values survive refresh.
- [ ] Archive a product; verify it disappears from the storefront, remains available for order-history references, and stock/order records remain intact.
- [ ] Verify non-admin create/update/archive requests are rejected.

### Customer orders and order items

- [ ] Submit a storefront order; verify backend-derived prices/totals, customer/order/item rows, stock decrement, and one `SALE` movement commit atomically.
- [ ] Reject invalid or inactive SKUs and insufficient aggregated stock; verify no order or stock change.
- [ ] Read/search/filter/paginate admin orders and verify item snapshots and totals.
- [ ] Change order/payment status and verify persisted values and allowed workflow behavior.
- [ ] Cancel an order; verify stock restoration and one `ADJUSTMENT` movement per product, including repeated/concurrent cancellation.
- [ ] Archive an order; verify the order and item history remain in the database but are omitted from active lists.
- [ ] Verify admin endpoints reject missing/invalid credentials.

### Customers and administrators

- [ ] Register a customer with valid input; verify normalized email, password hash (never plaintext), and duplicate-email conflict.
- [ ] Verify the admin dashboard customer summary matches persisted customers/orders.
- [ ] Provision an administrator as an authenticated admin; verify role validation, password hashing, and duplicate-email conflict under concurrent requests.
- [ ] Verify login rate limiting, login/refresh/logout, expired/revoked refresh tokens, and unauthorized admin requests.
- [ ] Confirm customer update/delete and administrator update/delete are not exposed as CRUD operations.

### Inventory and stock movements

- [ ] Adjust stock thresholds/quantities and remove stock; verify updated balances and corresponding movements.
- [ ] Receive a purchase order with valid item quantities; verify order/item status, product quantities, movements, and all writes commit or roll back together.
- [ ] Reject over-receipt and invalid item IDs; verify no partial inventory changes.
- [ ] Read movement history and verify reference IDs, quantities, and chronological ordering.
- [ ] Verify stock movements cannot be independently edited or deleted.

### Procurement

- [ ] Create a purchase order with valid items and charges; verify computed totals and persisted items.
- [ ] Read/search/filter purchase orders and verify refresh consistency.
- [ ] Update supported fields and verify values persist.
- [ ] Receive partial and complete quantities; verify stock movements and statuses.
- [ ] Archive a purchase order; verify the purchase order and item history remain stored but are omitted from active lists.
- [ ] Verify invalid input and unauthorized requests return errors without partial writes.

### Settings, announcements, and media

- [ ] Read public settings and active announcements; verify empty/loading/error states in the UI.
- [ ] Update settings and verify the storefront reflects persisted values after refresh.
- [ ] Create, edit, activate/deactivate, and delete an announcement; verify schedule boundaries and public visibility.
- [ ] Upload a valid image under the configured size limit; verify Cloudinary URL and persisted product reference.
- [ ] Reject oversized, malformed, and non-image upload bodies; verify failed uploads do not appear successful.
- [ ] Verify media upload requires an authorized administrator and document that media read/delete endpoints are not implemented.

### Dashboard, navigation, and responsive UI

- [ ] Verify dashboard metrics against seeded test records and each supported date range.
- [ ] Verify health endpoint status and behavior when the database is unavailable.
- [ ] Exercise every admin navigation route, confirmation cancel/confirm path, loading state, empty state, and API error notification.
- [ ] Re-run storefront/admin route checks at 375px, 768px, and 1280px; inspect keyboard access, mobile navigation, console errors, failed requests, and horizontal overflow.

## Verification completed in this audit

- Workspace production build: passed.
- Workspace TypeScript checks: passed.
- Workspace ESLint: passed with no warnings after cleanup.
- Manual auth smoke checks: 10 failed login attempts were allowed, the next returned HTTP 429; a simulated PostgreSQL unique violation during administrator provisioning returned HTTP 409.
- Production-build browser checks: selected routes (home, shop, cart, account, admin login) rendered at 375px, 768px, and 1280px without horizontal overflow. A persisted cart item appeared after reload.
- No integration/E2E suite or safe database was available, so database persistence, migrations, CRUD mutations, and real admin login were not tested.
- Existing production product image URLs under `/api/v1/uploads/...` returned HTTP 404. The current backend has no corresponding uploads read route; those legacy assets need a safe migration/re-upload plan.
