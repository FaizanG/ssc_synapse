# SSC Synapse Production Deployment

The production topology is a Vercel Next.js project, a Railway NestJS service, and Railway PostgreSQL. Cloudflare R2, Resend, and OpenAI are connected only when their corresponding product slices are enabled.

## Preconditions

- Push the repository to a private GitHub repository with a protected `main` branch.
- Require the GitHub Actions `CI` check before merging.
- Create separate Railway environments for development/staging and production.
- Create separate Vercel preview and production environment values.
- Generate a unique `JWT_ACCESS_SECRET` of at least 32 random characters for every environment.

## Railway API and PostgreSQL

Railway's supported TypeScript Infrastructure-as-Code declaration is in `.railway/railway.ts`. It defines the API, PostgreSQL, build and start commands, readiness probe, and the single pre-deploy migration command.

1. Install Railway CLI 5.63 or later and authenticate.
2. Create or link the `ssc-synapse` Railway project and target environment.
3. Install dependencies with `pnpm install --frozen-lockfile`.
4. Set `JWT_ACCESS_SECRET` and `FRONTEND_URL` on the API service before the first apply. Add `OPENAI_API_KEY`, `OPENAI_MODEL`, `RESEND_API_KEY`, and storage variables only as those modules are enabled.
5. Run `railway config plan`, review every resource and variable change, then run `railway config apply`.
6. Connect the GitHub repository to the API service and enable automatic deploys from the protected production branch.

`pnpm db:deploy` runs once as a pre-deploy command. A failed migration stops deployment before the new API starts. Railway admits the release only after `/health/ready` returns success.

For high-risk migrations, create a database backup first. Never use `prisma migrate dev` in production. Test restoration into an isolated database at least quarterly and before declaring the service production-ready.

## Vercel frontend

1. Import the same GitHub repository into Vercel.
2. Select `apps/web` as the project root and let Vercel detect Next.js.
3. Set `NEXT_PUBLIC_API_URL` to the public Railway API URL ending in `/api/v1`.
4. Set `NEXT_PUBLIC_APP_NAME` and `NEXT_PUBLIC_APP_URL`.
5. Add the final Vercel/custom origin to Railway's `FRONTEND_URL`, then redeploy the API.
6. Enable production deploys only from the protected branch; pull requests use Vercel previews.

Production should use sibling custom domains such as `app.example.com` and `api.example.com`. Set `COOKIE_DOMAIN` only when a shared parent-domain cookie is deliberately required; otherwise host-only cookies are safer.

## Release verification

After each production promotion, verify:

1. `/health/live` and `/health/ready` return `2xx`.
2. Login, refresh, current-user lookup, and CSRF-protected logout succeed.
3. The frontend can call the API only from the configured origin.
4. No development token, default seed password, or provider secret is present in logs or client bundles.
5. Error rate, response latency, database usage, and hosting spend remain within agreed alerts.

Rollback the application through Railway or Vercel when code is faulty. Database schema changes are forward-fixed with a new reviewed migration; do not roll back a migration destructively after production writes may depend on it.
