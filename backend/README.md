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
3. In a new query, paste `database/migrations/002_certificate_traceability.sql` and click **Run**.
4. In a new query, paste `database/migrations/003_ivr_sessions.sql` and click **Run** (phone registration sessions).

All three scripts are idempotent (safe to re-run). The base schema creates:

- all tables (profiles, farmers, batches/lots, evidence, quality assessments, collection arrivals, FPO members, marketplace, offers, payments, disputes, notifications, transactions, …)
- `updated_at` triggers and a trigger that creates a `profiles` row for every new auth user
- a storage bucket and row-level security (RLS) policies
- **demo login accounts** (see [Demo accounts](#demo-accounts))

Migration 002 adds:

- database-level role enforcement: sign-up can only create Farmer, Field Helper, Distributor or Retailer accounts, and clients cannot change a role
- batch ownership and lineage columns, so partial purchases create child batches
- the append-only `purchases`, `certificates` and `traceability_events` tables, readable only with the service-role key
- `farmly_purchase_batch()`, which reserves quantity atomically and idempotently

> The base schema ends with a development policy (`dev_all_access`) that lets the public anon key read and write most tables. The certificate tables are excluded from it, but review it before any real deployment.

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
| `SUPABASE_SERVICE_ROLE_KEY` | For certificates | — | Supabase → Project Settings → API → `service_role` key. **Server only.** Without it, certificate endpoints return 503 |
| `ALLOW_DEMO_AUTH`   | No       | `true` unless production | Enables password-less demo logins and `demo_<role>` tokens. Set `false` for shared deployments |
| `PUBLIC_APP_URL`    | No       | `FRONTEND_URL`          | Base URL encoded in QR codes (`<url>/verify/<id>`) |
| `PINATA_JWT`        | For certificates | —               | Pinata → API Keys → JWT. **Server only** |
| `PINATA_GATEWAY_URL`| For private files | —              | Your dedicated gateway, e.g. `name.mypinata.cloud`; needed to open and verify private documents |
| `CERT_MAX_FILE_MB`  | No       | `10`                    | Maximum certificate upload size |
| `CHAIN_RPC_URL`     | For blockchain | —                 | EVM RPC endpoint (local: `http://127.0.0.1:8545`) |
| `CHAIN_ID`          | For blockchain | —                 | `31337` local, `11155111` Sepolia |
| `CERT_REGISTRY_ADDRESS` | For blockchain | —             | Deployed `CertificateRegistry` address (see `contracts/README.md`) |
| `CHAIN_SIGNER_PRIVATE_KEY` | For blockchain | —          | Registrar wallet key. Use a dedicated testnet wallet. **Server only** |
| `CHAIN_EXPLORER_TX_URL` | No | —                         | e.g. `https://sepolia.etherscan.io/tx`, for links in the UI |

`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are also accepted as fallbacks. The server refuses to start if the Supabase values are missing. The server still starts without the certificate settings; those features then report themselves as unavailable or pending and never as verified.

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
| `npm test`           | Build, then run the IVR dialog and service tests (`node --test`, no network or database needed) |

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

1. **A Supabase access token** — returned by `POST /api/v1/auth/login` for real accounts. The user's role is loaded from `public.profiles` (user-editable sign-up metadata is never trusted for privileged roles).
2. **A demo token** — `demo_farmer`, `demo_helper`, `demo_distributor` or `demo_retailer`, only while demo auth is enabled (`ALLOW_DEMO_AUTH`). There are no demo tokens for other roles.

Routes use one of two guards:

- `optionalAuth` — works without a token (falls back to the demo farmer only in demo mode). Used for most `GET` routes.
- `verifyAuth` — validates the token. Without a token it only falls back to the demo farmer in demo mode; otherwise it returns 401.

`requireRoles(...)` restricts a route to specific roles; `admin` always passes.

### Roles

New accounts can only be **Farmer**, **Field Helper**, **Distributor** or **Retailer**. This is enforced by the API (`/auth/signup`) and by the database (sign-up trigger and a role guard on `profiles`), not just by the UI. Existing accounts with legacy roles (FPO, collection center, quality assessor, admin) are kept unchanged and can still sign in with their password.

### Demo accounts

Created by the schema script. Password for all of them: **`Farmly@123`**

| Role              | Email                    |
| ----------------- | ------------------------ |
| Farmer            | `farmer@farmly.demo`     |
| Field Helper      | `helper@farmly.demo`     |
| Distributor       | `distributor@farmly.demo`|
| Retailer          | `retailer@farmly.demo`   |

The schema also seeds legacy-role accounts (`fpo@`, `collection@`, `quality@`, `admin@farmly.demo`), which can sign in with their password but have no demo token.

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

> **Before deploying publicly:** set `ALLOW_DEMO_AUTH=false` (it is off by default when `NODE_ENV=production`). Demo tokens, the no-token fallback and the password-less demo login exist for development only. CORS currently allows any origin (`middleware/cors.ts`); restrict it to `FRONTEND_URL` in production.

---

## Certificates and traceability

Every crop lot (batch) carries an append-only **certificate bucket**:

1. **Farmer origin certificate** — the farmer (or an assisting field helper) uploads a supporting document for an original batch. The backend validates it (PDF/PNG/JPEG/WebP, size limit, file signature), computes the **SHA-256** of the exact bytes, uploads it to **Pinata** (private by default), stores the CID and metadata, then registers the hash and references on the **CertificateRegistry** contract.
2. **Distributor purchase** — a distributor inspects the lot and its certificate, then buys part or all of it. `farmly_purchase_batch()` locks the batch, checks the available quantity and roles, deducts the quantity and creates a **child batch** in one transaction. The backend then generates a JSON **transfer certificate** that references the farmer's certificate, stores it on IPFS and registers it on-chain.
3. **Retailer purchase** — the same flow from a distributor's child batch. The retailer certificate references the distributor certificate and every upstream certificate.

Example: a farmer registers 500 kg. A distributor buys 250 kg (farmer keeps 250 kg). A retailer buys 200 kg of the distributor's 250 kg (distributor keeps 50 kg). Each transfer has its own transaction ID, child batch, certificate and QR code.

**Lifecycle and retries.** A purchase moves through `PURCHASE_CONFIRMED → CERTIFICATE_GENERATED → IPFS_STORED → TRACEABILITY_UPDATED`. If Pinata or the chain is unavailable, the quantity stays reserved for the buyer and the certificate stays **pending**; `POST /purchases/:id/retry` or `POST /certificates/:id/retry` resumes it. Purchases need an `Idempotency-Key` header: repeating a request with the same key returns the original purchase and never deducts twice.

**Append-only.** Certificates and purchases cannot be deleted or have their content changed (enforced by database triggers). Corrections are uploaded as new versions that link to the previous one; revocations are recorded in the database and on-chain while keeping the original proof.

**Verification** (`POST /certificates/:id/verify`) re-downloads the document (or hashes a file you supply), recomputes SHA-256 and compares it with the on-chain record. It reports four separate checks — file integrity, blockchain registration, issuer authenticity and certification validity — and one overall status: `VERIFIED`, `ISSUER_NOT_VERIFIED`, `MISMATCH`, `NOT_REGISTERED`, `PENDING`, `UNAVAILABLE`, `REVOKED` or `EXPIRED`. Farmly does not verify the issuer of an uploaded document, so a valid origin certificate reports `ISSUER_NOT_VERIFIED` unless the platform has independently marked the issuer as verified. Transfer certificates only prove that a transfer was recorded.

**QR codes and privacy.** Every batch, child batch and certificate has a QR code (`GET /traceability/qr/:id`) that encodes only the public page URL `<PUBLIC_APP_URL>/verify/<id>`. The public page shows the journey from farmer to the latest transfer with public-safe fields only: farmer first name and initial, district and state, quantities, dates, hashes and on-chain references. Prices, phone numbers, villages and private documents are never exposed publicly.

### Setting it up

1. Run migration `002_certificate_traceability.sql` (see [Set up the database](#3-set-up-the-database)).
2. Set `SUPABASE_SERVICE_ROLE_KEY`.
3. Set `PINATA_JWT` and `PINATA_GATEWAY_URL`.
4. Deploy the contract (local chain or Sepolia, see `contracts/README.md`) and set the `CHAIN_*` variables and `CERT_REGISTRY_ADDRESS`.
5. Restart the backend.

---

## Phone crop registration (IVR)

Farmers can register a crop lot by phone in 13 Indian languages. A Sarvam AI voice agent asks the questions, reads the details back, and creates the lot through the same lot service as the helper form, only after the farmer confirms. Helpers follow calls, fix failures, and run a free local **call simulator** at `/helper/calls`.

Setup, Twilio webhooks, verified languages, and costs: [src/ivr/README.md](src/ivr/README.md). Conversation script: [src/ivr/conversation-script.md](src/ivr/conversation-script.md).

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
| | `GET /lots/:id/certificate` | 🔓 | Lot with its registered certificates (public-safe) |
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
| Certificates | `POST /certificates/origin` | 🔒 farmer, helper | Upload a farmer origin certificate (`contentBase64`, metadata, `visibility`) |
| | `GET /certificates/:id` | 🔓 | Certificate detail and event history |
| | `GET /certificates/:id/document` | 🔓 | Document link (public gateway URL, or a 5-minute signed URL for private files when signed in) |
| | `POST /certificates/:id/verify` | 🔓 | Verify integrity (optionally against a supplied `contentBase64`) |
| | `POST /certificates/:id/retry` | 🔒 | Resume pending IPFS / blockchain registration |
| | `POST /certificates/:id/revoke` | 🔒 | Revoke (`{ "reason": "…" }`); recorded, never deleted |
| Purchases | `POST /purchases` | 🔒 distributor, retailer | Buy from a batch (`sourceBatchId`, `quantity`, optional `pricePerUnit`). Requires `Idempotency-Key` header |
| | `POST /purchases/:id/retry` | 🔒 buyer | Resume the purchase's certificate steps |
| Traceability | `GET /traceability/batches/:id` | 🔒 | Full certificate chain, transfers and child batches for a batch |
| | `GET /traceability/public/:id` | — | Public-safe product journey for a batch or certificate ID |
| | `GET /traceability/qr/:id` | — | QR code (SVG) pointing to the public page |
| | `GET /traceability/available` | 🔒 | Batches the caller can buy (farmer lots for distributors, distributor stock for retailers) |
| | `GET /traceability/dashboard` | 🔒 | Role-specific dashboard data |
| Phone registration | `POST /ivr/twilio/voice`, `/turn`, `/mobile`, `/dial-status`, `/status` | Twilio signature | Twilio Voice webhooks (TwiML responses) |
| | `GET /ivr/audio/:id.wav` | — | Cached prompt audio for Twilio `<Play>` |
| | `GET /ivr/config` | 🔒 helper | Speech/Twilio configuration and enabled languages |
| | `GET /ivr/sessions`, `GET /ivr/sessions/:id` | 🔒 helper | Call sessions with collected fields, errors, Batch ID and transcript |
| | `POST /ivr/sessions/:id/retry` | 🔒 helper | Retry a confirmed registration that failed (reuses the reserved Batch ID) |
| | `POST /ivr/sim/sessions`, `POST /ivr/sim/sessions/:id/turn` | 🔒 helper | Local call simulator (`callerNumber`; then `text`, `digits`, `audioBase64` or `noInput`) |

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| `ZodError: SUPABASE_URL is required` on start | `.env` is missing or empty — copy `.env.example` to `.env` and fill in the Supabase values. |
| `EADDRINUSE: address already in use :::5000` | Another process uses port 5000. Stop it or set a different `PORT` in `.env` (and update `NEXT_PUBLIC_API_URL` in the frontend). |
| Health check shows `database: error: relation "profiles" does not exist` | The schema has not been applied — run `database/farmly_supabase_schema.sql` in the Supabase SQL Editor. |
| Health check shows `database: error: TypeError: fetch failed` or `unreachable` | Check your internet connection and that `SUPABASE_URL` is correct and the project is not paused. |
| `401 Invalid or expired authorization token` | The Supabase session expired — log in again, or use a `demo_<role>` token during development. |
| Certificate endpoints return `503 ... SUPABASE_SERVICE_ROLE_KEY` | Set the service-role key in `.env` and run migration 002. |
| Certificate upload returns `503 IPFS_UNAVAILABLE` or `502 IPFS_UPLOAD_FAILED` | Check `PINATA_JWT`. Nothing is recorded until Pinata confirms the upload. |
| Certificates stay "Chain registration pending" | Check the `CHAIN_*` variables, that the RPC node is running, and that the signer is a registrar with test ETH; then use **Retry registration**. |
| Purchase returns `409 This batch has no active certificate yet` | The seller must upload a certificate for the batch first. |
| Private document verification shows `UNAVAILABLE` | Set `PINATA_GATEWAY_URL` to your dedicated gateway; private files can only be read through signed URLs. |
