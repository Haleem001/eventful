# Eventful — Backend

**→ https://eventful.fly.dev/api/docs**

NestJS API for Eventful, an event ticketing platform. PostgreSQL + Paystack + Resend.

## Prerequisites

- Node.js >= 18
- pnpm
- PostgreSQL (or a remote instance like Aiven)
- Paystack secret key (test mode)
- Resend API key

## Setup

```bash
pnpm install
```

Create `.env` in the project root:

```
DB_URL="postgresql://user:pass@host:port/eventful-db?sslmode=no-verify"
DB_SSL=true
JWT_SECRET="<random-64-char-hex>"
PAYSTACK_SECRET_KEY="sk_test_..."
RESEND_API_KEY="re_..."
EMAIL_FROM="Eventful <noreply@yourdomain.com>"
REDIS_URL="redis://..."
```

Copy `DB_SSL`, `REDIS_URL`, etc. from the existing `.env` if continuing development.

## Running

```bash
pnpm start:dev     # watch mode
pnpm start         # production
pnpm build         # compile
```

## Database

TypeORM with `synchronize: true` — tables auto-sync on startup. No migration workflow; run `src/seed.ts` to populate sample data:

```bash
npx ts-node src/seed.ts
```

## Modules

| Module     | Description                                   |
| ---------- | --------------------------------------------- |
| `auth`     | Register, login, JWT, email verification      |
| `events`   | CRUD for events, search/filter, category      |
| `tickets`  | Ticket creation, cancel, scan, user lookup    |
| `payments` | Paystack initialize + verify, webhook         |
| `users`    | Profile read/update                           |
| `notifications` | Email via Resend, reminder cron (60s)   |
| `analytics` | Creator dashboard stats (revenue, scans)     |

## API Endpoints

Key public routes:

| Method | Path                   | Auth     | Description           |
| ------ | ---------------------- | -------- | --------------------- |
| POST   | `/auth/register`       | No       | Create account        |
| POST   | `/auth/login`          | No       | Sign in               |
| GET    | `/events`              | No       | Browse + search       |
| GET    | `/events/:id`          | No       | Event details         |
| POST   | `/payments/initialize` | JWT      | Start Paystack flow   |
| POST   | `/payments/verify`     | JWT      | Confirm payment       |
| GET    | `/tickets/user`        | JWT      | My tickets            |

See Swagger docs at `/api` when running in development.

## Rate Limits

| Scope          | Limit                |
| -------------- | -------------------- |
| Global         | 10 req / 60s        |
| Auth register  | 3 req / 60s         |
| Auth login     | 5 req / 60s         |
| Events browse  | 60 req / 60s        |

## Error Handling

All exceptions go through `AllExceptionsFilter` which normalizes messages and maps `ThrottlerException` to user-friendly text. Every request gets an 8-char `X-Request-Id` header for tracing in logs.
