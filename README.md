# Humanity Connect SDK

The official TypeScript SDK for integrating with Humanity Protocol. Verify real humans, check age requirements, and validate investor accreditation with privacy-preserving credentials.

## What is Humanity Protocol?

Humanity Protocol provides decentralized, privacy-preserving identity verification. Users verify once and share proof of their attributes (like being human, being over 21, or being an accredited investor) without exposing personal data. This SDK makes it easy to integrate these verifications into your application.

## Installation

```bash
npm install @humanity-org/connect-sdk
```

## Quick Start

```typescript
import { HumanitySDK } from '@humanity-org/connect-sdk';

// 1. Initialize the SDK
const sdk = new HumanitySDK({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  environment: 'production', // 'production' | 'staging' | 'testnet'
});

// 2. Generate security tokens and build the authorization URL
const state = HumanitySDK.generateState();
const nonce = HumanitySDK.generateNonce();

const { url, codeVerifier } = sdk.buildAuthUrl({
  scopes: ['isHuman', 'is21Plus'], // Request humanity proof + age verification
  state,
  nonce,
});

// 3. Redirect user to `url` and store `state`, `nonce`, and `codeVerifier` securely

// 4. After user approval, exchange the authorization code for tokens
const tokens = await sdk.exchangeCodeForToken({
  code: authorizationCodeFromCallback,
  codeVerifier: storedCodeVerifier,
});

// 5. Verify the state matches
if (!HumanitySDK.verifyState(storedState, stateFromCallback)) {
  throw new Error('Invalid state - possible CSRF attack');
}

// 6. Verify credentials
const result = await sdk.verifyPreset({
  preset: 'is21Plus',
  accessToken: tokens.accessToken,
});

console.log(result.value); // true if user is 21+
console.log(result.status); // 'active' | 'expired' | 'revoked'
console.log(result.expiresAt); // ISO timestamp when credential expires
```

## Understanding Scopes vs Presets

### Scopes
**Scopes** are OAuth 2.0 permissions that your application requests during the authorization flow. They determine what categories or specific fields of user data your app can access. Scopes are granted by the user during the consent flow.

- **Category scopes** (e.g., `identity:read`, `kyc:read`) grant access to all low/medium sensitivity fields in that category
- **Field-level scopes** (e.g., `identity:date_of_birth`) are required for high/critical sensitivity fields

### Presets
**Presets** are pre-defined data fields you can retrieve once the user has granted the required scope. Each preset maps to exactly one scope - if the user grants that scope, you can access the preset.

### Key Difference
- **Scopes** = What you request permission for (during OAuth flow)
- **Presets** = What data you retrieve (after authorization)

---

## Available Scopes

| Scope | Category | Description |
|-------|----------|-------------|
| `identity:read` | Identity | Access to low/medium sensitivity identity fields |
| `identity:date_of_birth` | Identity | Access to DOB and age-related fields (high sensitivity) |
| `identity:address_postal_code` | Identity | Access to postal code (high sensitivity) |
| `identity:address_full` | Identity | Access to full address (high sensitivity) |
| `identity:legal_name` | Identity | Access to legal name (high sensitivity) |
| `kyc:read` | KYC | Access to low/medium sensitivity KYC fields |
| `kyc:tax_residency` | KYC | Access to tax residency (high sensitivity) |
| `kyc:tax_id` | KYC | Access to tax ID/SSN (critical sensitivity) |
| `kyc:document_number` | KYC | Access to document number (high sensitivity) |
| `financial:read` | Financial | Access to low/medium sensitivity financial fields |
| `financial:net_worth` | Financial | Access to net worth data (high sensitivity) |
| `financial:bank_balance` | Financial | Access to bank balances (high sensitivity) |
| `financial:investment_balance` | Financial | Access to investment balances (high sensitivity) |
| `financial:retirement_balance` | Financial | Access to retirement balances (high sensitivity) |
| `financial:loan_balance` | Financial | Access to loan balances (high sensitivity) |
| `financial:verified_income` | Financial | Access to verified income (high sensitivity) |
| `profile.full` | Profile | Access to full Humanity profile |

---

## Available Presets

### Identity Presets

| Preset Key | Required Scope | Type | Description |
|------------|----------------|------|-------------|
| `is_human` | `identity:read` | boolean | True if passed KYC or palm verification (1 person = 1 account) |
| `palm_verified` | `identity:read` | boolean | User has completed palm biometric verification |
| `humanity_uuid` | `identity:read` | string | Global UUID scoped to Humanity |
| `humanity_score` | `identity:read` | number | Confidence score for "human + unique" status |
| `country_of_residence` | `identity:read` | string | Country of residence (ISO 3166-1 alpha-2) |
| `residency_region` | `identity:read` | string | Region bucket (e.g., EU/APAC) - derived from country_of_residence |
| `nationality` | `identity:read` | string | Country of citizenship (ISO 3166-1 alpha-2) |
| `email` | `identity:read` | string | Verified primary email |
| `phone` | `identity:read` | string | Verified primary phone (E.164 format) |
| `social_accounts` | `identity:read` | array | Verified social account identifiers/handles |
| `wallet_addresses` | `identity:read` | array | List of user-controlled wallet addresses |
| `primary_wallet_address` | `identity:read` | string | Selected primary wallet address |
| `age_over_18` | `identity:date_of_birth` | boolean | Whether user is ≥ 18 years old |
| `age_over_21` | `identity:date_of_birth` | boolean | Whether user is ≥ 21 years old |
| `age` | `identity:date_of_birth` | integer | Age computed from date_of_birth |
| `date_of_birth` | `identity:date_of_birth` | date | Full DOB (YYYY-MM-DD) |
| `legal_name` | `identity:legal_name` | string | Full legal name from identity verification |
| `address_postal_code` | `identity:address_postal_code` | string | Postal/ZIP code |
| `address_full` | `identity:address_full` | string | Verified full address |

### KYC Presets

| Preset Key | Required Scope | Type | Description |
|------------|----------------|------|-------------|
| `kyc_passed` | `kyc:read` | boolean | Overall KYC verification status |
| `kyc_level` | `kyc:read` | enum | Level: none / basic / enhanced |
| `kyc_last_updated_at` | `kyc:read` | datetime | Timestamp of last KYC verification update |
| `sanctions_clear` | `kyc:read` | boolean | Sanctions list check result (e.g., OFAC) |
| `aml_screening_passed` | `kyc:read` | boolean | AML screening result |
| `pep_status` | `kyc:read` | boolean | Politically exposed person flag |
| `is_high_risk` | `kyc:read` | boolean | High-risk customer indicator |
| `geo_blocked_region` | `kyc:read` | boolean | User is in restricted geography |
| `employment_status` | `kyc:read` | enum | Verified employment category |
| `document_type` | `kyc:read` | string | Document type used for verification |
| `document_country` | `kyc:read` | string | Issuing country of identity document |
| `document_expiry_date` | `kyc:read` | date | Document expiration date |
| `tax_residency` | `kyc:tax_residency` | string | Country of tax residency |
| `document_number` | `kyc:document_number` | string | ID document number (sensitive) |
| `tax_id` | `kyc:tax_id` | string | SSN / national tax ID (critical sensitivity) |

### Financial Presets

| Preset Key | Required Scope | Type | Description |
|------------|----------------|------|-------------|
| `cex_balance` | `financial:read` | number | Centralized exchange balance |
| `trading_frequency_score` | `financial:read` | number | Normalized trading activity score |
| `net_worth_above_10k` | `financial:net_worth` | boolean | Verified net worth over $10,000 |
| `net_worth_above_100k` | `financial:net_worth` | boolean | Verified net worth over $100,000 |
| `net_worth_total` | `financial:net_worth` | number | Total assets − liabilities (USD) |
| `total_liabilities` | `financial:total_liabilities` | number | Aggregated liabilities |
| `bank_balance_total` | `financial:bank_balance` | number | Total bank account balances (USD) |
| `credit_card_balance` | `financial:credit_card_balance` | number | Outstanding credit card balances (USD) |
| `loan_balance_total` | `financial:loan_balance` | number | Outstanding loan balances (USD) |
| `investment_account_balance` | `financial:investment_balance` | number | Investment account balances (USD) |
| `retirement_account_balance` | `financial:retirement_balance` | number | Retirement/pension balances (USD) |
| `tradfi_balance` | `financial:tradfi_balance` | number | TradFi net worth (bank/brokerage/retirement − liabilities) |
| `onchain_balance` | `financial:onchain_balance` | number | On-chain balance |
| `verified_income` | `financial:verified_income` | number | Income validated via employer/payroll (USD) |

### Legacy Presets (Backward Compatibility)

| Preset Key | Required Scope | Type | Description |
|------------|----------------|------|-------------|
| `humanity_user` | `profile.full` | boolean | Humanity account basics: humanityId, email, wallet |
| `proof_of_assets` | `financial:net_worth` | boolean | Verified assets via Mastercard Open Finance |
| `proof_of_investments` | `financial:investment_balance` | boolean | Verified investment accounts via Mastercard |
| `proof_of_mortgage` | `financial:loan_balance` | boolean | Verified mortgage via Mastercard |
| `proof_of_residency` | `identity:read` | boolean | Verified residency via Mastercard bank data |
| `proof_of_retirement` | `financial:retirement_balance` | boolean | Verified retirement savings via Mastercard |

---

## API Reference

### Configuration

```typescript
const sdk = new HumanitySDK({
  // Required
  clientId: string;           // Your application's client ID
  redirectUri: string;        // OAuth callback URL

  // Optional
  clientSecret?: string;      // For server-to-server flows
  environment?: string;       // 'production' (default) | 'staging' | 'testnet'
  baseUrl?: string;           // Override API base URL
  defaultHeaders?: Record<string, string>;
  fetch?: typeof fetch;       // Custom fetch implementation
});
```

## Troubleshooting Guide

| Error Code | Solution |
|------------|----------|
| `E4003` | Include the required scope in the `scope` parameter during authorization |
| `E4004` | Record consent or verify the user - they haven't completed verification |
| `E4010` | User must re-verify - preset data expired after 24 hours |
| `E4041` | Refresh the access token using the refresh token |
| `E4042` | Re-authenticate the user - token was revoked or is invalid |
| `E4044` | Check the preset name - it doesn't exist in the available presets |

### OAuth Flow

#### Build Authorization URL

```typescript
const { url, codeVerifier } = sdk.buildAuthUrl({
  scopes: ['isHuman', 'is21Plus'], // Required: presets to request
  state: HumanitySDK.generateState(), // Recommended: CSRF protection
  nonce: HumanitySDK.generateNonce(), // Recommended: replay protection
  codeVerifier: customVerifier, // Optional: provide your own PKCE verifier
  codeVerifierLength: 64, // Optional: custom length (default: 64)
  additionalQueryParams: { // Optional: extra OAuth parameters
    prompt: 'consent',
  },
});
```

#### Exchange Authorization Code

```typescript
const tokens = await sdk.exchangeCodeForToken({
  code: 'authorization_code_from_callback',
  codeVerifier: 'stored_code_verifier',
});

// tokens contains:
// - accessToken: string
// - refreshToken?: string
// - idToken?: string
// - expiresIn: number (seconds)
// - grantedScopes: string[]
// - presetKeys: string[] (e.g., ['isHuman', 'is21Plus'])
// - authorizationId: string
// - appScopedUserId: string
```

#### Refresh Access Token

```typescript
const newTokens = await sdk.refreshAccessToken({
  refreshToken: tokens.refreshToken,
  scope: ['isHuman'], // Optional: request subset of original scopes
});
```

#### Revoke Tokens

```typescript
// Revoke a single token
await sdk.revokeTokens({
  token: accessToken,
  tokenTypeHint: 'access_token',
});

// Revoke multiple tokens
await sdk.revokeTokens({
  tokens: [accessToken, refreshToken],
});

// Revoke an entire authorization (all tokens for a user)
await sdk.revokeTokens({
  authorizationId: tokens.authorizationId,
  cascade: true,
});
```

### Credential Verification

#### Verify a Single Preset

```typescript
const result = await sdk.verifyPreset({
  preset: 'isHuman',
  accessToken: tokens.accessToken,
});

console.log({
  value: result.value,       // boolean - true if credential is valid
  status: result.status,     // 'active' | 'expired' | 'revoked' | 'pending'
  expiresAt: result.expiresAt,
  verifiedAt: result.verifiedAt,
  evidence: result.evidence, // Additional verification metadata
});
```

#### Verify Multiple Presets (Batch)

```typescript
const batch = await sdk.verifyPresets({
  presets: ['isHuman', 'is21Plus', 'isAccreditedInvestor'],
  accessToken: tokens.accessToken,
});

// Successful verifications
batch.results.forEach(result => {
  console.log(`${result.preset}: ${result.value}`);
});

// Failed verifications (e.g., user hasn't verified this credential)
batch.errors.forEach(error => {
  console.log(`${error.preset} failed: ${error.error.error_description}`);
});
```

### Server-to-Server Token Issuance

For users who have already authorized your application, you can issue tokens without user interaction:

```typescript
const result = await sdk.getClientUserToken({
  clientSecret: 'your-client-secret',

  // Identify the user (use one of these)
  email: 'user@example.com',
  userId: 'user-id',
  evmAddress: '0x...',
  identifier: 'email|user@example.com', // Compound format
});

console.log(result.accessToken);
console.log(result.scopes); // Scopes from user's existing authorization
```

### Polling for Updates

Track changes to user credentials and authorizations:

#### Credential Updates

```typescript
const updates = await sdk.pollCredentialUpdates({
  accessToken: tokens.accessToken,
  updatedSince: '2024-01-01T00:00:00Z', // Optional: ISO timestamp or Date
  limit: 50, // Optional: max 100
});

updates.credentials.forEach(cred => {
  console.log(`${cred.preset}: ${cred.status} (expires ${cred.expiresAt})`);
});

console.log(updates.hasMore); // true if more results available
console.log(updates.lastModified); // Use as updatedSince for next poll
```

#### Authorization Updates

```typescript
const updates = await sdk.pollAuthorizationUpdates({
  accessToken: tokens.accessToken,
  status: 'revoked', // Optional: filter by status
  updatedSince: new Date('2024-01-01'),
  limit: 50,
});

updates.authorizations.forEach(auth => {
  if (auth.status === 'revoked') {
    console.log(`Authorization ${auth.authorizationId} was revoked`);
  }
});
```

### Discovery & Health

#### Get API Configuration

```typescript
const config = await sdk.getConfiguration();

console.log(config.authorization_endpoint);
console.log(config.token_endpoint);
console.log(config.presets_available); // All available presets

// Clear cached configuration
sdk.clearCache();

// Force refresh
const freshConfig = await sdk.getConfiguration(true);
```

#### Health Checks

```typescript
const liveness = await sdk.healthcheck();
console.log(liveness.status); // 'ok'

const readiness = await sdk.readiness();
console.log(readiness.status); // 'ok'
console.log(readiness.checks); // Detailed health checks
```

## Error Handling

The SDK throws `HumanityError` for API errors with structured information:

```typescript
import { HumanityError } from '@humanity-org/connect-sdk';

try {
  await sdk.verifyPreset({ preset: 'isHuman', accessToken });
} catch (error) {
  if (error instanceof HumanityError) {
    console.error({
      message: error.message,
      code: error.code,           // e.g., 'E4041', 'invalid_token'
      subcode: error.subcode,
      statusCode: error.statusCode, // HTTP status code
      context: error.context,     // Additional error context
    });

    // Handle specific errors
    if (error.code === 'E4041') {
      console.log('Preset not available for this user');
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `E4003` | Forbidden - insufficient permissions |
| `E4004` | Invalid token or credentials |
| `E4010` | Unauthorized - token expired or invalid |
| `E4041` | Preset not found for user |
| `E4042` | Preset not available |
| `E4044` | Resource not found |

## Rate Limiting

API responses include rate limit information:

```typescript
const result = await sdk.verifyPreset({ preset: 'isHuman', accessToken });

if (result.rateLimit) {
  console.log({
    limit: result.rateLimit.limit,       // Requests allowed per window
    remaining: result.rateLimit.remaining, // Requests remaining
    reset: result.rateLimit.reset,       // Unix timestamp when limit resets
  });
}
```

## TypeScript

This SDK is written in TypeScript and exports all types:

```typescript
import {
  HumanitySDK,
  HumanitySdkConfig,
  TokenResult,
  PresetCheckResult,
  PresetBatchResult,
  CredentialUpdates,
  AuthorizationUpdates,
  HumanityError,
  RateLimitInfo,
  EnvironmentDescriptor,
} from '@humanity-org/connect-sdk';
```

## Security Best Practices

1. **Store tokens securely** - Never expose access tokens in client-side code or URLs
2. **Use state parameter** - Always validate the state parameter to prevent CSRF attacks
3. **Use nonce for ID tokens** - Validate the nonce in ID tokens to prevent replay attacks
4. **Store code verifier server-side** - The PKCE code verifier should be stored in a server session, not client storage
5. **Handle token expiration** - Check `expiresIn` and refresh tokens before they expire
6. **Keep client secrets safe** - Never expose your client secret in client-side code

## Example: Next.js Integration

```typescript
// app/api/auth/humanity/route.ts
import { HumanitySDK } from '@humanity-org/connect-sdk';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const sdk = new HumanitySDK({
  clientId: process.env.HUMANITY_CLIENT_ID!,
  redirectUri: process.env.HUMANITY_REDIRECT_URI!,
});

export async function GET() {
  const state = HumanitySDK.generateState();
  const nonce = HumanitySDK.generateNonce();
  const { url, codeVerifier } = sdk.buildAuthUrl({
    scopes: ['isHuman'],
    state,
    nonce,
  });

  cookies().set('humanity_state', state, { httpOnly: true, secure: true });
  cookies().set('humanity_nonce', nonce, { httpOnly: true, secure: true });
  cookies().set('humanity_verifier', codeVerifier, { httpOnly: true, secure: true });

  redirect(url);
}

// app/api/auth/humanity/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = cookies();
  const storedState = cookieStore.get('humanity_state')?.value;
  const codeVerifier = cookieStore.get('humanity_verifier')?.value;

  if (!HumanitySDK.verifyState(storedState!, state)) {
    return new Response('Invalid state', { status: 400 });
  }

  const tokens = await sdk.exchangeCodeForToken({
    code: code!,
    codeVerifier: codeVerifier!,
  });

  // Store tokens securely and redirect to app
  // ...
}
```

## Support

- **Documentation**: [docs.humanity.org](https://docs.humanity.org)
- **Developer Portal**: [developer.humanity.org](https://developer.humanity.org)
- **Issues**: [GitHub Issues](https://github.com/humanity-org/connect-sdk/issues)
