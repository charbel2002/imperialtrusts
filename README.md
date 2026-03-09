# BankVault — Digital Banking Platform (Next.js)

A full-featured digital banking system built with **Next.js 14**, **Prisma ORM**, **NextAuth.js**, and **Tailwind CSS**.

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components, Server Actions)
- **Auth**: NextAuth.js v4 (Credentials provider, JWT strategy)
- **Database**: Prisma ORM + MySQL/MariaDB
- **Styling**: Tailwind CSS with custom design system
- **Validation**: Zod
- **Language**: TypeScript

## What's Built

### Infrastructure
- Complete Prisma schema (11 models, all enums, indexes, relations)
- NextAuth.js with Credentials provider + JWT session
- Middleware for dashboard/admin route protection
- Role-based access control (CLIENT / ADMIN)
- Server Actions for register, contact, loan applications
- Zod validation schemas for all forms
- Utility functions (currency formatting, account generation, loan calculation)

### Public Website (8 pages)
- **Homepage** — Hero with animated card, features grid, how it works, stats, testimonials, CTA
- **Services** — 4 alternating service blocks with illustrations
- **About** — Story, stat grid, company values
- **Contact** — Contact info + interactive form (Server Action)
- **Loan Simulator** — Interactive sliders, real-time calculation, in-page application
- **Legal Notices** / **Privacy Policy** / **Terms of Service**

### Auth (3 pages)
- **Login** — Credentials auth with NextAuth, error handling, redirect
- **Register** — Server Action, auto bank account creation, notification
- **Forgot Password** — Form with simulated reset flow

### Dashboard
- **Overview** — Server Component with real data: balance card, KYC alert, stats, recent transactions
- **Sidebar layout** — Responsive with mobile drawer, active states, user info
- Stub pages for: Transactions, Cards, Beneficiaries, Transfers, KYC, Profile, Notifications

### Admin Backoffice
- **Dark sidebar layout** — Admin-only middleware protection
- Stub pages for: Dashboard, Users, KYC Review, Transactions, Cards, Loans, Settings, Logs

### UI Components
- `Button` — 6 variants, 3 sizes, loading state
- `Input` / `Textarea` — With labels, error states
- `Badge` — 5 variants
- `Alert` — 4 variants
- `Card` / `CardHeader` / `CardBody`

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit DATABASE_URL and NEXTAUTH_SECRET

# 3. Push schema to database
npx prisma db push

# 4. Seed default data
npx prisma db seed

# 5. Start development
npm run dev
```

## Default Accounts

| Role   | Email                | Password |
|--------|----------------------|----------|
| Admin  | admin@bankvault.com  | password |
| Client | client@bankvault.com | password |

## Project Structure

```
src/
├── app/
│   ├── (public)/           # Public website (Navbar + Footer layout)
│   │   ├── page.tsx        # Homepage
│   │   ├── services/       # Services page
│   │   ├── about/          # About page
│   │   ├── contact/        # Contact page
│   │   ├── loan-simulator/ # Interactive loan calculator
│   │   ├── legal/          # Legal notices
│   │   ├── privacy/        # Privacy policy
│   │   └── terms/          # Terms of service
│   ├── (auth)/             # Auth layout (split-screen)
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── dashboard/          # Client dashboard (sidebar layout)
│   │   ├── page.tsx        # Overview with real data
│   │   ├── transactions/
│   │   ├── cards/
│   │   ├── beneficiaries/
│   │   ├── transfers/
│   │   ├── kyc/
│   │   ├── profile/
│   │   └── notifications/
│   ├── admin/              # Admin backoffice (dark sidebar)
│   │   ├── users/
│   │   ├── kyc/
│   │   ├── transactions/
│   │   ├── cards/
│   │   ├── loans/
│   │   ├── settings/
│   │   └── logs/
│   └── api/auth/[...nextauth]/  # NextAuth API route
├── actions/                # Server Actions
│   ├── auth.ts             # Register
│   ├── contact.ts          # Contact form
│   └── loans.ts            # Loan application
├── components/
│   ├── ui/                 # Button, Input, Badge, Alert, Card
│   ├── public/             # Navbar, Footer, ContactForm, LoanSimulator
│   ├── dashboard/          # DashboardShell
│   ├── admin/              # AdminShell
│   └── shared/             # SessionProvider
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma client singleton
│   ├── utils.ts            # Utility functions
│   └── validations.ts      # Zod schemas
├── types/
│   └── next-auth.d.ts      # Session type augmentation
└── middleware.ts            # Route protection

prisma/
├── schema.prisma           # Full database schema
└── seed.ts                 # Seed script
```

## Design System

| Name      | Hex       | Usage              |
|-----------|-----------|--------------------|
| Primary   | `#0A2540` | Headers, CTAs      |
| Secondary | `#1E40AF` | Links, accents     |
| Accent    | `#10B981` | Success, highlights|
| Danger    | `#EF4444` | Errors, destructive|

Fonts: DM Sans (body) + Instrument Sans (headings)

## Next Modules to Build

1. KYC module (submission form + admin review)
2. Bank accounts (admin lock/unlock)
3. Cards (creation, management)
4. Beneficiaries (CRUD)
5. Transactions (initiation, status flow, locks)
6. Admin credit/debit
7. Notifications (in-app + email)
8. Loan applications (admin review)
9. Admin dashboard (stats, charts)
10. System settings management
