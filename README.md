# Farmly — The Digital Infrastructure for Modern Farming

Farmly is an all-in-one digital platform connecting farmers, buyers, and agricultural services through modern, simple digital infrastructure.

## Monorepo Structure

```text
farmly/
├── frontend/    # Next.js 15 App Router, React 19, TypeScript, Tailwind CSS
├── backend/     # Express + TypeScript REST API (Supabase, Pinata, Sepolia, Sarvam + Twilio phone agent)
├── contracts/   # Solidity: CertificateRegistry (Hardhat) and FarmlyBatchRegistry (lot registry)
└── database/    # Supabase schema and migrations
```

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env    # fill in the Supabase values
npm run dev
```

The API runs at `http://localhost:5000/api/v1`. The full setup is in [`backend/README.md`](./backend/README.md):

- [Database and migrations](./backend/README.md#3-set-up-the-database)
- [Blockchain and IPFS](./backend/README.md#blockchain-and-ipfs): Sepolia wallet, contracts, Pinata, MetaMask
- [Phone registration agent](./backend/README.md#phone-registration-agent-ivr): free simulator, then real calls with Twilio

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1` in `frontend/.env`. The app runs at `http://localhost:3000`.

`npm run dev` compiles each page on first visit (a few seconds). For demos, use a production build, which is much faster: stop the dev server first, then run `npm run build && npm start`.

## Brand Identity

- **Name:** Farmly
- **Tagline:** The Digital Infrastructure for Modern Farming
- **Core Message:** One Digital Platform for Every Farm.
