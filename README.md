# Seat Reservation Platform

A small public seat reservation platform built for a senior engineer technical assessment. Three seats, session-based auth (90-day expiry), atomic seat claiming, idempotent mock payments, and a dark-themed Linkz-branded UI.

**No Docker required** — runs entirely with Node.js and a local SQLite database file.

## Quick start (2 commands)

```bash
npm run setup    # install deps + create database (run once)
npm run dev      # start backend + frontend
```

Open http://localhost:5173

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Frontend |
| http://localhost:3001/health | Health check |
| http://localhost:3001/api/logs | Dev logs |

### Demo credentials

| Email | Password |
|-------|----------|
| `test@example.com` | `password123` |

---

## Prerequisites

- **Node.js 20+** (32-bit or 64-bit supported)

Nothing else to install — no Docker, no PostgreSQL, no external services.

---

## Manual setup (if you prefer step-by-step)

```bash
# 1. Install dependencies
npm install
npm install --prefix backend
npm install --prefix frontend

# 2. Create SQLite database + seed data
cd backend
npm run setup
cd ..

# 3. Run
npm run dev
```

Optional: copy environment file if you want to customize settings:

```bash
cp backend/.env.example backend/.env
```

Default database path: `backend/prisma/dev.db` (created automatically).

---

## Tests

```bash
npm run test
```

Includes an integration test for concurrent seat claiming (race condition).

---

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Login, sets 90-day session cookie |
| POST | `/api/auth/logout` | — | Destroy session |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/seats` | — | List 3 seats + status |
| POST | `/api/reservations/start` | ✓ | Atomically claim seat |
| GET | `/api/reservations/:id` | ✓ | Poll reservation status |
| POST | `/api/payments/mock` | ✓ | Mock payment (1s delay, 5% failure) |
| GET | `/health` | — | Health check |
| GET | `/api/logs` | — | Recent structured logs (dev) |

---

## Project structure

```
seat-reservation-platform/
├── backend/          Express + Prisma + SQLite
├── frontend/         React + Vite + TailwindCSS
├── README.md
└── DECISIONS.md      Architecture trade-offs
```

---

## Environment variables

See `backend/.env.example`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite file path | `file:./dev.db` |
| `SESSION_SECRET` | Session signing secret | (dev fallback) |
| `PORT` | Backend port | `3001` |
| `FRONTEND_URL` | CORS origin | `http://localhost:5173` |
| `NODE_ENV` | Environment | `development` |

---

## Key behaviours

- **Concurrency:** Serializable SQLite transactions prevent double-booking
- **Idempotency:** `payment_intent_id` unique on reservations + payment_attempts
- **Pending expiry:** 10-minute TTL; released on read + background interval
- **Security:** HttpOnly session cookies, rate limits, ownership checks
- **Observability:** Structured in-memory log ring + `/api/logs` endpoint

See [DECISIONS.md](./DECISIONS.md) for detailed trade-offs and production next steps.
