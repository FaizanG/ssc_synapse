import {
  defineRailway,
  postgres,
  preserve,
  project,
  service,
} from "railway/iac";

export default defineRailway(() => {
  const database = postgres("postgres");
  const api = service("api", {
    build:
      "corepack enable && pnpm install --frozen-lockfile && pnpm db:generate && pnpm --filter @ssc/api build",
    start: "pnpm --filter @ssc/api start:prod",
    preDeploy: "pnpm db:deploy",
    healthcheck: "/health/ready",
    healthcheckTimeout: 30,
    env: {
      NODE_ENV: "production",
      PORT: "4000",
      API_PREFIX: "api",
      DATABASE_URL: database.env.DATABASE_URL,
      DIRECT_DATABASE_URL: database.env.DATABASE_URL,
      JWT_ACCESS_SECRET: preserve(),
      FRONTEND_URL: preserve(),
      TRUST_PROXY: "true",
    },
  });

  const web = service("web", {
    build:
      "corepack enable && pnpm install --frozen-lockfile && pnpm --filter @ssc/web build",
    start: "pnpm --filter @ssc/web start",
    healthcheck: "/",
    healthcheckTimeout: 30,
    env: {
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      API_INTERNAL_HOST: api.env.RAILWAY_PRIVATE_DOMAIN,
      NEXT_PUBLIC_API_URL: "/api/v1",
      NEXT_PUBLIC_APP_NAME: "SSC Synapse",
      NEXT_PUBLIC_APP_URL: preserve(),
    },
  });

  return project("ssc-synapse", { resources: [database, api, web] });
});
