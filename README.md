# NexusDevStudio Affiliates

A referral and affiliate platform for NexusDevStudio web design and development
services. Approved affiliates receive a unique referral code and link, refer
businesses, and earn commission on sales that are completed and paid.

Built with Next.js 16 (App Router), TypeScript, PostgreSQL via Prisma, Tailwind
CSS v4 and a bilingual (Greek / English) interface with Greek as the default.

## What the platform does

| Area | Summary |
| --- | --- |
| Public site | Landing page, services and pricing, FAQ, program terms, privacy policy, and a lead capture form that accepts a referral code. |
| Referral attribution | Referral code (primary), referral link with cookie tracking (secondary), and manual attribution by an administrator (for DMs, comments and phone calls). |
| Affiliate area | Dashboard, referral code and link, leads, sales, commissions, payouts, promotional resources, notifications and profile. |
| Admin area | Applications and affiliate management, leads, customers, sales, commissions, payouts, referral click tracking, resources, services and pricing, program settings and audit logs. |
| Money | Commission is configurable per service (fixed amount or percentage), generated exactly once per paid sale, reviewed and approved by an administrator, then paid out on request. |

Nothing in the product displays invented data. The seed creates the
administrator account, the service catalogue, the program settings and the
affiliate resource library — no demo affiliates, leads, sales or commissions.

## Running locally

Requires Node.js 20.9+ and a PostgreSQL database.

```bash
git clone https://github.com/codesgreece/nexusrefferal.git
cd nexusrefferal
npm install
cp .env.example .env    # then fill in the values
npm run db:deploy       # apply migrations
npm run db:seed         # admin user, services, settings, resources
npm run dev             # http://localhost:43711
```

Sign in at `/login` with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string used at runtime. Use the pooled URL if your provider has a pooler. |
| `DIRECT_URL` | yes | Direct (non-pooled) connection used by `prisma migrate`. Set it to the same value as `DATABASE_URL` if there is no pooler. |
| `SESSION_SECRET` | yes | Salt for hashing IP addresses on referral clicks. Generate with `openssl rand -hex 32`. |
| `NEXT_PUBLIC_APP_URL` | yes | Public origin, used to build the referral links shown to affiliates. |
| `ADMIN_EMAIL` | yes | Bootstrap administrator email, created or updated by the seed. |
| `ADMIN_PASSWORD` | yes | Bootstrap administrator password. Change it after the first sign-in. |
| `ADMIN_NAME` | no | Display name for the administrator account. |

## Deploying to Vercel

1. Import the repository into Vercel. The framework is detected as Next.js.
2. Add a PostgreSQL database (Vercel Postgres, Neon or Supabase all work) and
   set `DATABASE_URL` and `DIRECT_URL` from it.
3. Add `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL` and
   `ADMIN_PASSWORD` as environment variables.
4. Deploy. The build command runs `prisma migrate deploy` and the idempotent
   seed before `next build`, so the schema, service catalogue and administrator
   account are in place on first boot.

## Architecture

```
prisma/
  schema.prisma          17 models, foreign keys, indexes, unique constraints
  seed.ts                administrator, services, settings, resources
src/
  app/
    (public)/            landing, pricing, contact, terms, privacy
    (auth)/              login, registration, password reset
    affiliate/           affiliate dashboard (own data only)
    admin/               administrator control centre
    actions/             server actions — every mutation enters here
    ref/[code]/          referral link tracking and attribution cookie
  components/
    ui/                  design system primitives
    layout/              application shell, navigation, notifications
    public/, affiliate/, admin/
  lib/
    auth/                sessions, password hashing, role guards
    services/            business logic (attribution, commissions, payouts, …)
    validation/          zod schemas shared by every write path
    i18n/                dictionaries and locale resolution
```

### Design decisions worth knowing

- **Money is integer euro cents.** No monetary value is ever a float.
- **One commission per sale, enforced by the database.** `Commission.saleId` is
  unique, which makes commission generation idempotent: a repeated payment
  confirmation cannot pay an affiliate twice.
- **Commission is always computed server-side** from the service configuration
  and the stored sale amount. Client-supplied amounts and affiliate ids are
  never trusted.
- **Attribution is never guessed.** An explicit code wins, then the referral
  cookie; if neither resolves to an active code belonging to an active
  affiliate, the lead is left unattributed for an administrator to review.
- **Statuses are validated strings, not database enums**, so the allowed values
  live in `src/lib/domain.ts` and adding one is not a schema migration.
- **Authorisation is server-side.** Affiliates are scoped to their own records
  in the query layer; hiding UI is never the control.
- **Audit logging is append-only** and covers approvals, attribution changes,
  payment confirmations, commission transitions and payouts.
- **Notifications are stored as a type plus parameters** and translated when
  read, so they follow the reader's language rather than the language they were
  created in.

## Verification

Two scripts check the application against a running dev server. Both clean up
after themselves, so neither leaves demo data behind.

```bash
npm run dev          # in one terminal
npm run test:e2e     # the business flow, end to end
npm run test:routes  # every route, both languages, both roles
```

`test:e2e` walks the full specified flow through the real service layer and the
real HTTP surface: registration, an unapproved affiliate being held out of the
dashboard, approval and referral-code generation, referral-link click tracking,
public-form attribution by code and by cookie, rejection of an invalid code,
self-referral blocking, manual attribution of a DM referral, customer
conversion with duplicate detection, sale creation, payment confirmation
generating exactly one commission, repeated confirmation being a no-op, the
database refusing a second commission for the same sale, commission approval,
the minimum-payout threshold, a payout bundling two commissions, approval and
payment with an immutable status history, notifications, the audit trail, a
refund cancelling an unpaid commission, and suspension stopping new
attribution. It also asserts an affiliate cannot reach admin pages and is
offered no approve control on their own commissions.

`test:routes` requests all 34 routes as an administrator, as an approved
affiliate and anonymously — including filtered and paginated variants and both
locales — and asserts none render an error boundary, that cross-role access
redirects, and that the security headers are present.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 43711. |
| `npm run build` | `prisma generate` + `migrate deploy` + seed + `next build`. |
| `npm run build:app` | Build without touching the database. |
| `npm run typecheck` | TypeScript, no emit. |
| `npm run lint` | ESLint. |
| `npm run db:migrate` | Create and apply a migration in development. |
| `npm run db:deploy` | Apply pending migrations. |
| `npm run db:seed` | Idempotent seed. |
| `npm run db:studio` | Prisma Studio. |
| `npm run test:e2e` | End-to-end business flow against a running server. |
| `npm run test:routes` | Route, locale and authorization coverage. |

## Notes for operators

- Password reset does not send email: no mail provider is configured, so the
  reset link is returned to the requester in the UI. Wire up SMTP or a provider
  such as Resend in `forgotPasswordAction` to send it instead.
- Rate limiting is in-process. Behind more than one instance, move it to a
  shared store such as Redis.
