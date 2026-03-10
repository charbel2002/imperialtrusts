# BankVault — Development Manifest

> **Project:** Lotus Group Banking Platform (BankVault)  
> **Stack:** Next.js 14.2.35 · TypeScript · Prisma ORM · MySQL · NextAuth v4 · Tailwind CSS  
> **Repository:** `charbel2002/lotusgroup` — branch `master`  
> **Date:** March 10, 2026  
> **Latest commit:** `8e5a80b`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Feature 1 — Build Fixes](#2-feature-1--build-fixes)
3. [Feature 2 — Email Notification System](#3-feature-2--email-notification-system)
4. [Feature 3 — Vercel Blob Storage for KYC Uploads](#4-feature-3--vercel-blob-storage-for-kyc-uploads)
5. [Feature 4 — Transaction Progress Tracker](#5-feature-4--transaction-progress-tracker)
6. [Feature 5 — Enhanced Finalizing UX](#6-feature-5--enhanced-finalizing-ux)
7. [Feature 6 — Admin Transaction Management](#7-feature-6--admin-transaction-management)
8. [File Reference Map](#8-file-reference-map)
9. [Environment Variables](#9-environment-variables)
10. [Deployment Notes](#10-deployment-notes)
11. [Commit Log](#11-commit-log)

---

## 1. Project Overview

BankVault is a full-stack banking platform with:

- **Public site** — multi-language (10 locales), loan simulator, contact form
- **User dashboard** — accounts, cards, beneficiaries, transfers, KYC verification, notifications
- **Admin panel** — user management, transaction oversight, KYC review, card/loan management, credit/debit operations, system settings, audit logs

The platform supports a **transaction lock system** where admins can place security checkpoints at specific percentages along a transfer's progress. Users must enter a security code to pass each lock. This is the core workflow the platform is designed around.

---

## 2. Feature 1 — Build Fixes

| | |
|---|---|
| **Commit** | `18296bf` |
| **Problem** | Initial codebase had TypeScript and build errors preventing `npm run build` from completing. |
| **Solution** | Fixed type errors, missing imports, and configuration issues across the project. |
| **Files** | Various across `src/` |

---

## 3. Feature 2 — Email Notification System

| | |
|---|---|
| **Commits** | `8b370c1`, `666099b` |
| **Branch** | `feat/email-notification` (merged to `master`) |

### What was built

A comprehensive email notification system with **23 exported functions** in `src/lib/email.ts`:

- `sendEmail` — core SMTP transport using nodemailer
- `wrapHtml` — branded HTML template wrapper (BankVault logo, footer, consistent styling)

### Email templates by module

#### Authentication (`src/actions/auth.ts`)
| Function | Trigger |
|---|---|
| `sendWelcomeEmail` | User registers a new account |
| `sendNewUserAdminNotice` | Admin is notified of a new registration |

#### Loans (`src/actions/loans.ts`)
| Function | Trigger |
|---|---|
| `sendLoanApplicationConfirmation` | User submits a loan application |
| `sendLoanApplicationAdminNotice` | Admin is notified of new loan application |
| `sendLoanApprovedEmail` | Admin approves a loan |
| `sendLoanRejectedEmail` | Admin rejects a loan |

#### KYC (`src/actions/kyc.ts`)
| Function | Trigger |
|---|---|
| `sendKycSubmittedEmail` | User submits KYC documents |
| `sendKycSubmittedAdminNotice` | Admin is notified of new KYC submission |
| `sendKycApprovedEmail` | Admin approves KYC |
| `sendKycRejectedEmail` | Admin rejects KYC (with reason) |

#### Transactions (`src/actions/transactions.ts`)
| Function | Trigger |
|---|---|
| `sendTransferInitiatedEmail` | User initiates a transfer |
| `sendTransferApprovedEmail` | Admin approves a transfer |
| `sendTransferRejectedEmail` | Admin rejects a transfer (with reason) |
| `sendTransferCompletedEmail` | Transfer completes (all locks resolved, progress 100%) |

#### Accounts (`src/actions/accounts.ts`)
| Function | Trigger |
|---|---|
| `sendAccountStatusEmail` | Admin changes account status (active/frozen/closed) |
| `sendAccountCreditedEmail` | Admin credits an account |
| `sendAccountDebitedEmail` | Admin debits an account |

#### Cards (`src/actions/cards.ts`)
| Function | Trigger |
|---|---|
| `sendCardCreatedEmail` | User creates a new card |
| `sendCardCancelledEmail` | User cancels a card |
| `sendCardFreezeToggleEmail` | Admin freezes or unfreezes a card |

#### Contact (`src/actions/contact.ts`)
| Function | Trigger |
|---|---|
| `sendContactConfirmationEmail` | Visitor submits the contact form |
| `sendContactAdminNotice` | Admin receives the contact form message |

### Design decisions
- All email sends are fire-and-forget with try/catch — a failed email never breaks the main action flow
- Every template uses `wrapHtml()` for consistent branded styling
- nodemailer transport created per-send (stateless)

---

## 4. Feature 3 — Vercel Blob Storage for KYC Uploads

| | |
|---|---|
| **Commits** | `77dfe2b`, `5f3798c`, `2dbc983`, `c58a470` |
| **Branch** | `feat/vercel-blob` (merged to `master`) |

### Problem

KYC document uploads used the local filesystem (`public/uploads/kyc/`). Vercel's production filesystem is read-only, so uploads fail in production.

### Solution — Dual-mode upload

**File:** `src/app/api/upload/route.ts`

| Environment | Storage | How it works |
|---|---|---|
| **Development** (no `BLOB_READ_WRITE_TOKEN`) | Local filesystem | Writes to `public/uploads/kyc/{userId}/` |
| **Production** (token set) | Vercel Blob (public access) | Uses `@vercel/blob` `put()` with `access: "public"`, returns a direct URL |

### Evolution (4 iterations)

1. **`77dfe2b`** — Initial dual-mode implementation
2. **`5f3798c`** — Fixed falsy empty-string token detection on Vercel; added explicit error when running on Vercel without a configured blob store
3. **`2dbc983`** — Switched to private blob access with a proxy serve route (`/api/upload/serve`) that generated temporary download URLs
4. **`c58a470`** — **Final:** Switched back to public blob access. Public blobs return direct URLs that work in `<img>` tags without a proxy. Removed the serve route. Simpler and faster.

### Deployment requirement
Users must create a **public** Vercel Blob store on the Vercel dashboard and set `BLOB_READ_WRITE_TOKEN` in environment variables.

---

## 5. Feature 4 — Transaction Progress Tracker

| | |
|---|---|
| **Commits** | `af6c4bd`, `7e19abe`, `d73311b`, `35404a9`, `df7b2a2` |

This was the most complex feature, requiring **6 iterations** to get right.

### What it does

**File:** `src/components/dashboard/transaction-progress-tracker.tsx`

When a transfer is approved and has locks, the user sees an animated progress bar that advances from 0% to 100%. At each lock checkpoint, the bar pauses and the user must enter a security code to continue. When it reaches 100%, the transfer completes.

### Architecture (final — tick-based model)

```
setInterval(500ms) → +1% per tick → save to DB → check next checkpoint
                                                   ├─ checkpoint hit → pause, show LockResolver
                                                   ├─ 100% reached → handleComplete()
                                                   └─ normal → continue
```

**Key design:**
- `setInterval` at 500ms, incrementing exactly 1% per tick (deterministic speed)
- `findNextCheckpoint()` — computes the next unresolved lock strictly ahead of current progress
- `getInitialLockState()` — synchronously determines if we should be paused on mount (handles page reload)
- `completingRef` — guard so `handleComplete` fires exactly once
- CSS transition `duration-500` matches the tick interval for smooth visual
- 0→100 with no locks = 50 seconds (100 ticks × 500ms)

### Iteration history

#### Iteration 1 — `af6c4bd` — Fix initial latency
**Problem:** Progress bar would flash forward then snap back when hitting a lock because the initial paused state was computed in a `useEffect` (asynchronous), not before the first render.  
**Fix:** Memoized `sortedLocks`, used `useRef` for locks inside animation loop, computed initial paused/currentLock synchronously via lazy `useState` initializers.

#### Iteration 2 — `7e19abe` — 1% save granularity
**Problem:** Progress was saved to DB at 5% milestones only. If a lock sat at 32% and the user resolved it, the DB still held 30%. A page refresh would rewind behind the resolved lock.  
**Fix:** Save progress at every 1% advance.

#### Iteration 3 — `d73311b` — Comprehensive hardening
**Problems:**
- Animation loop queued an extra `requestAnimationFrame` after a lock hit or 100%, causing 0.3% overshoot stutter
- `handleComplete` could fire twice, causing a duplicate server call and brief error flash
- Admin could place a lock behind the user's current progress

**Fixes:**
- `shouldStopRef` — animation loop stops immediately on lock hit
- `completingRef` — `handleComplete` fires exactly once
- Server guard: `updateTransactionProgress` only writes if new value > current DB progress
- Server guard: `adminAddTransactionLock` rejects if `percentage <= txn.progress`
- Admin lock slider changed to `step=1` (was `step=5`) with `min = max(maxLock, progress) + 1`
- Reverted to 5% milestone saves to reduce DB writes

#### Iteration 4 — `35404a9` — Revert to 1% saves
**Problem:** With 5% milestone saves, the DB could lag up to 4% behind the client. An admin could insert a lock into that gap (e.g. DB=25%, client=27%, admin adds lock at 26%) and the client would never see it.  
**Fix:** Reverted to 1% saves. The server guard `percentage <= txn.progress` depends on accurate DB progress.

#### Iteration 5 — `df7b2a2` — Complete rewrite to tick-based model
**Problem:** `requestAnimationFrame` runs at the monitor's refresh rate (60–144+ fps). Progress speed varied by device. The 0.3%/frame increment was hard to reason about, and save-at-every-1% with rAF caused excessive DB writes.  
**Fix:** Complete rewrite:
- Replaced `requestAnimationFrame` with `setInterval(500ms)`
- Exactly +1% per tick — deterministic, device-independent
- Each tick saves to DB (100 writes total, manageable)
- `findNextCheckpoint()` target model — cleaner than checking all locks each frame
- Removed: `shouldStopRef`, `speedRef`, `saveProgress`, `sortedLocks` memo
- CSS transition 500ms matches tick interval

### Server-side guards (`src/actions/transactions.ts`)

| Guard | Location | What it does |
|---|---|---|
| Monotonic progress | `updateTransactionProgress` | Only writes if `clampedProgress > txn.progress` |
| Lock-vs-progress | `adminAddTransactionLock` | Rejects if `percentage <= txn.progress` |
| Lock-vs-lock | `adminAddTransactionLock` | Rejects if `percentage <= maxExistingLock` |

### Sub-component: `LockResolver`

An inline form that appears when the progress bar pauses at a lock:
- Shows lock motif (reason), percentage
- Input field for security code with `Key` icon
- Auto-focuses the input on mount
- Validates via `resolveTransactionLock` server action
- On success, resumes animation from the checkpoint

---

## 6. Feature 5 — Enhanced Finalizing UX

| | |
|---|---|
| **Commit** | `13ef541` |

### Before
When the progress bar hit 100%, the user saw a tiny one-line "Transaction processing..." text while the server completed the transfer.

### After
**Finalizing overlay** (when completing):
- Full-width card with gradient background (`emerald-50` to white)
- Spinning SVG animation
- "Securing Your Transfer" title + "Verifying details and processing your payment…" subtitle
- Staggered bouncing dots animation
- 800ms delay after server confirms success so the user registers the finalizing state

**Success view** (after completion):
- `animate-fade-in-up` entrance animation
- Party icon with bounce animation (2 iterations)
- Emerald checkmark badge overlay
- Transfer details: amount, beneficiary, reference
- Email confirmation notice
- Full progress bar at 100%

---

## 7. Feature 6 — Admin Transaction Management

| | |
|---|---|
| **Commit** | `2fa819d` / `8e5a80b` |

### Files modified
- `src/components/admin/admin-transaction-actions.tsx` — full rewrite
- `src/app/admin/transactions/page.tsx` — updated props

### Problems with old version
1. **Dead `done` state** — after any action (approve/reject/lock), the component rendered static text like "Approved" and couldn't perform further actions without a page reload
2. **Icon-only ghost buttons** — barely visible, no labels, unclear hierarchy
3. **No lock visibility** — admin couldn't see existing locks, their codes, or resolved status
4. **Tiny error text** — `text-[9px]` and `text-[10px]` inline errors, easy to miss
5. **Incomplete data** — only `maxLockPercentage` was passed, not the full locks array

### What was built

**Action chaining via local state:**
- `status` tracked locally — after approve, it updates to `PROCESSING` or `COMPLETED`
- `locks` array tracked locally — after adding a lock, it appends to the array
- Admin can approve → then add a lock → without any page reload

**Labeled action buttons with clear hierarchy:**
| Button | Style | Visibility |
|---|---|---|
| **Approve** | Solid emerald green | Only when `PENDING` |
| **Reject** | Red outline | When `PENDING` or `PROCESSING` |
| **Lock** | Amber outline | When `PENDING`, `INITIALIZED`, or `PROCESSING` |

Terminal statuses (`COMPLETED`, `REJECTED`, `CANCELLED`) show "No actions available".

**Expandable lock list panel:**
- Toggle: "N locks (X/N resolved)" with chevron
- Each lock shows:
  - Percentage pill (emerald if resolved, amber if pending)
  - Motif text (truncated with tooltip)
  - Security code with **click-to-copy** button (shows ✓ "Copied" for 2s)
  - Resolved/Pending badge
- Auto-expands after adding a new lock

**Color-coded action panels:**
- Reject form: red-tinted background, red borders, red focus rings
- Lock form: amber-tinted background, amber borders, amber focus rings

**Prominent dismissible error alerts:**
- Red banner with `AlertTriangle` icon
- Dismissible via X button
- Appears at the top of the component, not inline with buttons

**Full locks data:**
- Admin page now passes the complete locks array (`id`, `motif`, `securityCode`, `percentage`, `isResolved`, `createdAt`) instead of just `maxLockPercentage`

---

## 8. File Reference Map

### Core infrastructure
| File | Purpose |
|---|---|
| `src/lib/email.ts` | Email service — 23 functions (1 transport + 1 wrapper + 21 templates) |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/auth.ts` | NextAuth configuration |
| `src/lib/admin-session.ts` | Admin session helper |
| `src/lib/utils.ts` | Utilities (`formatCurrency`, `timeAgo`, `cn`, etc.) |
| `src/lib/validations.ts` | Zod validation schemas |
| `src/lib/i18n.ts` | Internationalization configuration |
| `src/lib/dictionary.ts` | Locale dictionary loader |
| `src/middleware.ts` | Auth + locale middleware |

### Server actions
| File | Handles |
|---|---|
| `src/actions/auth.ts` | Registration, login, password reset |
| `src/actions/transactions.ts` | Transfers, locks, progress, admin approve/reject |
| `src/actions/accounts.ts` | Account status, credit/debit |
| `src/actions/cards.ts` | Card creation, cancellation, freeze |
| `src/actions/kyc.ts` | KYC submission, admin review |
| `src/actions/loans.ts` | Loan application, admin approve/reject |
| `src/actions/beneficiaries.ts` | Beneficiary CRUD |
| `src/actions/contact.ts` | Contact form |
| `src/actions/notifications.ts` | Notification management |
| `src/actions/settings.ts` | Platform settings |

### Key components
| File | Purpose |
|---|---|
| `src/components/dashboard/transaction-progress-tracker.tsx` | Animated progress bar with lock checkpoints |
| `src/components/dashboard/transfer-form.tsx` | Transfer initiation form |
| `src/components/admin/admin-transaction-actions.tsx` | Admin transaction actions (approve/reject/lock) |
| `src/components/admin/credit-debit-form.tsx` | Admin credit/debit form |
| `src/components/admin/kyc-review-actions.tsx` | Admin KYC review actions |
| `src/components/admin/admin-card-actions.tsx` | Admin card management |
| `src/components/admin/admin-loan-actions.tsx` | Admin loan management |

### Upload
| File | Purpose |
|---|---|
| `src/app/api/upload/route.ts` | Dual-mode upload (Vercel Blob / local filesystem) |

---

## 9. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `NEXTAUTH_SECRET` | ✅ | NextAuth session encryption key |
| `NEXTAUTH_URL` | ✅ | Canonical site URL |
| `SMTP_HOST` | ✅ | SMTP server host (e.g. `localhost`) |
| `SMTP_PORT` | ✅ | SMTP server port (e.g. `1025`) |
| `SMTP_USER` | ⬜ | SMTP username (if required) |
| `SMTP_PASS` | ⬜ | SMTP password (if required) |
| `MAIL_FROM` | ✅ | Sender address (e.g. `noreply@bankvault.com`) |
| `ADMIN_EMAIL` | ✅ | Admin notification recipient |
| `BLOB_READ_WRITE_TOKEN` | ⬜ prod | Vercel Blob store token (production only) |

---

## 10. Deployment Notes

### Vercel Blob Storage
1. Go to Vercel Dashboard → Storage → Create → Blob
2. **Choose "Public" access** (not private)
3. Copy the `BLOB_READ_WRITE_TOKEN` to your project's environment variables
4. Existing KYC uploads on the filesystem will not be migrated — users will need to re-upload

### SMTP in Production
Replace the development SMTP server (`localhost:1025`) with a production provider:
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` accordingly
- Common providers: SendGrid, Mailgun, AWS SES, Resend

### Database
- Run `npx prisma db push` or `npx prisma migrate deploy` on first deploy
- Seed with `npx prisma db seed` if needed

---

## 11. Commit Log

| # | Hash | Type | Summary |
|---|---|---|---|
| 1 | `2612988` | init | First commit — full project scaffold |
| 2 | `18296bf` | fix | Build errors resolved |
| 3 | `8b370c1` | feat | Email service + loan email templates |
| 4 | `666099b` | feat | Email wired across all 8 action modules (21 templates) |
| 5 | `77dfe2b` | feat | Vercel Blob storage for KYC uploads |
| 6 | `5f3798c` | fix | Detect Vercel env, require valid blob token |
| 7 | `2dbc983` | fix | Private blob access with proxy serve route |
| 8 | `c58a470` | fix | Switch to public blob access, remove proxy |
| 9 | `af6c4bd` | fix | Progress tracker latency — synchronous initial state |
| 10 | `7e19abe` | fix | Progress saved at every 1% instead of 5% |
| 11 | `d73311b` | fix | Comprehensive hardening — overshoot, double-fire, server guards |
| 12 | `35404a9` | fix | Revert to 1% saves to close admin lock-placement gap |
| 13 | `df7b2a2` | refactor | Complete rewrite to tick-based model (`setInterval` 500ms) |
| 14 | `13ef541` | feat | Enhanced finalizing UX — overlay, spinner, animations |
| 15 | `2fa819d` | feat | Admin transaction management — chaining, lock list, labeled buttons |
| 16 | `8e5a80b` | feat | (duplicate push of above) |

---

*Generated on March 10, 2026. This manifest covers all development work from initial commit through commit `8e5a80b`.*
