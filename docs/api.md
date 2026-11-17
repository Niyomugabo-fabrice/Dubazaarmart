# REST API

All API routes are under `/api/v1`. JSON validation errors and application errors use `{ "error": "..." }`. Product, order, inventory, dashboard, settings, announcement, and upload response fields retain the shapes consumed by the current storefront and admin UI.

## Public routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API and PostgreSQL health |
| GET, POST | `/products` | Browse catalog; create product requires administrator access |
| POST | `/orders` | Place a customer order and update stock in one transaction |
| POST | `/orders/whatsapp` | Build a WhatsApp checkout link |
| GET | `/settings` | Read public store settings |
| GET | `/announcements/active` | Read current announcements |
| POST | `/media/upload` | Upload product image to Cloudinary; administrator access required |

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/login` | Verify administrator email and password; return access and refresh tokens |
| POST | `/auth/refresh` | Rotate a refresh token and issue a new token pair |
| POST | `/auth/logout` | Revoke a refresh token |
| GET | `/auth/verify` | Verify an administrator access token |

Protected requests use `Authorization: Bearer <access-token>`. The order events stream also accepts the access token as a query parameter for browser `EventSource` clients.

## Administrator routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/admin/products` | List and create products |
| PATCH, DELETE | `/admin/products/:id` | Edit or delete a product |
| GET, POST | `/admin/orders` | Filter/paginate orders; create a manual order |
| GET | `/admin/orders/events` | Server-sent order-created events |
| PATCH | `/admin/orders/:id/status` | Update order or payment status |
| PATCH | `/admin/orders/:id/payment` | Record a manual payment |
| PATCH | `/admin/orders/:id/cancel` | Cancel an order |
| DELETE | `/admin/orders/:id` | Delete an order |
| GET, POST | `/admin/company-orders` | List and create supplier purchase orders |
| POST | `/admin/company-orders/:id/receive` | Receive items and update stock transactionally |
| PATCH, DELETE | `/admin/company-orders/:id` | Edit or delete a purchase order |
| GET | `/admin/stock` | Read stock summary |
| GET | `/admin/stock/movements` | Read stock movement history |
| POST | `/admin/stock/remove` | Remove stock and record the movement transactionally |
| PATCH | `/admin/stock/:productId` | Update stock targets and cost |
| POST | `/admin/settings` | Update store settings |
| GET, POST | `/admin/announcements` | List and create announcements |
| PATCH, DELETE | `/admin/announcements/:id` | Edit or delete an announcement |
| GET | `/admin/dashboard` | Read dashboard analytics (`7d`, `30d`, or `12m`) |

Interactive OpenAPI documentation is served from `/docs`.
