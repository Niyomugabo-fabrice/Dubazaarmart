# Architecture

## Application boundaries

### Frontend

`frontend/` is the existing Next.js application. Its pages, components, styles, product types, local stores, and visual design remain in place. `src/services/api-client.ts` maps the existing UI request paths to the versioned NestJS endpoints, adds administrator access tokens, rotates refresh tokens after a 401 response, and builds absolute API URLs from `NEXT_PUBLIC_API_URL`.

The frontend does not import TypeORM entities, connect to PostgreSQL, or contain business API handlers.

### Backend

`backend/` is an independent NestJS application. Modules separate authentication, products, orders, inventory, procurement, settings, reporting, health checks, and media uploads. Within each module, presentation controllers call application services; domain repository interfaces define persistence ports; TypeORM adapters implement those ports.

The dashboard reporting adapter keeps its read-only PostgreSQL aggregate queries in the infrastructure layer because they use PostgreSQL date-series and filtered aggregates. All writes use TypeORM repositories and transactions.

## PostgreSQL compatibility

The live legacy schema was inspected using read-only catalog queries before the entity mapping was created. It contains the existing admin, customer, product, order, inventory, procurement, settings, and announcement tables, plus their existing foreign keys, unique constraints, check constraints, and indexes. Business records were present during inspection.

`synchronize`, `migrationsRun`, and `dropSchema` are disabled. The initial migration checks for all expected tables and columns. If it finds the complete legacy schema, it makes no business-table changes; if it finds an empty schema, it creates the initial structure; if it finds a partial schema, it stops before applying DDL. The refresh-token migration is additive and references the existing admins table with `ON DELETE CASCADE`.

The migration is intentionally not run automatically at application startup. Review and apply it with the root workspace migration commands. The old Prisma schema and initial migration are retained as reference files only.

## Authentication

Administrator and staff login use bcrypt password hashes stored in the existing `admins` table. Access tokens and refresh tokens use separate secrets. Refresh tokens are stored as SHA-256 hashes, rotated transactionally, and revoked on logout. Administrators retain full access and are the only role allowed to provision accounts, view the customer directory, or update store settings. Staff accounts can manage orders, products and media, inventory, procurement, reports, and announcements; backend route guards enforce these limits, and report responses omit customer-directory details for staff. The existing `admins.role` column is text, so these roles require no schema migration.

## Operations

- Backend environment and secrets: `backend/.env`
- Frontend public configuration: `frontend/.env.local`
- REST base path: `/api/v1`
- OpenAPI UI: `/docs`
- CORS allowlist: `FRONTEND_URL`
- Database schema changes: TypeORM migrations only
