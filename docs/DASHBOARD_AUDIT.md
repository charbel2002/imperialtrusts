# Dashboard i18n & Quality Audit

> **Scope**: All client-facing dashboard pages, components, auth pages, and shared utilities  
> **Date**: Auto-generated audit  
> **Status**: Mapping only — no changes applied yet

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | 2 | Entire page / component completely hardcoded in English |
| 🟠 High | 6 | Component with 10+ hardcoded strings |
| 🟡 Medium | 5 | Cross-cutting pattern affecting multiple files |
| 🟢 Low | 6 | Isolated 1–3 hardcoded strings |

**Total hardcoded strings estimated: ~130+**

---

## 🔴 CRITICAL — Entire pages hardcoded in English

### C1. `src/app/dashboard/kyc/page.tsx` (181 lines)

The page loads `dict` via `getDictionary(userLang, platform)` but **never uses it**. All `kycPage.*` keys exist in all 10 locale files but are completely ignored. **~30+ hardcoded strings**.

| Line(s) | Hardcoded String | Existing Dict Key |
|---------|-----------------|-------------------|
| 44 | `"KYC Verification"` | `kycPage.title` |
| 45 | `"Verify your identity to unlock all banking features"` | `kycPage.subtitle` |
| 50 | `"KYC verification is currently optional..."` | *(missing key — needs creation)* |
| 63 | `"Identity Verified"` | `kycPage.verifiedTitle` |
| 64 | `"Your KYC verification has been approved..."` | `kycPage.verifiedDesc` |
| 65 | `"Verified"` (Badge) | `common.verified` |
| 69 | `"Verified Information"` | `kycPage.verifiedInfo` |
| 71 | `"Full Legal Name"` | `kycPage.fullName` |
| 72 | `"Date of Birth"` | `kycPage.dob` |
| 73 | `"National ID"` | `kycPage.nationalId` |
| 74 | `"Verified On"` | `kycPage.verifiedOn` |
| 76 | `"Address"` | `kycPage.address` |
| 87 | `"Under Review"` | `kycPage.reviewTitle` |
| 88 | `"Your documents have been submitted..."` | `kycPage.reviewDesc` |
| 89 | `"Pending Review"` (Badge) | *(missing key — needs creation)* |
| 92 | `"Submitted Information"` | `kycPage.submittedInfo` |
| 94-95 | `"Full Legal Name"`, `"Date of Birth"`, `"National ID"` | (same as above) |
| 96 | `"Submitted"` | `kycPage.submitted` |
| 98-99 | `"ID Document"`, `"Selfie"` | `kycPage.idDoc`, `kycPage.selfie` |
| 108 | `"Verification Rejected"` | `kycPage.rejectedTitle` |
| 109 | `"Reason:"` / `"No reason provided"` | *(missing keys — need creation)* |
| 113 | `"Resubmit Your Documents"` | `kycPage.resubmitTitle` |
| 114 | `"Please review the rejection reason..."` | `kycPage.resubmitDesc` |
| 124 | `"Verify Your Identity"` | `kycPage.verifyTitle` |
| 125 | `"Complete KYC verification to unlock..."` | `kycPage.verifyDesc` |
| 128 | `"What you'll need:"` | `kycPage.whatYouNeed` |
| 130-133 | `"Government-issued photo ID"`, `"A clear selfie..."`, `"Your full legal name"`, `"Current residential address"` | `kycPage.need1`–`kycPage.need4` |
| 170 | `"Document uploaded"` (in DocPreview) | *(missing key — needs creation)* |

**Fix**: Replace all hardcoded strings with `dict.kycPage.*` / `dict.common.*` references. Add ~5 missing keys to all 10 locale files.

---

### C2. `src/components/dashboard/notification-bell.tsx` (181 lines)

This client component uses `useDict()` but **never reads any dict keys**. All strings are hardcoded in English.

| Line(s) | Hardcoded String | Suggested Dict Key |
|---------|------------------|--------------------|
| 128 | `"Notifications"` | `dashboardNotifications.title` |
| 133 | `"Mark all read"` | `dashboardNotifications.markAllRead` |
| 146 | `"No notifications"` | `dashboardNotifications.noNotifications` |
| 168 | `"View all notifications →"` | *(new key: `dashboardNotifications.viewAll`)* |

**Fix**: Wire up `useDict()` → `dict.dashboardNotifications.*`. Add 1 missing key (`viewAll`).

---

## 🟠 HIGH — Components with 10+ hardcoded strings

### H1. `src/components/dashboard/transfer-form.tsx` (194 lines)

Uses `useDict()` but only partially. Many strings in the success view, form labels, and summary section are hardcoded.

| Line(s) | Hardcoded String | Existing Dict Key |
|---------|-----------------|-------------------|
| 79 | `"Transfer Submitted"` | `transfersPage.successTitle` |
| 80 | `"Your transfer of {amount} to {name}..."` | `transfersPage.successDesc` |
| 82 | `"Ref: {reference}"` | *(partially exists in `dashboardTransactions`)* |
| 85 | `"New Transfer"` | `transfersPage.newTransfer` |
| 87 | `"View Transactions"` | `transfersPage.viewTransactions` |
| 102 | `"Select Beneficiary"` | `transfersPage.selectBeneficiary` |
| 118 | `"Amount ({currency})"` | `transfersPage.amount` |
| 122 | `"Available:"` | `transfersPage.available` |
| 130 | `"e.g., Invoice payment, Rent, Gift..."` placeholder | *(missing key — needs creation)* |
| 141-143 | Summary: `"To"`, `"Bank"`, `"Amount"` | `transfersPage.to`, `transfersPage.bank`, `transfersPage.amount` |
| 150 | `"Send"` button | `transfersPage.sendBtn` |
| ~110 | `"Amount exceeds available balance"` | *(missing key — needs creation)* |
| ~100 | `"Please select a beneficiary"` | `txnProgress.selectBeneficiary` |

**Fix**: Replace hardcoded strings with `dict.transfersPage.*`. Add ~2 missing keys.

---

### H2. `src/components/dashboard/kyc-form.tsx` (354 lines)

Multi-step KYC form. Step labels are partially keyed (`tk.step1 || "Personal Info"`) but many upload labels, descriptions, validation messages, and buttons are hardcoded.

| Line(s) | Hardcoded String | Existing Dict Key |
|---------|-----------------|-------------------|
| ~step1 buttons | `"Next: Documents"` | *(missing — needs creation)* |
| ~step2 | `"ID Document"` | `kycPage.idDoc` |
| ~step2 | `"Upload a clear photo or scan..."` | `kycPage.idDocDesc` |
| ~step2 | `"Click to upload ID document"` | `kycPage.uploadId` |
| ~step2 | `"JPEG, PNG, WebP, or PDF — Max 5MB"` | `kycPage.fileTypes` |
| ~step2 | `"Uploaded successfully"` | `kycPage.uploaded` |
| ~step2 | `"Selfie Verification"` | `kycPage.selfie` |
| ~step2 | `"Take a clear selfie..."` | `kycPage.selfieDesc` |
| ~step2 | `"Click to upload selfie"` | `kycPage.uploadSelfie` |
| ~step2 | `"JPEG, PNG, or WebP — Max 5MB"` | *(variant of `kycPage.fileTypes`)* |
| ~step2 | `"Next: Review"` / `"Back"` | *(missing / `common.back`)* |
| ~step3 | `"Review Your Information"` | `kycPage.reviewInfo` |
| ~step3 | `"By submitting, you confirm..."` | `kycPage.submitConfirm` (with `{{platformName}}`) |
| ~step3 | `"Submit Verification"` | `kycPage.submitBtn` |
| validation | `"Full legal name is required"` | `validation.fullNameRequired` |
| validation | `"Date of birth is required"` | `validation.dobRequired` |
| validation | `"Address must be at least 5 characters"` | `validation.addressMin` |
| validation | `"National ID is required"` | `validation.nationalIdRequired` |
| validation | `"ID document is required"` | *(missing key — needs creation)* |
| validation | `"Upload failed. Please try again."` | *(missing key — needs creation)* |
| placeholders | `"Full address including city, state..."` | *(missing key — needs creation)* |
| placeholders | `"Passport, national ID, or driver's license number"` | *(missing key — needs creation)* |
| placeholders | `"As it appears on your ID"` | `txnProgress.idPlaceholder` |

**Fix**: Wire up all strings to `dict.kycPage.*`, `dict.validation.*`. Add ~6 missing keys.

---

### H3. `src/components/dashboard/card-actions.tsx` (170 lines)

Card fund/withdraw/freeze actions. Uses no dict at all — every string hardcoded.

| Line(s) | Hardcoded String | Existing Dict Key |
|---------|-----------------|-------------------|
| ~toast | `"Enter a valid amount"` | `txnProgress.enterValidAmount` |
| ~toast | `"${amount} added to card"` | *(missing key)* |
| ~toast | `"${amount} withdrawn to account"` | *(missing key)* |
| buttons | `"Fund"` | `dashboardCards.fund` / `cards.fund` |
| buttons | `"Withdraw"` | `dashboardCards.withdraw` / `cards.withdraw` |
| buttons | `"Freeze"` | `dashboardCards.freeze` / `cards.freeze` |
| buttons | `"Unfreeze"` | `dashboardCards.unfreeze` / `cards.unfreeze` |
| modal | `"Fund Card **** {last4}"` | *(missing key)* |
| modal | `"Available in account:"` | `cards.availableInAccount` |
| modal | `"Add"` | *(missing key)* |
| modal | `"Withdraw to Account"` | `cards.withdrawTo` |
| modal | `"Card balance:"` | `cards.cardBalance` |

**Fix**: Wire up `useDict()` → `dict.cards.*` / `dict.dashboardCards.*`. Add ~4 missing keys.

---

### H4. `src/components/dashboard/create-card-modal.tsx` (145 lines)

Create virtual card modal. Uses no dict — all hardcoded.

| Line(s) | Hardcoded String | Existing Dict Key |
|---------|-----------------|-------------------|
| trigger | `"New Card"` | `dashboardCards.newCard` |
| title | `"Create Virtual Card"` | `dashboardCards.createTitle` |
| success | `"Card Created!"` | `dashboardCards.cardCreated` |
| success | `"Your new {cardType} card is ready."` | *(missing key)* |
| desc | `"Choose your card network..."` | `dashboardCards.createDesc` |
| info | `"Card will be created with $0.00..."` | `dashboardCards.createInfo` |
| button | `"Create Visa/Mastercard Card"` | *(missing key)* |
| labels | `"Visa"`, `"Mastercard"` | *(no translation needed — brand names)* |

**Fix**: Wire up `useDict()` → `dict.dashboardCards.*`. Add ~2 missing keys.

---

### H5. `src/components/dashboard/beneficiary-form-modal.tsx` (160 lines)

Partially keyed (`tb.addTitle || "Add Beneficiary"`) but several placeholders and labels hardcoded.

| Line(s) | Hardcoded String | Existing Dict Key |
|---------|-----------------|-------------------|
| ~label | `"Country"` | `beneficiariesPage.country` |
| placeholder | `"e.g., Chase Bank"` | *(missing key)* |
| placeholder | `"Recipient's account number"` | *(missing key)* |
| placeholder | `"Optional"` (SWIFT) | *(missing key)* |
| select | `"Select country"` | `beneficiariesPage.selectCountry` |
| button | `"Save Changes"` (edit mode) | `beneficiariesPage.saveChanges` |
| array | `COUNTRIES` hardcoded in English | *(systemic — see M5 below)* |

**Fix**: Wire up remaining labels/placeholders to `dict.beneficiariesPage.*`. Add ~3 missing keys.

---

### H6. `src/components/dashboard/bank-card.tsx` (133 lines)

Visual card component. All labels are hardcoded — no dict access at all.

| Line(s) | Hardcoded String | Existing Dict Key |
|---------|-----------------|-------------------|
| 88 | `"FROZEN"` badge text | `cards.frozen` |
| 93 | `"CANCELLED"` badge text | `cards.cancelled` |
| 114 | `"Balance"` label | `cards.balance` |
| 122 | `"Card Holder"` label | `cards.cardHolder` |
| 126 | `"Expires"` label | `cards.expires` |

**Fix**: Accept a `dict` or `labels` prop and use `cards.*` keys. All keys exist.

---

## 🟡 MEDIUM — Cross-cutting patterns

### M1. Transaction type labels — raw DB enum displayed

**Affected files**: `dashboard/page.tsx` (line 140), `transactions/page.tsx` (line 54), `dashboard/transactions/page.tsx`

**Current code**: `txn.type.replace(/_/g, " ")` renders raw enum values in English:
- `TRANSFER` → "TRANSFER"
- `ADMIN_CREDIT` → "ADMIN CREDIT"
- `ADMIN_DEBIT` → "ADMIN DEBIT"
- `CARD_TRANSFER` → "CARD TRANSFER"
- `LOAN_DISBURSEMENT` → "LOAN DISBURSEMENT"
- `DEPOSIT` → "DEPOSIT"
- `WITHDRAWAL` → "WITHDRAWAL"

**Fix**: Create a `transactionTypes` map in locale files with all 7 values, then use `dict.transactionTypes[txn.type] || txn.type`.

---

### M2. Status badges — raw DB enum displayed

**Affected files**: `dashboard/page.tsx`, `transactions/page.tsx`, `cards/page.tsx`, `kyc/page.tsx`

Raw enum values shown as badges with no translation:
- **Transaction**: INITIALIZED, PENDING, LOCKED, PROCESSING, COMPLETED, REJECTED, CANCELLED
- **Card**: ACTIVE, FROZEN, EXPIRED, CANCELLED
- **KYC**: PENDING, APPROVED, REJECTED
- **Account**: ACTIVE, LOCKED, SUSPENDED

**Current dict coverage**: `common.*` has: active, pending, approved, rejected, completed, frozen, locked, suspended, cancelled, verified, notSubmitted  
**Missing from common**: `initialized`, `processing`, `expired`

**Fix**: Add 3 missing status keys to `common` in all 10 locales. Use `dict.common[txn.status.toLowerCase()]` pattern in all badge renders.

---

### M3. `timeAgo()` utility — hardcoded English

**File**: `src/lib/utils.ts` (lines 50–66)

Returns English strings: `"5 minutes ago"`, `"2 hours ago"`, `"just now"`, etc.

**Used in**: `dashboard/page.tsx`, `transactions/page.tsx`, `notification-bell.tsx`, `notification-list.tsx`, + 5 admin files

**Fix**: Either (a) accept a locale param and use `Intl.RelativeTimeFormat`, or (b) replace with a locale-aware helper using the existing `getIntlLocale()` mapping.

---

### M4. `formatCurrency()` utility — hardcoded `"en-US"` locale

**File**: `src/lib/utils.ts` (lines 8–13)

```ts
return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
```

All currency displays (balances, transaction amounts) use US formatting regardless of user's language.

**Used in**: Nearly every dashboard page and component.

**Fix**: Accept an optional `locale` param, use `getIntlLocale(locale)` for proper formatting (`1,234.56` vs `1.234,56` vs `1 234,56`).

---

### M5. `COUNTRIES` array hardcoded in English

**File**: `src/components/dashboard/beneficiary-form-modal.tsx`

Country names are hardcoded in an English array. For French users, countries still appear as "United States", "Germany", etc.

**Fix**: Use `Intl.DisplayNames` with the user's locale to generate localized country names, or add a `countries` dict section.

---

## 🟢 LOW — Isolated hardcoded strings

### L1. `src/components/dashboard/add-beneficiary-button.tsx` (30 lines)
- `"Add Beneficiary"` → use `dict.beneficiariesPage.addBtn`

### L2. `src/components/dashboard/beneficiary-card.tsx` (142 lines)
- `"Bank"` label → use `dict.beneficiariesPage.bank`
- `confirm("Delete beneficiary \"${name}\"?...")` → use `dict.beneficiariesPage.deleteConfirm` (already has `{{name}}` placeholder)

### L3. `src/components/dashboard/transaction-actions.tsx` (110 lines)
- `"Cancel Transaction"` → use `dict.txnPage.cancelBtn`
- `confirm("Cancel this transaction?...")` → use `dict.txnPage.cancelConfirm`
- `"Transaction cancelled."` toast → use `dict.txnPage.cancelled`

### L4. `src/components/dashboard/notification-list.tsx` (203 lines)
- `No ${filter} notifications` (line 134) — when filter ≠ "all", renders English `"No unread notifications"` etc. → need parameterized key
- `title` attributes on action buttons use `tn.markAllRead` for "Mark as read" (single) — slightly wrong reuse

### L5. `src/components/dashboard/transaction-progress-tracker.tsx` (382 lines)
- `"Verify"` button in LockResolver (line ~372) → use `dict.txnProgress` key or add one
- Most of the component is well-keyed via `dict.txnProgress`

### L6. `src/app/dashboard/transactions/page.tsx` (80 lines)
- Hardcoded pluralization: `` `${count} transaction${count !== 1 ? "s" : ""}` `` → use `dict.dashboardTransactions.subtitle` with `{{count}}` placeholder
- `Metadata.title` = `"Transaction History"` — static, not user-facing in-page (acceptable)

---

## 🔵 INFORMATIONAL — Auth pages & edge cases

### I1. Auth pages — no `platform` interpolation

**Files**: `login/_client.tsx`, `register/_client.tsx`, `forgot-password/_client.tsx`

Auth pages load locale JSON client-side via `import()`, bypassing `getDictionary()` and `injectPlatformVars()`. Any `{{platformName}}` placeholders in `auth.*` keys would render literally.

**Current impact**: Low — auth dict keys don't currently use platform placeholders.  
**Future risk**: If platform name is added to auth pages, it won't resolve.

### I2. Server-side validation errors returned in English

**Files**: `src/actions/auth.ts`, `src/lib/validations.ts`

`registerSchema` Zod errors and action error messages (e.g., `"Email already exists"`) are hardcoded in English and sent to the client.

**Impact**: Error messages on auth forms always appear in English regardless of locale.

### I3. `Metadata.title` static in English

**Files**: All dashboard `page.tsx` files use `export const metadata: Metadata = { title: "..." }` in English. These are static and cannot use `dict` (server component limitation with static exports).

**Impact**: Browser tab title is always in English. Not critical but not ideal.

---

## Execution Plan (Proposed Phases)

### Phase 1 — Add missing locale keys (~15 new keys across 10 files)
- Add `~15` new keys to all 10 locale JSON files
- Keys for: KYC optional notice, Pending Review badge, Reason/No reason, Document uploaded, transfer placeholders, card action toasts, beneficiary placeholders, filtered notification messages, etc.
- Add `transactionTypes` map (7 entries) to all 10 locales
- Add 3 missing status keys (`initialized`, `processing`, `expired`) to `common`

### Phase 2 — Wire up KYC page (highest impact, ~30 strings)
- Replace all hardcoded strings in `kyc/page.tsx` with `dict.kycPage.*` / `dict.common.*`

### Phase 3 — Wire up hardcoded components (~60 strings across 6 components)
- `notification-bell.tsx` — 4 strings
- `card-actions.tsx` — 12 strings
- `create-card-modal.tsx` — 10 strings
- `transfer-form.tsx` — 15 strings
- `kyc-form.tsx` — 20 strings
- `bank-card.tsx` — 5 strings (add dict/labels prop)

### Phase 4 — Fix cross-cutting patterns
- Transaction type label map (`dict.transactionTypes[txn.type]`) in 3 files
- Status badge translation (`dict.common[status.toLowerCase()]`) in 4 files
- `timeAgo()` → locale-aware with `Intl.RelativeTimeFormat`
- `formatCurrency()` → accept locale param

### Phase 5 — Low-priority fixes
- `add-beneficiary-button.tsx`, `beneficiary-card.tsx`, `transaction-actions.tsx` — wire dict
- `notification-list.tsx` — fix filtered empty state
- `beneficiary-form-modal.tsx` — remaining placeholders + `COUNTRIES` localization
- `transaction-progress-tracker.tsx` — "Verify" button

### Phase 6 (Optional) — Edge cases
- Auth page `platform` interpolation
- Server-side validation error translation
- `Metadata.title` dynamic approach

---

## Files Affected Summary

| File | Severity | Est. Strings |
|------|----------|-------------|
| `src/app/dashboard/kyc/page.tsx` | 🔴 | ~30 |
| `src/components/dashboard/notification-bell.tsx` | 🔴 | ~5 |
| `src/components/dashboard/transfer-form.tsx` | 🟠 | ~15 |
| `src/components/dashboard/kyc-form.tsx` | 🟠 | ~20 |
| `src/components/dashboard/card-actions.tsx` | 🟠 | ~12 |
| `src/components/dashboard/create-card-modal.tsx` | 🟠 | ~10 |
| `src/components/dashboard/beneficiary-form-modal.tsx` | 🟠 | ~7 |
| `src/components/dashboard/bank-card.tsx` | 🟠 | ~5 |
| `src/app/dashboard/page.tsx` | 🟡 | ~5 (types + statuses) |
| `src/app/dashboard/transactions/page.tsx` | 🟡 | ~5 (types + statuses + plural) |
| `src/app/dashboard/cards/page.tsx` | 🟡 | ~3 (statuses) |
| `src/lib/utils.ts` (`timeAgo` + `formatCurrency`) | 🟡 | ~8 labels |
| `src/components/dashboard/add-beneficiary-button.tsx` | 🟢 | 1 |
| `src/components/dashboard/beneficiary-card.tsx` | 🟢 | 2 |
| `src/components/dashboard/transaction-actions.tsx` | 🟢 | 3 |
| `src/components/dashboard/notification-list.tsx` | 🟢 | 2 |
| `src/components/dashboard/transaction-progress-tracker.tsx` | 🟢 | 1 |
| All 10 locale JSON files | Phase 1 | ~25 new keys each |
