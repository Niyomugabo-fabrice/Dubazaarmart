# DubazaarMart workspace

This repository is a pnpm workspace with independent frontend and backend applications.

## Applications

- `frontend/` is the Next.js App Router storefront and admin UI. Keep its visual design and responsive behavior unchanged unless the user asks for a redesign.
- `backend/` is the NestJS REST API. It owns authentication, authorization, business rules, PostgreSQL access, Cloudinary uploads, and data processing.
- `docs/` contains architecture and API documentation. The archived Prisma schema is historical reference only; runtime persistence uses TypeORM.

## Development

- `pnpm install` installs workspace dependencies.
- `pnpm dev` runs the frontend on `$PORT` (default 8443) and the backend on port 3001.
- `pnpm --filter @dubazaarmart/frontend dev` runs only the frontend.
- `pnpm --filter @dubazaarmart/backend start:dev` runs only the backend.
- Frontend API calls go through `frontend/src/services/api-client.ts` and use `NEXT_PUBLIC_API_URL`.
- Backend routes use the `/api/v1` global prefix. Swagger is served from `/docs`.

## Database safety

- TypeORM is the only runtime ORM. Keep `synchronize` and automatic migration execution disabled.
- Map entities to the existing PostgreSQL schema and preserve its records, indexes, constraints, and relationships.
- Schema changes belong in TypeORM migrations. Review migrations before applying them to a database containing production data.
- Never add credentials to source code, docs, or `NEXT_PUBLIC_*` variables.

## Code quality

- Use double quotes for strings containing apostrophes, or escape apostrophes inside single-quoted strings.
- Close JSX tags and balance braces.
- Export React components as default exports.
- Use the existing UI components and styles rather than introducing a new design system.
