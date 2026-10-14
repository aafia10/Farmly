# Farmly Backend

REST API for **Farmly — The Digital Infrastructure for Modern Farming**.

Built with **Node.js + Express + TypeScript**, using **Supabase** (PostgreSQL + Auth) as the database. The API is served under `/api/v1` and is consumed by the Next.js app in [`../frontend`](../frontend).

---

## Tech stack

| Layer        | Tool                                   |
| ------------ | -------------------------------------- |
| Runtime      | Node.js (v20+ recommended)             |
| Framework    | Express 4                              |
| Language     | TypeScript 5 (compiled to `dist/`)     |
| Database     | Supabase PostgreSQL (`@supabase/supabase-js`) |
| Auth         | Supabase Auth, plus built-in demo tokens |
| Validation   | Zod (environment variables)            |
| Dev server   | `ts-node-dev` (auto-restart on change) |

---

## Project structure

```
backend/
├── src/
│   ├── server.ts            # Entry point: starts the HTTP server, graceful shutdown
│   ├── app.ts               # Express app: CORS, JSON body parsing, request logging, 404 + error handler
│   ├── config/
│   │   ├── env.ts           # Loads and validates .env with Zod
│   │   └── supabase.ts      # Supabase client (+ per-request authenticated client helper)
│   ├── routes/              # One router per domain, mounted in routes/index.ts
│   ├── controllers/         # Request handlers (query Supabase, shape responses)
│   ├── middleware/
│   │   ├── auth.ts          # verifyAuth / optionalAuth + demo users
│   │   ├── roles.ts         # requireRoles(...) role guard
│   │   ├── cors.ts          # CORS configuration
│   │   └── errorHandler.ts  # Centralised error responses
│   ├── mappers/             # Database row → API DTO mappers
│   ├── services/            # Mandi price benchmarks, AgroSathi assistant, certificate hash anchor
│   ├── utils/               # UUID + farmer registry helpers
│   └── types/               # Shared TypeScript types (AuthUser, UserRole, …)
├── .env.example             # Template for environment variables
├── package.json
└── tsconfig.json
```

The database schema and seed data live in [`../database/farmly_supabase_schema.sql`](../database/farmly_supabase_schema.sql).

---

## Getting started

### 1. Prerequisites

- **Node.js 20 or newer** and **npm**
- A **Supabase** project (the free tier is fine) — create one at <https://supabase.com>

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Set up the database

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the full contents of `database/farmly_supabase_schema.sql` and click **Run**.

The script is idempotent (safe to re-run). It creates:

- all tables (profiles, farmers, batches/lots, evidence, quality assessments, collection arrivals, FPO members, marketplace, offers, payments, disputes, notifications, transactions, …)
- `updated_at` triggers and a trigger that creates a `profiles` row for every new auth user
- a storage bucket and row-level security (RLS) policies
- **demo login accounts** for all 8 roles (see [Demo accounts](#demo-accounts))

### 4. Configure environment variables

Copy the template and fill in your Supabase details:

```bash
cp .env.example .env
```

| Variable            | Required | Default                 | Description |
| ------------------- | -------- | ----------------------- | ----------- |
| `PORT`              | No       | `5000`                  | Port the API listens on |
| `NODE_ENV`          | No       | `development`           | `development`, `production` or `test` |
| `FRONTEND_URL`      | No       | `http://localhost:3000` | URL of the frontend app |
| `SUPABASE_URL`      | **Yes**  | —                       | Supabase → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | **Yes**  | —                       | Supabase → Project Settings → API → `anon` public key |

`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are also accepted as fallbacks. The server refuses to start if the Supabase values are missing.

> Never commit `.env` — it is already listed in `.gitignore`.

### 5. Run the development server

```bash
npm run dev
```

You should see:

```
🌾 Farmly Digital Agriculture REST API Backend
📡 Server running on http://localhost:5000
🩺 Health check: http://localhost:5000/api/v1/health
```

### 6. Verify it works

```bash
curl http://localhost:5000/api/v1/health
```

A healthy response includes `"status": "healthy"` and `"database": "connected"`. If `database` shows `error: …` or `unreachable: …`, re-check `SUPABASE_URL` / `SUPABASE_ANON_KEY` and that the schema script ran successfully.

---

## Running with the frontend

From the **repository root** you can start the backend and frontend together:

```bash
npm install
npm run dev
```

This uses `concurrently` to run both apps (`npm run dev:backend` or `npm run dev:frontend` start just one).

The frontend finds the API through `NEXT_PUBLIC_API_URL` in `frontend/.env`. If that is not set, it uses `http://<current-host>:5000/api/v1`, so the default backend port works without extra configuration.

---

## Available scripts

| Command              | What it does |
| -------------------- | ------------ |
| `npm run dev`        | Start the API with auto-reload (`ts-node-dev`) |
| `npm run build`      | Compile TypeScript from `src/` into `dist/` |
| `npm start`          | Run the compiled server (`node dist/server.js`) — run `npm run build` first |
| `npm run type-check` | Type-check without emitting files |

### Production build

```bash
npm run build
NODE_ENV=production npm start
```

---

## Authentication

Send a bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

The token can be:

1. **A Supabase access token** — returned by `POST /api/v1/auth/login` for real accounts. The user's role and profile are loaded from `public.profiles`.
2. **A demo token** — `demo_<role>`, e.g. `demo_farmer`, `demo_helper`, `demo_admin`. Maps to a built-in demo user for that role.

Routes use one of two guards:

- `optionalAuth` — works without a token (falls back to the demo farmer). Used for most `GET` routes.
- `verifyAuth` — validates the token when one is supplied. Used for `POST` / `PUT` / `PATCH` routes.

`requireRoles(...)` restricts a route to specific roles; `admin` always passes.

### Demo accounts

Created by the schema script. Password for all of them: **`Farmly@123`**

| Role              | Email                    |
| ----------------- | ------------------------ |
| Farmer            | `farmer@farmly.demo`     |
| Helper            | `helper@farmly.demo`     |
| FPO               | `fpo@farmly.demo`        |
| Collection center | `collection@farmly.demo` |
| Quality assessor  | `quality@farmly.demo`    |
| Distributor       | `distributor@farmly.demo`|
| Retailer          | `retailer@farmly.demo`   |
| Admin             | `admin@farmly.demo`      |

Example login:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"helper@farmly.demo","password":"Farmly@123"}'
```

Quick demo login without a password (returns a `demo_<role>` token):

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"role":"helper"}'
```

> **Before deploying publicly:** demo tokens, the no-token fallback to the demo farmer, and the password-less demo login exist for development and demos. Disable or gate them for production, since a `demo_admin` token grants admin access. CORS currently allows any origin (`middleware/cors.ts`); restrict it to `FRONTEND_URL` in production.

---

## API reference

Base URL: `http://localhost:5000/api/v1`

Responses use the shape `{ "success": true, "data": … }` on success and `{ "success": false, "message": "…" }` on error.

🔓 = token optional (`optionalAuth`) · 🔒 = `verifyAuth`

| Area | Method & path | Auth | Description |
| ---- | ------------- | ---- | ----------- |
| Health | `GET /health` | — | Service and database status |
| Auth | `POST /auth/signup` | — | Register a new user |
| | `POST /auth/login` | — | Log in (email + password, or demo `role`) |
| | `GET /auth/me` | 🔒 | Current user |
| | `PUT /auth/profile` | 🔒 | Update current user's profile |
| Farmers | `GET /farmers` | 🔓 | List farmers |
| | `GET /farmers/:id` | 🔓 | Farmer details |
| | `POST /farmers` | 🔒 | Register a farmer |
| Crop availability | `GET /crop-availability` | 🔓 | List standing-crop forecasts |
| | `POST /crop-availability` | 🔒 | Add a forecast |
| Lots | `GET /lots` | 🔓 | List lots |
| | `GET /lots/:id` | 🔓 | Lot details |
| | `POST /lots` | 🔒 | Create a lot |
| | `PATCH /lots/:id/status` | 🔒 | Update lot status |
| | `GET /lots/:id/lineage` | 🔓 | Lot lineage tree (splits / merges) |
| | `GET /lots/:id/certificate` | 🔓 | Lot certificate with hash anchor |
| Evidence | `GET /evidence` | 🔓 | List evidence items |
| | `POST /evidence` | 🔒 | Add evidence |
| | `PATCH /evidence/:id/status` | 🔒 | Verify / reject evidence |
| Quality | `GET /quality/assessments` | 🔓 | List quality assessments |
| | `POST /quality/assessments` | 🔒 | Record an assessment |
| Collection | `GET /collection/arrivals` | 🔓 | List collection-center arrivals |
| | `POST /collection/arrivals` | 🔒 | Record an arrival / weighment |
| FPO | `GET /fpo/members` | 🔓 | FPO members |
| | `GET /fpo/mixed-lots` | 🔓 | Pooled (mixed) lots |
| | `POST /fpo/mixed-lots` | 🔒 | Create a pooled lot |
| Marketplace | `GET /marketplace` | 🔓 | Marketplace listings |
| Offers | `GET /offers` | 🔓 | List offers |
| | `GET /offers/:id` | 🔓 | Offer details |
| | `POST /offers` | 🔒 | Create an offer |
| | `POST /offers/:id/accept` | 🔒 | Accept an offer |
| | `POST /offers/:id/reject` | 🔒 | Reject an offer |
| Payments | `GET /payments` | 🔓 | List payments |
| | `GET /payments/:id` | 🔓 | Payment details |
| | `PATCH /payments/:id/stage` | 🔒 | Advance a payment stage |
| Disputes | `GET /disputes` | 🔓 | List disputes |
| | `GET /disputes/:id` | 🔓 | Dispute details |
| | `POST /disputes` | 🔒 | Raise a dispute |
| | `PATCH /disputes/:id/status` | 🔒 | Update dispute status |
| Transactions | `GET /transactions` | 🔓 | Transaction history |
| Notifications | `GET /notifications` | 🔓 | List notifications |
| | `PATCH /notifications/:id/read` | 🔒 | Mark one as read |
| | `POST /notifications/read-all` | 🔒 | Mark all as read |
| Helper | `GET /helper/activities` | 🔓 | Field helper activity log |
| | `POST /helper/activities` | 🔒 | Log an activity |
| Admin | `GET /admin/alerts` | 🔓 | Admin alerts |
| | `PATCH /admin/alerts/:id/resolve` | 🔒 | Resolve an alert |
| Mandi | `GET /mandi/benchmarks` | — | MSP / APMC price benchmarks (static data) |
| AgroSathi | `POST /agrosathi/query` | 🔓 | Rule-based farmer assistant (`{ "query": "…" }`) |

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| `ZodError: SUPABASE_URL is required` on start | `.env` is missing or empty — copy `.env.example` to `.env` and fill in the Supabase values. |
| `EADDRINUSE: address already in use :::5000` | Another process uses port 5000. Stop it or set a different `PORT` in `.env` (and update `NEXT_PUBLIC_API_URL` in the frontend). |
| Health check shows `database: error: relation "profiles" does not exist` | The schema has not been applied — run `database/farmly_supabase_schema.sql` in the Supabase SQL Editor. |
| Health check shows `database: error: TypeError: fetch failed` or `unreachable` | Check your internet connection and that `SUPABASE_URL` is correct and the project is not paused. |
| `401 Invalid or expired authorization token` | The Supabase session expired — log in again, or use a `demo_<role>` token during development. |
