# REST API

All API routes are under `/api/v1`. Product, order, inventory, dashboard, settings, announcement, testimonial, category image, and upload response fields retain the shapes consumed by the current storefront and admin UI. Customers do not authenticate; checkout remains available to guests and stores customer details with each order.

## Public routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API and PostgreSQL health |
| GET | `/products` | Browse catalog |
| POST | `/orders` | Place a customer order and update stock in one transaction |
| POST | `/orders/whatsapp` | Build a WhatsApp checkout link |
| GET | `/settings` | Read public store settings |
| GET | `/announcements/active` | Read current announcements |
| GET | `/testimonials` | Read testimonials visible on the storefront |
| GET | `/categories/images` | Read public category image URLs |
| GET | `/hero-slides/active` | Read active homepage hero slides in display order |
| POST | `/auth/register` | Submit a pending STAFF registration request when manager-enabled |
| POST | `/media/upload` | Upload a product or testimonial image to Cloudinary; requires `media.upload` or MANAGER |

Image uploads use `multipart/form-data` with a `file` field. JPEG, PNG, WebP, and GIF files up to 10MB are accepted; the server checks the file signature before forwarding it to Cloudinary. Testimonial images are compressed in the browser and resized to a maximum of 300x300 pixels. JSON and data-URL upload bodies are not supported.

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
| GET, POST, PATCH, DELETE | `/admin/testimonials` | List, add, edit, delete, and control testimonial visibility (`testimonials.*`) |
| POST | `/admin/categories/:id/image` | Upload or replace a category image (`categories.manage`; JPG, PNG, or WebP up to 2MB) |
| GET, POST | `/admin/hero-slides` | List or add homepage hero slides (`heroSlides.view`, `heroSlides.manage`) |
| PATCH, DELETE | `/admin/hero-slides/:id` | Edit, activate/deactivate, or delete a hero slide (`heroSlides.manage`) |
| PATCH | `/admin/hero-slides/reorder` | Save the display order for every hero slide (`heroSlides.manage`) |
| GET | `/admin/dashboard` | Read dashboard analytics (`reports.view`; `7d`, `30d`, or `12m`) |
| GET, POST | `/admin/users` | List/create STAFF accounts (MANAGER only) |
| GET, PATCH, DELETE | `/admin/users/:id` | Read/update STAFF details or soft-delete (MANAGER only) |
| PATCH | `/admin/users/:id/activate`, `/deactivate`, `/suspend`, `/verify`, `/promote-to-manager` | Manage STAFF status, verify email, or promote an active verified STAFF account (MANAGER only) |
| GET | `/admin/audit-logs` | Read append-only sign-in and administrative audit records (MANAGER only) |

Category images are optimized in the browser to 400x400 pixels or smaller and converted to WebP when supported.
Hero slide images are optimized in the browser to a maximum width of 1920 pixels, converted to WebP when supported, and limited to 3MB. Hero slide create/edit requests use `multipart/form-data` with an optional replacement `file` field; new slides require an image. Button links may be site-relative paths or HTTP(S) URLs.

STAFF accounts have full operational access, including testimonial, category image, and hero slide management, except user management, audit logs, settings, and announcement changes, which remain MANAGER-only. Managers can manage staff and other manager accounts; an account cannot deactivate, suspend, or remove itself. New public registrations are pending and cannot sign in until a manager verifies and activates them. Only active, verified STAFF accounts can be promoted to MANAGER. Customer contact information is stored on orders; customers do not have sign-in accounts.

Interactive OpenAPI documentation is served from `/docs`.
