# Humanity TypeScript SDK (Preview)

> Enterprise-grade wrapper around the generated Humanity Public Dev API client.

## Installation

Until the package is published, add it to your project via a workspace reference or local path:

```bash
npm install /path/to/hp-public-dev-api/sdk
```

## Quick Start

```ts
import { HumanitySDK } from '@humanity/sdk';

const sdk = new HumanitySDK({
  clientId: process.env.HUMANITY_CLIENT_ID!,
  redirectUri: 'https://app.example.com/oauth/callback',
  environment: 'staging',
});

const state = HumanitySDK.generateState();
const nonce = HumanitySDK.generateNonce();

const { url, codeVerifier } = sdk.buildAuthUrl({
  scopes: ['isHuman', 'is21Plus'],
  state,
  nonce,
});

// Redirect the user to `url`, persist the `codeVerifier` securely, then:
const token = await sdk.exchangeCodeForToken(authCodeFromCallback, codeVerifier);

if (token.refreshToken) {
  const refreshed = await sdk.refreshAccessToken(token.refreshToken);
  console.log(refreshed.idToken);
}

const preset = await sdk.verifyPreset('is21Plus', token.accessToken);
```

## Features

- PKCE-aware OAuth helper with environment registry
- Helpers for generating/verifying OAuth state & nonce plus refresh-token exchange
- Adapter layer that normalizes presets, scopes, and status polling
- Enterprise-friendly abstractions with room for future SDK layers
- Zero-config access to the underlying Nestia-generated client when needed

## Integration Tests

The `test:integration` suite exercises every `HumanitySDK` method against the live Public Dev API according to the flows documented in the business specifications (notably Appendix B API Reference, Appendix D Developer Flows, Appendix O Advanced Consent Management, Appendix Q Quality & Reliability, and Appendix R Catalog & Discovery UX). Tests run serially to honor the published rate-limit envelopes and require a pre-provisioned developer tenant and user consent state.

1. Create `sdk/.env.test.local` (loaded automatically via `dotenv`) with the following variables:
   - `HUMANITY_SDK_CLIENT_ID` and optional `HUMANITY_SDK_CLIENT_SECRET`
   - `HUMANITY_SDK_REDIRECT_URI`
   - `HUMANITY_SDK_ENVIRONMENT` or `HUMANITY_SDK_BASE_URL` (override discovery host)
   - `HUMANITY_SDK_TEST_SCOPES` – space/comma-delimited list of scopes or developer preset keys to request during PKCE (Appendix B §OAuth)
   - `HUMANITY_SDK_TEST_PRESET_KEYS` – developer preset keys to verify, matching Appendix A Preset Catalog
   - `HUMANITY_SDK_TEST_SHARED_TOKEN` – wallet-issued shared JWT for a user who can approve the requested scopes (used to mint authorization codes on demand)
   - `HUMANITY_SDK_TEST_UNAVAILABLE_PRESET` – (optional) preset key expected to be unavailable, used to assert Appendix O error handling
   - `HUMANITY_SDK_TEST_UPDATED_SINCE` – (optional ISO timestamp) narrows status polling windows
   - `HUMANITY_SDK_TEST_AUTHORIZATION_STATUS` – defaults to `active`; set to `revoked` to assert revocation polling
   - `HUMANITY_SDK_TEST_STATE` – (optional) fixed OAuth state token for deterministic assertions
   - `HUMANITY_SDK_TEST_DELAY_MS` / `HUMANITY_SDK_TEST_TIMEOUT_MS` – override default backoff and per-test timeout (Appendix Q)
2. Ensure the user represented by the shared token can approve the presets listed in `HUMANITY_SDK_TEST_PRESET_KEYS` so verification scenarios cover both successful and failure paths.
3. Run the suite:

```bash
cd sdk
npm run test:integration
```

The harness enforces `--runInBand` execution and inserts a configurable delay between tests to stay within the service’s published rate limits. Because the suite revokes the issued access token at the end (Appendix D §Token Revocation), you must supply a fresh authorization code for each full run. Configure CI to execute these tests only in environments where live credentials are available and approved for the requisite scopes (Appendix I Security & Compliance).

