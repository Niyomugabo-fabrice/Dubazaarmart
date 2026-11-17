# DubazaarMart

DubazaarMart is an e-commerce storefront and administration dashboard backed by a separate REST API.

## Architecture

```text
frontend/   Next.js + TypeScript + React + Tailwind
backend/    NestJS + TypeORM + PostgreSQL
docs/       Architecture and API references
```

The frontend owns pages, UI state, and centralized API calls. The NestJS backend owns authentication, authorization, catalog and order rules, inventory, media uploads, reporting, and all database access. API routes are versioned under `/api/v1`; the frontend API base is configured with `NEXT_PUBLIC_API_URL`.

See [architecture documentation](docs/architecture.md) and the [API reference](docs/api.md).

## Requirements

- Node.js 20.19 or newer
- pnpm 10
- PostgreSQL

## Setup

Install dependencies from the repository root:

```bash
pnpm install
```

Create `backend/.env` from `backend/.env.example`, set the database URL and two different random JWT secrets of at least 32 characters, and configure Cloudinary if image uploads are needed. Create `frontend/.env.local` from `frontend/.env.example` and set the deployed backend URL when it differs from the local default.

The backend environment variables are `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `FRONTEND_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_DEFAULT_EMAIL`, and `ADMIN_DEFAULT_PASSWORD`. The last two are only read by the explicit seed command. Never place backend secrets in frontend environment files or `NEXT_PUBLIC_*` values.

The frontend environment variables are `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_NAME`, and `NEXT_PUBLIC_CURRENCY`.

## Database and migrations

The TypeORM entities map to the existing PostgreSQL tables. Automatic schema synchronization and automatic migration execution are disabled. The initial migration validates an existing schema before recording its baseline; it does not alter populated business tables. A separate additive migration creates the administrator refresh-token table.

Review the migration status before applying migrations:

```bash
pnpm db:migration:show
pnpm db:migrate
```

The migration initializer refuses to proceed if it finds a partial or mismatched legacy schema. It never drops or recreates tables. Run the optional administrator and default settings seed only when needed:

```bash
pnpm db:seed
```

The seed command requires `ADMIN_DEFAULT_EMAIL` and `ADMIN_DEFAULT_PASSWORD`. It leaves existing administrator credentials, products, orders, and settings unchanged.

## Development

Run both applications together:

```bash
pnpm dev
```

The frontend uses `$PORT` when set and defaults to port 8443; the backend defaults to port 3001. The API is available at `http://localhost:3001/api/v1`, and Swagger is available at `http://localhost:3001/docs`.

Run either application independently:

```bash
pnpm --filter @dubazaarmart/frontend dev
pnpm --filter @dubazaarmart/backend start:dev
```

Set `FRONTEND_URL` to a comma-separated list of allowed browser origins. The default includes `http://localhost:8443` and `http://localhost:3000`.

## Checks and builds

```bash
pnpm typecheck
pnpm build
```

## Production deployment

Deploy `frontend/` and `backend/` as separate applications. Set the frontend's `NEXT_PUBLIC_API_URL` to the public API base ending in `/api/v1`. Set the backend database URL, JWT secrets, CORS origins, Cloudinary settings, and port in its private environment. Apply reviewed TypeORM migrations before enabling administrator refresh-token login. Serve the API over HTTPS and publish the Swagger page only where appropriate for the deployment.

The previous Prisma schema and initial SQL snapshot are kept under `docs/architecture/legacy-prisma/` for historical reference. They are not installed or used at runtime.
