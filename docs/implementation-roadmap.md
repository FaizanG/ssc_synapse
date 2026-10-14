# SSC Synapse Phased Implementation Roadmap

The delivery plan builds a production-quality vertical slice before broadening the feature set. Each milestone leaves the system deployable, tested, and demonstrable. The sequence protects the highest-risk foundations—authorization, tenant scoping, money, document versioning, and AI grounding—before operational expansion.

## Delivery principles

- Build in vertical slices that include schema, API, UI, permissions, audit, and tests.
- Keep the modular monolith deployable after every merge to the protected main branch.
- Use real PostgreSQL from the first integration test; do not defer persistence behind mock repositories.
- Treat migrations, seed data, OpenAPI, environment validation, and observability as product work.
- Require business sign-off on money, tax, portions, and document policies before production use.
- Measure cost and performance before adding infrastructure.

## Milestone summary

| Milestone                           | Outcome                                                        | Indicative iterations          |
| ----------------------------------- | -------------------------------------------------------------- | ------------------------------ |
| 0. Decision and design gate         | Business rules owned; architecture baseline accepted           | 1                              |
| 1. Engineering foundation           | Monorepo, CI, deployable web/API/database, identity and access | 2                              |
| 2. CRM and event intake             | Customers and event inquiries managed end to end               | 2                              |
| 3. Catalog, costing, and AI menus   | Grounded, editable menu options with deterministic totals      | 3                              |
| 4. Quotations and booking           | Versioned quotation issuance and accepted booking              | 2                              |
| 5. Invoices and payments            | Reliable billing, partial payments, receipts, and balances     | 2                              |
| 6. Dashboard, hardening, and launch | Real KPIs, exports, security and production readiness          | 2                              |
| 7. Operational management           | Expenses, vendors, inventory, staff, and event execution       | 4 to 6                         |
| 8. Advanced AI and analytics        | Permission-aware assistant and optimization                    | 3 to 5                         |
| 9. SaaS readiness                   | Tenant onboarding, entitlements, branding, subscriptions       | Triggered by commercialization |

Iterations are planning units, not fixed promises. A small dedicated product team can treat them as roughly two-week increments after requirements access, business feedback, and deployment accounts are available.

## Milestone 0 — Decision and design gate

### Deliverables

- Approve the architecture, data model, module boundaries, and technology overrides in this package.
- Assign owners and due points for the unresolved business decisions.
- Obtain representative existing menus, recipes, prices, quotation and invoice samples, and event workflows.
- Define the default role-to-permission matrix and financial visibility.
- Confirm production domain strategy, Railway/Vercel regions, R2 versus Supabase Storage, and error-monitoring choice.
- Create an initial threat model and data classification.

### Exit criteria

- No unresolved decision can silently change tax, price, discount, refund, or inventory outcomes.
- Sample source data is approved for seed and test fixtures after sensitive values are removed.
- Architecture decision records have named reviewers.

## Milestone 1 — Engineering foundation

### Build

- Initialize the `pnpm` monorepo with Next.js, NestJS, strict TypeScript, Prisma, shared configuration, and generated OpenAPI client.
- Add local PostgreSQL through Docker Compose; provide validated `.env.example` files.
- Configure formatting, linting, type checking, unit tests, integration tests, and CI gates.
- Create business, user, membership, roles, permissions, sessions, invitations, audit, idempotency, outbox, and job schemas.
- Implement secure login, refresh rotation, logout, password recovery, invitations, account state, and session management.
- Implement request context, tenant-scoped repositories, permission guards, structured errors, correlation IDs, logs, rate limits, CORS, CSRF protection, and health checks.
- Establish the application shell, navigation, theme, design tokens, protected routes, error states, and core form/table patterns.
- Deploy a non-production web app to Vercel and API/PostgreSQL to Railway.

### Tests

- Authentication success and failure, refresh replay, reset expiry, invitation acceptance, deactivation, and session revocation.
- Cross-tenant repository denial and permission matrix tests.
- Health, environment validation, migration-from-empty, and CI build tests.

### Exit criteria

- A seeded owner can sign in securely, invite a user, assign a role, and see an audited change.
- Preview or staging deployments contain no production secrets or data.
- Every API route is deny-by-default and appears in Swagger when intended.

## Milestone 2 — CRM and event intake

### Build

- Customer create, search, edit, archive, contact normalization, duplicate warnings, notes, and history.
- Event inquiries with schedule, timezone, venue snapshot, guests, service style, budget, instructions, and coordinator.
- Status-transition policy and history for the early lifecycle.
- Event list, calendar, Kanban, creation wizard draft persistence, and detail workspace.
- Basic venue and schedule conflict detection.
- Customer and event audit events, files, pagination, filtering, and authorization.

### Tests

- Duplicate-candidate rules, archive behavior, customer isolation, status graph, event time validation, overlap boundaries, and assigned-only access.
- End-to-end journey from customer creation to a saved event inquiry.

### Exit criteria

- Staff can replace the inquiry register and event diary for the scoped workflow without spreadsheets.
- Calendar and list data comes from production-shaped API queries, not UI fixtures.

## Milestone 3 — Catalog, costing, and AI menus

### Build

- Dish categories, dishes, approved versions, dietary and allergen labels, ingredients, units, recipe versions, price books, and menu packages.
- Import workflow for existing menu data with validation and a dry-run report.
- Pure domain services for unit conversion, servings, recipe cost, price, profit, margin, budget difference, and completeness.
- Business-configurable serving assumptions and kitchen-approval state.
- OpenAI adapter, prompt template/version registry, structured response schema, usage log, monthly budget enforcement, and provider failure handling.
- Relational retrieval of eligible dishes and post-generation validation.
- AI Menu Studio requirements, three-option comparison, edit, regeneration, approval, and event-menu adoption.
- Clear provisional and allergy warnings with source-version visibility.

### Tests

- Unit conversions, child/adult assumptions, wastage, missing costs, rounding, margins, budget boundaries, and effective prices.
- AI schema rejection, unknown IDs, dietary exclusions, cost-source incompleteness, rate and budget limits, timeout and provider error handling.
- Contract tests use recorded sanitized provider responses; a small opt-in live-provider suite runs outside normal CI.

### Exit criteria

- Given approved catalog data, the system produces editable options without accepting AI-created official prices.
- Re-running the deterministic calculator on stored inputs produces the stored totals.
- Kitchen staff can identify every incomplete estimate and approve the final event menu.

## Milestone 4 — Quotations and booking

### Build

- Quotation draft creation from an event menu or manual line items.
- Decimal-safe charge, discount, tax, and total calculations.
- Sequential numbering, immutable issued versions, revision comparison, and status transitions.
- Branded PDF template, R2 persistence, preview, expiring share links, and Resend delivery.
- Quotation acceptance or rejection and transactional conversion to a confirmed booking.
- Advance-payment requirement as an explicit snapshot, not a hidden setting.

### Tests

- Fixed and percentage discounts, inclusive and exclusive tax profiles, rounding, validity, concurrent numbering, immutable issuance, superseding, resend idempotency, and expired shares.
- End-to-end customer, event, approved menu, issued quotation, acceptance, and confirmation.

### Exit criteria

- The exact accepted version, terms, prices, PDF, and actor history remain retrievable after catalog changes.
- Repeated issue, send, or conversion requests cannot duplicate documents or bookings.

## Milestone 5 — Invoices and payments

### Build

- Deposit, progress, final, and manual invoice drafts with source references.
- Invoice issuance, numbering, immutable lines, PDF delivery, and due dates.
- Payment recording for configured methods, unallocated credit, allocation, partial payment, and receipt PDFs.
- Controlled void, credit note, refund request/approval, and derived payment statuses.
- Customer and event financial timelines and receivables aging.

### Tests

- Invoice calculation, partial allocation, multiple invoices, unallocated credit, overpayment prevention, concurrent allocations, refund limit, credit-note effect, overdue status, and idempotency.
- Authorization tests for accountant, manager visibility, owner approvals, and restricted staff.
- End-to-end path through advance payment and final settlement.

### Exit criteria

- Invoice balance can be independently reconstructed from append-only records.
- Financial corrections leave a visible trail and never overwrite payments.

## Milestone 6 — Dashboard, hardening, and MVP launch

### Build

- Real KPI queries, revenue and expense-ready report definitions, event counts, quotation pipeline, receivables aging, and basic estimated profitability.
- Drill-down navigation, CSV export, queued PDF export, date filters, and empty states.
- Transactional notifications for quotation, booking, invoice, payment, and reminders.
- Query profiling, pagination review, database indexes, accessibility pass, responsive QA, and browser coverage.
- Backup automation, restore runbook and test, incident runbook, dependency review, security headers, file validation, log redaction, alerts, and usage budgets.
- Production Vercel, Railway, R2, Resend, OpenAI, DNS, HTTPS, CORS, and environment configuration.

### Release gates

- Complete customer-to-payment end-to-end test passes in a production-like environment.
- No critical or high unresolved security issue; dependency and secret scans pass.
- Database restore and object-storage recovery are demonstrated.
- Load smoke test meets agreed latency targets at expected initial concurrency.
- Owner and accountant approve document totals, terminology, and reports.
- Operations users complete acceptance testing with real scenarios.
- Rollback, forward-fix, support ownership, monitoring, and cost alerts are documented.

## Phase 2 — Operational management

### Workstreams

1. **Expenses and vendors:** categories, event expenses, receipts, approvals, vendor balances, vendor payments, planned-versus-actual reporting.
2. **Inventory and recipes:** purchases, lots, cost versions, reservations, issue and return, wastage, stocktake, low-stock alerts, event ingredient plans.
3. **Staff operations:** availability, conflict-aware assignments, preparation, delivery, service checklists, and completion reports.
4. **Realized profitability:** combine invoice revenue, allocations, credits, expenses, and inventory consumption with explicit accounting definitions.
5. **Operational notifications:** upcoming-event, assignment, schedule-change, low-stock, and overdue-task workflows.

### Exit criteria

- Confirmed menus generate explainable ingredient requirements.
- Stock changes only through traceable movements.
- Event profitability clearly separates estimated from realized amounts.
- Staff and constrained resources cannot be double-booked without an authorized override.

## Phase 3 — Advanced AI and analytics

### Workstreams

- Synapse AI with permission-aware read tools and confirmation-gated write tools.
- Menu cost-reduction and substitution suggestions backed by current catalog and inventory data.
- Historical comparison across completed events with source links.
- Predictive ingredient requirements only after enough clean historical data exists.
- Prompt evaluation datasets, regression scoring, model fallback policy, and business-quality review.
- Advanced reports and optional cached read models for slow aggregates.

### Exit criteria

- Every answer states its data period and links to the internal records used.
- Mutation tools require exact, expiring confirmation and create audit records.
- Offline evaluations meet agreed accuracy, constraint, and cost thresholds before prompt or model promotion.

## Phase 4 — SaaS readiness

Begin only when there is a validated commercialization plan.

- Tenant onboarding and lifecycle.
- Enforced tenant branding, feature entitlements, quotas, and data export.
- Subscription catalog, billing provider, dunning, and plan administration.
- Stronger isolation controls, tenant-specific encryption or row-level security if justified.
- Tenant-aware support tooling, usage metering, and operational reporting.
- Migration path for existing Siddique Sons Caterers data into the first production tenant.

## Test strategy across all milestones

| Layer                        | Focus                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------- |
| Domain unit tests            | Calculations, transitions, permissions, constraints, rounding, completeness      |
| Application tests            | Transactions, idempotency, audit, provider coordination, confirmation gates      |
| Repository integration tests | PostgreSQL constraints, tenant isolation, concurrency, query behavior            |
| API contract tests           | DTO validation, status codes, error shape, OpenAPI compatibility                 |
| Component tests              | Forms, tables, permissions, accessibility, error and loading states              |
| End-to-end tests             | Critical user journeys and role restrictions in a deployed production-like stack |
| Operational tests            | Migration, backup and restore, readiness, job retry, provider outage, rollback   |

Tests use deterministic clocks, factories, and per-test database isolation. External providers are represented by contract-faithful fakes in CI; limited live smoke tests use dedicated non-production accounts.

## CI and deployment plan

Pull requests run formatting checks, lint, type checking, unit tests, integration tests, production builds, migration validation, and secret/dependency scans. Vercel creates frontend previews. Backend previews use a shared isolated staging service or on-demand Railway environment only when the value justifies the cost.

Production promotion from a protected branch performs:

1. CI and build verification.
2. Database backup for high-risk changes.
3. A single controlled `prisma migrate deploy` step.
4. Railway API deployment and readiness check.
5. Vercel deployment.
6. Critical-path smoke tests.
7. Monitoring of errors, latency, jobs, and costs during the release window.

## Cost controls

- Start with one Railway API service, one PostgreSQL database, and scheduled job executions rather than an always-on worker.
- Keep staging asleep or scaled down when not in use if the selected plans support it.
- Paginate and project database queries; investigate slow queries before increasing compute.
- Store optimized images and immutable PDFs in R2 with lifecycle rules for abandoned uploads.
- Use a configurable economical AI model, bounded catalog context, structured compact output, response caching only when inputs and source versions match, and hard monthly limits.
- Review provider usage and billing alerts monthly; introduce Redis only after queue or caching measurements establish the saving.

## Primary risks and mitigations

| Risk                                    | Mitigation                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Incomplete or inconsistent catalog data | Import validation, completeness scores, kitchen approval, and provisional outputs               |
| Financial rule ambiguity                | Decision register, effective-dated configuration, immutable snapshots, owner acceptance tests   |
| AI hallucinated dishes or prices        | ID-only catalog selection, strict schema, server validation, deterministic calculators          |
| Cross-tenant data leakage               | Context-derived tenant scope, composite keys, repository tests, optional later RLS              |
| Cookie issues across hosts              | Production sibling custom domains, exact CORS, CSRF tokens, environment tests                   |
| Railway/Vercel plan limits              | Usage alerts, load smoke tests, connection pooling, documented upgrade thresholds               |
| Background job loss                     | PostgreSQL persistence, leases, retries, deduplication, failure alerts                          |
| Historical totals changing              | Versioned recipes and prices plus immutable issued-document snapshots                           |
| Operational adoption failure            | Early user testing, familiar terminology, import support, fast workflows, visible audit history |

## Immediate next actions

1. Review and approve or amend the assumptions and open business decisions.
2. Supply sanitized examples of current menus, recipes, quotations, invoices, customer records, and event checklists.
3. Confirm the default permission matrix and who may view margins, issue documents, approve discounts, and record refunds.
4. Select R2 or Supabase Storage and confirm production domain ownership.
5. After the design gate, scaffold Milestone 1 and produce the first migration, OpenAPI baseline, CI pipeline, local setup, and staging deployment.
