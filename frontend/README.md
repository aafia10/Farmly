# Farmly Frontend — The Digital Infrastructure for Modern Farming

The frontend for **Farmly**, an accessible, production-ready web application built to connect farmers, buyers, agricultural service providers, and supply-chain partners through unified digital infrastructure.

---

## Tech Stack

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/)
- **UI Library:** [React 19+](https://react.dev/)
- **Language:** [TypeScript 5+](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Component Pattern:** [shadcn/ui](https://ui.shadcn.com/) inspired reusable modular components
- **Icons:** [Lucide React](https://lucide.dev/)
- **Motion & Micro-interactions:** [Framer Motion](https://www.framer.com/motion/)
- **Form Management:** [React Hook Form](https://react-hook-form.com/)
- **Validation:** [Zod](https://zod.dev/)
- **Code Quality:** ESLint with Next.js Core Web Vitals config

---

## Brand Design System

Farmly uses a restrained, high-contrast dark green agricultural palette engineered for optimal outdoor visibility and non-technical user comfort:

| Token | Hex / Value | Purpose |
| :--- | :--- | :--- |
| **Background** | `#050806` | Deep neutral base preventing glare |
| **Dark Green** | `#0B3D2E` | Deep agricultural accent & gradients |
| **Primary Green** | `#145C43` | Primary brand buttons and badges |
| **Accent Green** | `#2F8F68` | Focus rings, active states, indicators |
| **Dark Surface** | `#0B120F` | Cards and modular panels |
| **Elevated Surface** | `#121C18` | Hover states and inputs |
| **White** | `#FFFFFF` | High-contrast readable typography |
| **Muted White** | `#D1D5DB` | Secondary text & descriptive copy |
| **Border** | `rgba(255,255,255,0.10)` | Subtle borders without visual clutter |

---

## Directory Architecture

```text
frontend/
├── app/
│   ├── page.tsx            # High-conversion responsive landing page
│   ├── login/
│   │   └── page.tsx        # Authentication sign-in with Zod validation
│   ├── signup/
│   │   └── page.tsx        # Multi-role registration with strength meter
│   ├── globals.css         # Theme tokens, base styles, reduced-motion rules
│   └── layout.tsx          # Root layout, metadata & Inter font configuration
│
├── components/
│   ├── ui/                 # Core primitive atoms (Button, Card, Badge)
│   ├── common/             # Logo, SectionHeading
│   ├── navigation/         # Responsive sticky Navbar & Footer
│   ├── landing/            # Hero, TrustStrip, HowItWorks, Features, Ecosystem, WhyFarmly, CTASection
│   └── auth/               # AuthLayout, AuthInput, PasswordInput, PasswordStrength, AuthButton, FormError, RoleSelector
│
├── hooks/
│   └── use-reduced-motion.ts # OS-level accessibility animation preference hook
│
├── lib/
│   ├── api/
│   │   ├── client.ts       # Typed API abstraction placeholder (simulated latency)
│   │   └── types.ts        # API response contracts
│   ├── constants.ts        # Data-driven arrays (features, categories, steps, roles)
│   ├── validation.ts       # Zod schemas for login & signup
│   └── utils.ts            # Class merging utility (clsx + tailwind-merge)
│
├── types/
│   └── index.ts            # Centralized TypeScript interfaces
│
├── .env.example            # Environment variable template
└── README.md               # Frontend documentation
```

---

## Getting Started

### Prerequisites

- Node.js 18.18+ or 20+ (Tested on Node 22+)
- npm 9+ or pnpm 8+

### 1. Installation

From the `frontend/` directory, install dependencies:

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 3. Development Server

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Quality & Build Checks

To verify TypeScript types:

```bash
npm run type-check
```

To run ESLint:

```bash
npm run lint
```

To create a production build:

```bash
npm run build
```

---

## Security & Architectural Decisions

1. **Zero Hardcoded Secrets:** No secrets, API keys, or database credentials exist in the client codebase.
2. **Abstracted Backend Integration (`lib/api/`):** Login and registration forms interact with an abstraction layer that simulates server response time. When backend microservices are ready, swap the mock response with real `fetch()` calls to `NEXT_PUBLIC_API_URL`.
3. **Strict Validation:** Forms enforce field validation on blur/submit via Zod schemas, verifying email format, 10-digit mobile formatting, password strength criteria, matching confirmation passwords, and terms acceptance.
4. **Accessible by Design (WCAG 2.2 AA):**
   - Minimum 44px touch targets on mobile
   - Visible high-contrast focus rings (`focus-visible`)
   - ARIA attributes for expanded menus, invalid states, and strength meters
   - Full support for `prefers-reduced-motion`

---

## Future Route Expansion

The frontend architecture is prepared for the following upcoming routes:

- `/dashboard` — Unified command center for growers
- `/farmer` — Profile, land holdings, soil records
- `/buyer` — Procurement orders, bids, supplier tracking
- `/distributor` — Regional fleet & storage management
- `/retailer` — Inventory & input dispatch
- `/marketplace` — Live agricultural commodity trading
- `/assets` — Multi-domain tracking (Crops, Dairy, Livestock, Poultry, Fisheries)
- `/transactions` — Verifiable digital receipts & payments
- `/traceability` — Farm-to-fork provenance verification
- `/agrosathi` — Vernacular voice advisory and weather forecasts
- `/admin` — System governance & compliance audit
