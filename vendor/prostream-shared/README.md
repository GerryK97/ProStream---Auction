# @prostream/shared

Internal shared utility package for the ProStream platform.

Installed as a local `file:` dependency in **ProStream Auction** and **ProStream Scoreboard**:

```json
"@prostream/shared": "file:../prostream-shared"
```

---

## Modules

| Import path | Contents |
|---|---|
| `@prostream/shared/phone` | `normalizeMobile`, `isValidE164`, `maskPhone` |
| `@prostream/shared/sms` | `sendSMS` (text.lk v3 API), `generateOTP` |
| `@prostream/shared/otp` | OTP DB helpers + constants (see below) |

### `@prostream/shared/phone`

```ts
normalizeMobile(raw: string): string
// Strips spaces/dashes, prepends +94 for Sri Lankan numbers starting with 07x.

isValidE164(phone: string): boolean
// Returns true for strings matching /^\+[1-9]\d{6,19}$/.

maskPhone(phone: string): string
// Returns "+9477***4567" style masked string for display in responses.
```

### `@prostream/shared/sms`

```ts
sendSMS(phone: string, message: string): Promise<{ ok: boolean; error?: string }>
// Sends SMS via text.lk v3 API. Reads TEXTLK_API_TOKEN and TEXTLK_SENDER_ID from env.

generateOTP(length?: number): string
// Returns a numeric OTP string (default 6 digits).
```

### `@prostream/shared/otp`

DB-agnostic helpers that accept any Drizzle instance and table reference.

```ts
createOtpRecord(db, table, { userId, phone, otpHash, expiresAt }): Promise<void>

getLatestOtpRecord(db, table, userId: string): Promise<OtpRecord | null>
// Queries the latest row for a user ordered by createdAt DESC.

checkCooldown(record: OtpRecord | null, cooldownSecs: number): number
// Returns remaining cooldown seconds; 0 means allowed to send.

validateOtpRecord(record: OtpRecord | null, maxAttempts: number): string | null
// Returns an error string if invalid/expired/locked; null if valid to proceed.

incrementOtpAttempts(db, table, id, currentAttempts): Promise<void>

markOtpVerified(db, table, id, currentAttempts): Promise<void>
// Sets verifiedAt = now().
```

**Constants:**

```ts
OTP_EXPIRY_MINUTES  = 10
OTP_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS    = 5
OTP_LENGTH          = 6
```

---

## Required environment variables

Both consuming apps must have these set:

```env
TEXTLK_API_TOKEN=<from https://app.text.lk → API Keys>
TEXTLK_SENDER_ID=ProStream
```

---

## How the OTP flow works end-to-end

```
User presses "Verify Mobile"
  → POST /api/auth/otp/send  (Auction: Bearer JWT; Scoreboard: NextAuth session)
    → normalizeMobile + isValidE164  [phone module]
    → checkCooldown (60s)             [otp module]
    → generateOTP(6)                  [sms module]
    → bcrypt.hash(otp)
    → createOtpRecord(db, table, …)   [otp module]
    → sendSMS(phone, message)         [sms module]
  ← { success: true, message: "OTP sent to +9477***4567", expiresInMinutes: 10 }

User enters OTP + presses "Verify"
  → POST /api/auth/otp/verify
    → getLatestOtpRecord              [otp module]
    → validateOtpRecord               [otp module]  (expired? locked?)
    → bcrypt.compare(otp, hash)
    → incrementOtpAttempts on wrong   [otp module]
    → markOtpVerified on correct      [otp module]
    → UPDATE users SET phone_verified = true, phone = <verified phone>
  ← { success: true, user: { phoneVerified: true, … } }
```

---

## Build

```bash
cd prostream-shared
npm install
npm run build   # tsc → dist/
```

The consuming apps reference `dist/` directly via the `exports` map in `package.json`. After any source change, rebuild and then re-run `npm install` in each app (or just rebuild — the `file:` symlink picks up `dist/` automatically).

---

## Installing in an app

```bash
# From the app directory:
npm install ../prostream-shared
```

This adds `"@prostream/shared": "file:../prostream-shared"` to `package.json`.

---

## Adding new shared utilities

1. Create `src/<module>/index.ts`
2. Export from `src/index.ts` (barrel)
3. Add a sub-path entry to `package.json` `exports` and `typesVersions`
4. Run `npm run build`
5. Run `npm install` in each consuming app to refresh the symlink

---

## Candidates for future extraction

- `cloudinaryUtils` — Cloudinary URL builder (currently diverged between Auction and Scoreboard)
- `bidIncrementUtils` — auction bid slab/increment logic
- `permissions` — role-based access rules shared between Auction and Scoreboard
