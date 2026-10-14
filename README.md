# SSC Synapse

SSC Synapse is the AI-enabled catering and event management platform for Siddique Sons Caterers. The initial release is a single-business modular monolith that supports the complete customer-to-payment lifecycle while preserving a clean path to multi-business tenancy.

The first Milestone 1 foundation slice is now implemented: the monorepo, web and API applications, PostgreSQL schema and migration, secure cookie authentication, permissions, invitations, password recovery, audit foundation, CI, local containers, and deployment configuration are in place. Milestone 2 adds customer and event intake workflows after the remaining foundation administration screens and staging setup are completed.

## Architecture package

- [Requirements and assumptions](docs/requirements-and-assumptions.md)
- [System architecture](docs/system-architecture.md)
- [Database design](docs/database-design.md)
- [Module and API breakdown](docs/module-breakdown.md)
- [Phased implementation roadmap](docs/implementation-roadmap.md)
- [Local development](docs/local-development.md)
- [Production deployment](docs/production-deployment.md)

## Governing technology decisions

The updated deployment requirements supersede the AWS-specific infrastructure in the original product brief.

| Concern          | Decision                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Frontend         | Next.js App Router on Vercel                                                                  |
| Backend          | NestJS REST API on Railway                                                                    |
| Database         | Railway PostgreSQL with Prisma                                                                |
| AI               | OpenAI API, called only by the backend                                                        |
| Persistent files | Cloudflare R2 by default, behind a storage interface                                          |
| Email            | Resend, behind a notification provider interface                                              |
| Background work  | PostgreSQL-backed outbox and jobs for the MVP; Redis and BullMQ only when load justifies them |
| Architecture     | Tenant-aware modular monolith                                                                 |
| Delivery         | GitHub-connected Vercel and Railway deployments                                               |

## Delivery rule

Financial totals, inventory quantities, permissions, and official catalog prices are computed or validated by deterministic application services. AI may recommend, explain, and draft, but it cannot invent official prices, issue unrestricted database queries, or mutate critical records without explicit user confirmation.
