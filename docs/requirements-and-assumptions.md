# SSC Synapse Requirements and Assumptions

This baseline translates the product brief into buildable decisions for the SSC Synapse MVP. It preserves the full customer-to-payment workflow, chooses the newer Vercel and Railway deployment model, and identifies business rules that Siddique Sons Caterers must confirm before they affect production money or operations.

## Scope precedence

The updated technology and deployment requirements take precedence wherever they conflict with the original master prompt. In particular:

- Vercel replaces AWS as the frontend host.
- Railway replaces ECS or other AWS compute for the API and PostgreSQL.
- Cloudflare R2 or Supabase Storage replaces S3; R2 is the initial recommendation because it is S3-compatible and avoids tying application storage to the database provider.
- Resend replaces SES.
- Redis and BullMQ are deferred until measured workload or reliability needs justify their recurring cost.
- AWS Secrets Manager and CloudWatch are replaced by platform environment variables, structured logs, provider dashboards, and an optional error-monitoring service.

All business, security, testing, accessibility, AI safety, data integrity, and phased product requirements remain in force.

## MVP outcome

Phase 1 is complete only when an authorized user can perform this journey with persisted data and auditable changes:

1. Create or select a customer.
2. Create an event inquiry.
3. Generate and edit menu options using approved catalog data.
4. Calculate deterministic costs, selling prices, and provisional margins.
5. Issue a versioned quotation PDF.
6. Accept the quotation and confirm the booking.
7. Generate an invoice.
8. Record an advance or partial payment idempotently.
9. View correct balances and basic financial reports.

Inventory, expenses, vendors, detailed staff operations, and the conversational assistant can follow without redesigning the core.

## Confirmed architectural assumptions

| Area                 | Initial assumption                                             | Design consequence                                                                                             |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Business tenancy     | One active business at launch                                  | Every tenant-owned record still carries `businessId`; tenancy is enforced in services and repositories.        |
| Currency             | PKR is the default business currency                           | Currency is stored on every financial document; money uses fixed-point decimals, never floating point.         |
| Time                 | Business timezone is configurable and initially `Asia/Karachi` | Instants are stored in UTC; local dates and schedules are interpreted using the business timezone.             |
| Authentication       | Staff use email and password initially                         | Passwords use Argon2id; access and refresh tokens are transported in secure HTTP-only cookies.                 |
| Customer access      | No customer portal in Phase 1                                  | Quotations and invoices are shared as immutable documents by email or secure links.                            |
| Payment collection   | Manual recording only                                          | No gateway dependency; payment method and external reference remain configurable.                              |
| Tax                  | Tax rules vary and are not hardcoded                           | Tax profiles and rates are effective-dated configuration, copied into quotation and invoice snapshots.         |
| Menu data            | Approved dishes, recipes, and prices are authoritative         | The model receives only selected catalog records; all monetary calculations run outside the model.             |
| AI generation        | AI output is advisory until approved                           | Generated options are stored separately from approved event menus and carry provenance and validation state.   |
| File persistence     | Application filesystems are ephemeral                          | All durable uploads and generated PDFs go to object storage.                                                   |
| Background execution | Low initial volume                                             | A PostgreSQL outbox/job table provides durable retry; a small scheduled Railway process claims due work.       |
| Soft deletion        | Business records need history                                  | Customers, dishes, users, and similar master records are archived; issued financial records are never deleted. |
| Reporting            | Operational reporting is near-real-time                        | Reports query normalized data and selected read models; no data warehouse is required initially.               |

## Business decisions that must not be invented

These decisions do not block foundation work, but the responsible business owner must confirm them before the related workflow is considered production-ready.

| Decision                                          | Needed by                | Safe default during development                                                                    |
| ------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| Quotation and invoice numbering format            | Quotation implementation | Configurable sequential number scoped to business and fiscal year.                                 |
| Tax registration details and applicable tax rules | First issued quotation   | No tax applied unless an active tax profile is explicitly selected.                                |
| Advance payment policy                            | Booking confirmation     | Show an editable suggested amount; do not enforce a percentage.                                    |
| Quote validity period                             | Quotation implementation | Business setting, initially 14 days only as seed data.                                             |
| Cancellation, postponement, and refund policy     | Booking workflow         | Require owner or manager approval and a reason; no automatic refund.                               |
| Child portion factor and serving assumptions      | Menu quantity engine     | Versioned assumptions marked provisional until kitchen approval.                                   |
| Ingredient costing method                         | Phase 2 inventory        | Weighted average is proposed; no realized-cost claim until adopted.                                |
| Discount approval thresholds                      | Quotation workflow       | Owner permission required for all discounts until thresholds are configured.                       |
| Credit terms and overdue grace period             | Invoice reminders        | Due date is manually selected; reminders require explicit configuration.                           |
| Duplicate customer matching rules                 | CRM implementation       | Warn on normalized phone, WhatsApp, or email matches; allow authorized override.                   |
| Constrained resources                             | Event conflict detection | Venues, equipment groups, vehicles, and staff become configurable resources.                       |
| Financial visibility by role                      | Authorization setup      | Owner and accountant have full visibility; manager visibility is disabled until configured.        |
| Data retention periods                            | Production readiness     | Retain business and audit records; define legal deletion rules before accepting deletion requests. |

## Non-functional requirements

### Security

- Deny access by default and evaluate permissions within the current business scope.
- Keep tokens, OpenAI keys, storage credentials, and email credentials on the server.
- Require CSRF protection for cookie-authenticated state changes and use an exact CORS allowlist.
- Rate-limit login, password reset, AI generation, document sharing, and public-link endpoints.
- Validate upload type, size, and content; use signed object-storage URLs.
- Record actor, action, target, business, request correlation ID, and before/after summaries for sensitive mutations.
- Never log passwords, full tokens, reset secrets, or unnecessary personal data.

### Reliability and data integrity

- Use database transactions for document issuance, booking confirmation, payment allocation, refunds, credit notes, and stock movements.
- Require idempotency keys for financial mutations and external delivery requests.
- Use immutable snapshots for issued quotation and invoice values.
- Store every payment and adjustment as an append-only record; never replace payment history silently.
- Use optimistic concurrency on editable aggregates where simultaneous edits could lose data.
- Back up PostgreSQL and object storage, document restoration, and test a restore before launch.

### Performance and cost

- Paginate every unbounded list and select only required fields.
- Prefer event-driven cache invalidation in the frontend to background polling.
- Use relational filtering for menu retrieval before considering embeddings or vector search.
- Set per-user and per-business AI request and monthly-spend limits.
- Avoid a permanent worker, Redis, search cluster, or analytics warehouse until measurements justify them.

### Accessibility and usability

- Target WCAG 2.2 AA for core workflows.
- Support keyboard navigation, visible focus, semantic forms, clear validation, reduced motion, and sufficient contrast.
- Provide loading, empty, permission-denied, recoverable-error, and irreversible-action confirmation states.
- Design desktop-first operational screens that remain usable on tablets and mobile devices.

## Definition of production-ready MVP

- The complete MVP journey passes end-to-end tests with real PostgreSQL persistence.
- Authorization tests prove that restricted roles cannot read or mutate protected financial or administrative data.
- Financial calculations have unit tests covering rounding, discounts, taxes, partial payments, refunds, and credit notes.
- AI recommendations are schema-validated, catalog-grounded, budget-limited, and clearly provisional when source costs are incomplete.
- Migrations run through a controlled release job and have a rollback or forward-fix procedure.
- Production domains, HTTPS, CORS, cookies, backups, restore checks, health checks, alerts, and usage budgets are configured.
- No completed workflow depends on mock data, local disk persistence, or secrets committed to the repository.
