# Engineering Decisions

Concise record of trade-offs for the seat reservation platform assessment.

## Stack choices

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | Express 5 + TypeScript | Familiar, fast to ship, large middleware ecosystem |
| ORM | Prisma | Type-safe queries, migrations, no raw SQL for CRUD |
| Database | **SQLite** (file-based) | Zero setup — no Docker or external DB server required |
| Auth | express-session + Prisma session store | Server-side sessions persisted in SQLite, HttpOnly cookies, 90-day maxAge |
| Frontend | React + Vite + Tailwind 4 | Fast dev loop, component model, utility styling |

**Why SQLite over PostgreSQL for this submission?**  
The assessment allows any stack. SQLite gives a one-command local startup (`npm run setup && npm run dev`) with no infrastructure dependencies, while still supporting ACID transactions for concurrency control. In production at scale, I would use PostgreSQL for row-level locking under high write concurrency and managed backups.

**Alternative considered:** JWT with refresh rotation — better for mobile/SPA at scale, but session cookies are simpler for a browser-only demo and map directly to the 90-day requirement.

---

## Concurrency strategy

**Chosen: Serializable transactions (SQLite write lock)**

When a user starts a reservation, the entire claim runs inside a `Serializable` Prisma transaction. SQLite serializes concurrent writers, so two simultaneous claims for the same seat cannot both succeed.

**PostgreSQL equivalent:** Would use `SELECT FOR UPDATE` row-level locking instead — finer-grained under heavy load.

**Why not optimistic locking alone?**  
With only 3 seats and a write-heavy claim path, conflicts are frequent under load. Optimistic locking (`version` column) would cause more user-visible retries. We still increment `seat.version` for auditability.

**Race handled:** Two users calling `POST /api/reservations/start` for the same seat — exactly one succeeds; the other gets `409 Seat is not available`.

---

## Idempotency

**Key:** `payment_intent_id` (UUID) generated at reservation start, stored uniquely on `reservations` and `payment_attempts`.

Flow:

1. First payment call creates a `payment_attempts` row and updates reservation status.
2. Retries find existing attempt and return the same outcome without double-charging or double-confirming.
3. Unique constraint races are caught (`P2002`) and resolved by reading the existing attempt.

This mirrors Stripe's idempotency keys and handles network retries from the frontend.

---

## Session expiry (90 days)

**Implementation:** `express-session` cookie `maxAge: 90 days`, `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production. Session data stored in SQLite via `@quixo3/prisma-session-store`.

**Trade-off:** Long-lived sessions improve UX but increase stolen-cookie risk. Mitigations in production:

- Rotate session ID on login
- Invalidate sessions server-side on password change
- Optional sliding expiry with shorter absolute cap
- Device binding / anomaly detection

For this assessment, 90-day server sessions meet the brief with minimal complexity.

---

## Mock payment

**Behaviour:** 1 second delay, ~5% random failure.

**Why:** Simulates latency and unreliability without external dependencies. Demonstrates:

- Frontend retry UX
- Idempotent backend handling
- Partial failure: seat re-checked before confirm; conflict → `failed` + release

**Production:** Replace with Stripe PaymentIntents webhooks; idempotency via provider key + webhook deduplication table.

---

## Pending reservation expiry

**TTL:** 10 minutes for `pending_payment`.

**Release mechanism:**

1. On-demand when listing seats or fetching a reservation
2. Background interval every 60 seconds

**Missing for production:** Dedicated cron/worker, metrics on expired holds, configurable TTL per event.

---

## Error handling & edge cases

| Scenario | Handling |
|----------|----------|
| Seat taken during payment | Re-check before confirm; mark `failed`, seat freed |
| User logs out mid-flow | Reservation stays pending until TTL; seat not confirmed |
| Expired session mid-flow | API returns 401; frontend redirects to login |
| Payment provider down | Mock fails randomly; user retries (idempotent) |
| Payment succeeded, DB failed | Serializable transaction wraps confirm + attempt insert |

---

## Security

- **Input validation:** Email format, seat ID bounds (1–3), JSON body size limit
- **Authorization:** Reservation endpoints verify `userId` matches session
- **Enumeration:** Seat API shows `available` / `reserved` / `pending` only — no user identity
- **Rate limiting:** Login (20/15min), payment (10/min), general API (120/min)
- **SQL injection:** Prisma parameterized queries only
- **Cookies:** HttpOnly, SameSite=Lax, Secure in production

---

## Observability

In-memory structured log ring (500 entries) with console output. Dev endpoint: `GET /api/logs`.

**Production additions:** OpenTelemetry traces, correlation IDs on reservation/payment flows, alerting on payment failure rate, dashboard for active holds.

---

## Operational readiness

- `GET /health` for load balancers
- `.env.example` documents secrets
- One-command setup: `npm run setup`
- One-command dev: `npm run dev`

**Deployment sketch (Render / Fly.io / AWS):**

1. Managed PostgreSQL (upgrade from SQLite)
2. Backend with `prisma migrate deploy`
3. Frontend static assets on CDN
4. Set `SESSION_SECRET`, `DATABASE_URL`, `FRONTEND_URL`, `NODE_ENV=production`

**Sensitive env vars:** `DATABASE_URL`, `SESSION_SECRET`

---

## What I would add with more time

1. **PostgreSQL migration path** for production row-level locking at scale
2. **Webhook-based payments** with outbox pattern and dead-letter queue
3. **Integration tests** for full login → reserve → pay flow via supertest
4. **E2E tests** (Playwright) for UI polling after payment
5. **Prometheus metrics** — claims, payments, expirations, lock wait time
6. **CI pipeline** — lint, test, migrate check

---

## Frontend UI

Login page follows the provided dark split-card reference (marketing panel + form) with **Linkz** branding (`#589c7f` accent, logo, rounded card). Seat map and mock Stripe-like payment modal complete the reservation flow with status polling after payment submission.
