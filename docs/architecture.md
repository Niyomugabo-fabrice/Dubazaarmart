# Architecture

## Application boundaries

### Frontend

`frontend/` is the existing Next.js application. Its pages, components, styles, product types, local stores, and visual design remain in place. `src/services/api-client.ts` maps the existing UI request paths to the versioned NestJS endpoints, attaches in-memory manager/staff access tokens, refreshes them using an HttpOnly cookie after a 401 response, and builds absolute API URLs from `NEXT_PUBLIC_API_URL`.

The frontend does not import TypeORM entities, connect to PostgreSQL, or contain business API handlers.

### Backend

`backend/` is an independent NestJS application. Modules separate authentication, products, orders, inventory, procurement, settings, reporting, health checks, and media uploads. Within each module, presentation controllers call application services; domain repository interfaces define persistence ports; TypeORM adapters implement those ports.

The dashboard reporting adapter keeps its read-only PostgreSQL aggregate queries in the infrastructure layer because they use PostgreSQL date-series and filtered aggregates. All writes use TypeORM repositories and transactions.

## PostgreSQL compatibility

The live legacy schema was inspected using read-only catalog queries before the entity mapping was created. It contains the existing admin, customer, product, order, inventory, procurement, settings, and announcement tables, plus their existing foreign keys, unique constraints, check constraints, and indexes. Business records were present during inspection.

`synchronize`, `migrationsRun`, and `dropSchema` are disabled. The initial migration checks for all expected tables and columns. If it finds the complete legacy schema, it makes no business-table changes; if it finds an empty schema, it creates the initial structure; if it finds a partial schema, it stops before applying DDL. The manager/staff authentication migration copies legacy administrator identities into `users`, removes the legacy auth tables and customer password hashes, adds audit logs, and defaults staff registration to disabled. It preserves customer, order, and other business records, but is irreversible and must be reviewed and backed up before use.

The migration is intentionally not run automatically at application startup. Review and apply it with the root workspace migration commands. The old Prisma schema and initial migration are retained as reference files only.

## Authentication

Authentication supports only MANAGER and STAFF; customers do not have accounts, but guest checkout continues to preserve customer and order records. Passwords are bcrypt-hashed in `users`. Access JWTs are held in frontend memory, while stateless refresh JWTs use HttpOnly, secure production cookies. Every protected request loads current user status and permissions from PostgreSQL, so suspended or inactive users lose access immediately. Managers administer staff, permissions, registration availability, settings, customer records, and audit logs. Staff permissions are checked by backend guards and reflected in dashboard navigation.

## Operations

- Backend environment and secrets: `backend/.env`
- Frontend public configuration: `frontend/.env.local`
- REST base path: `/api/v1`
- OpenAPI UI: `/docs`
- CORS allowlist: `FRONTEND_URL`
- Database schema changes: TypeORM migrations only
