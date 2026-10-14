# SSC Synapse Local Development

The local environment runs the Next.js frontend and NestJS API on the host with PostgreSQL in Docker. Node.js 24 and pnpm 10 are the supported baseline.

## Prerequisites

- Node.js 24 or later
- pnpm 10.32.1 through Corepack
- Docker Desktop with Compose

## First setup

1. Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env.local`. Keep the development database URL unless the port is already used.
2. Replace `JWT_ACCESS_SECRET` with at least 32 random characters.
3. Run `pnpm install`.
4. Start PostgreSQL with `docker compose up -d postgres`.
5. Generate the Prisma client with `pnpm db:generate`.
6. Apply migrations with `pnpm db:migrate`.
7. Seed the business, permissions, owner role, and local owner with `pnpm db:seed`.
8. Start both applications with `pnpm dev`.

The frontend uses `http://localhost:3000`, the API uses `http://localhost:4000`, Swagger is available at `http://localhost:4000/docs`, and readiness is available at `http://localhost:4000/health/ready`.

The non-production seed account defaults to `owner@sscsynapse.local` with password `ChangeMe123!`. Override `SEED_OWNER_EMAIL`, `SEED_OWNER_NAME`, and `SEED_OWNER_PASSWORD` before seeding when a shared development environment is used. Production seeding refuses to use the default password.

## Verification

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:ci
pnpm build
```

## Database commands

- `pnpm db:generate` regenerates the typed client after schema changes.
- `pnpm db:migrate` creates and applies a reviewed development migration.
- `pnpm db:deploy` applies committed migrations without creating new ones.
- `pnpm db:seed` upserts foundation configuration and the local owner.

Do not run development migrations against production. Production migrations are applied once through the controlled Railway release process.
