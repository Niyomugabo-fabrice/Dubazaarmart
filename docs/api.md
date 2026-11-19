# REST API

All API routes are under `/api/v1`. Product, order, inventory, dashboard, settings, announcement, and upload response fields retain the shapes consumed by the current storefront and admin UI. Customers do not authenticate; checkout remains available to guests and stores customer details with each order.

## Public routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API and PostgreSQL health |
| GET | `/products` | Browse catalog |
| POST | `/orders` | Place a customer order and update stock in one transaction |
| POST | `/orders/whatsapp` | Build a WhatsApp checkout link |
| GET | `/settings` | Read public store settings |
| GET | `/announcements/active` | Read current announcements |
| POST | `/auth/register` | Submit a pending STAFF registration request when manager-enabled |
| POST | `/media/upload` | Upload product image to Cloudinary; requires `media.upload` or MANAGER |

Image uploads use `multipart/form-data` with a `file` field. JPEG, PNG, WebP, and GIF files up to 10MB are accepted; the server checks the file signature before forwarding it to Cloudinary. JSON and data-URL upload bodies are not supported.

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/login` | Sign in an active MANAGER or STAFF; returns a short-lived access token and sets an HttpOnly refresh cookie |
| POST | `/auth/refresh` | Issue a new access token using the refresh cookie |
| POST | `/auth/logout` | Clear the refresh cookie |
| GET | `/auth/verify` | Verify the current MANAGER or STAFF access token |

Protected requests use `Authorization: Bearer <access-token>`. Browser requests must use credentials for the refresh cookie; refresh/logout requests validate the configured `FRONTEND_URL` origin. The order events stream uses an authenticated fetch stream, not a token in the URL.

## Manager and staff routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/admin/products` | View/create products (`products.view`, `products.create`) |
| POST | `/products` | Create a product (`products.create`) |
| PATCH, DELETE | `/admin/products/:id` | Update/delete products (`products.update`, `products.delete`) |
| GET, POST | `/admin/orders` | View/create orders (`orders.view`, `orders.create`) |
| GET | `/admin/orders/events` | Authenticated server-sent order-created events |
| PATCH, DELETE | `/admin/orders/:id/*` | Update or delete orders (`orders.update`, `orders.delete`) |
| GET, POST | `/admin/company-orders` | View/manage supplier purchase orders (`procurement.view`, `procurement.manage`) |
| POST | `/admin/company-orders/:id/receive` | Receive items and update stock transactionally |
| GET, POST, PATCH | `/admin/stock*` | View/update inventory (`inventory.view`, `inventory.update`) |
| POST | `/admin/settings` | Update store settings and staff-registration availability (MANAGER only) |
| GET, POST, PATCH, DELETE | `/admin/announcements` | View announcements; manager-only changes (`announcements.manage`) |
| GET | `/admin/dashboard` | Read dashboard analytics (`reports.view`; `7d`, `30d`, or `12m`) |
| GET, POST | `/admin/users` | List/create STAFF accounts (MANAGER only) |
| GET, PATCH, DELETE | `/admin/users/:id` | Read/update STAFF details or soft-delete (MANAGER only) |
| PATCH | `/admin/users/:id/activate`, `/deactivate`, `/suspend`, `/verify`, `/promote-to-manager` | Manage STAFF status, verify email, or promote an active verified STAFF account (MANAGER only) |
| GET | `/admin/audit-logs` | Read append-only sign-in and administrative audit records (MANAGER only) |

STAFF accounts have full operational access except user management, audit logs, and settings/content management (including announcement changes), which remain MANAGER-only. Managers can manage staff and other manager accounts; an account cannot deactivate, suspend, or remove itself. New public registrations are pending and cannot sign in until a manager verifies and activates them. Only active, verified STAFF accounts can be promoted to MANAGER. Customer contact information is stored on orders; customers do not have sign-in accounts.

Interactive OpenAPI documentation is served from `/docs`.
