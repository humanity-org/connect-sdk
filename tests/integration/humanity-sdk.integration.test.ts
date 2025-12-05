import { HumanitySDK, type TokenResult } from '../../src/HumanitySDK';
import { PresetRegistry, type DeveloperPresetKey } from '../../src/adapters/preset-registry';
import { HumanityError } from '../../src/types/humanity-error';
import { getIntegrationTestEnvironment } from '../utils/test-environment';

const env = getIntegrationTestEnvironment();
const sdk = new HumanitySDK(env.config);
const registry = new PresetRegistry();

let exchangedToken: TokenResult | undefined;
const targetPresetKeys = env.presetKeys;
let authorizationCode: string;
let codeVerifier: string;

const ALLOWED_PRESET_ERROR_CODES = new Set(['E4003', 'E4004', 'E4010', 'E4044']);

function expectToken(): TokenResult {
  if (!exchangedToken) {
    throw new Error('Access token was not initialized. Ensure the token exchange test runs first.');
  }
  return exchangedToken;
}

describe('HumanitySDK integration', () => {
  beforeAll(async () => {
    const configuration = await sdk.getConfiguration(true);
    registry.syncFromConfiguration(configuration);
    ({ code: authorizationCode, verifier: codeVerifier } = await obtainAuthorizationCode());
  });

  describe('authorization helpers (Appendix D, Appendix C)', () => {
    it('builds a PKCE-compliant authorization URL that mirrors Discovery metadata', () => {
      const requestedScopes =
        env.scopes.length > 0
          ? env.scopes
          : registry.list().slice(0, 2).map((descriptor) => descriptor.developerKey);

      const extraQuery = { prompt: 'consent' };

      const { url, codeVerifier } = sdk.buildAuthUrl({
        scopes: requestedScopes,
        state: env.state ?? 'integration-state',
        additionalQueryParams: extraQuery,
      });

      expect(typeof url).toBe('string');
      expect(url).toContain('/oauth/authorize');
      expect(codeVerifier.length).toBeGreaterThanOrEqual(43); // RFC7636 minimum length

      const authorizeUrl = new URL(url);
      expect(authorizeUrl.searchParams.get('client_id')).toBe(env.config.clientId);
      expect(authorizeUrl.searchParams.get('redirect_uri')).toBe(env.config.redirectUri);
      expect(authorizeUrl.searchParams.get('response_type')).toBe('code');
      expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');
      expect(authorizeUrl.searchParams.get('state')).toBe(env.state ?? 'integration-state');
      expect(authorizeUrl.searchParams.get('prompt')).toBe(extraQuery.prompt);

      const scopeParam = authorizeUrl.searchParams.get('scope');
      expect(scopeParam).toBeTruthy();
      if (scopeParam) {
        const resolvedScopes = requestedScopes.map((scope) => {
          if (scope.includes(':')) return scope;
          return registry.resolveByDeveloperKey(scope).scope;
        });
        resolvedScopes.forEach((scope) => {
          expect(scopeParam.split(' ')).toContain(scope);
        });
      }
    });

    it('exchanges an authorization code for a token', async () => {
      exchangedToken = await sdk.exchangeCodeForToken(authorizationCode, codeVerifier);

      expect(exchangedToken.accessToken).toMatch(/^[-_A-Za-z0-9\.]+$/);
      expect(exchangedToken.tokenType).toBe('Bearer');
      expect(typeof exchangedToken.expiresIn).toBe('number');
      expect(exchangedToken.authorizationId).toBeTruthy();
      expect(exchangedToken.grantedScopes.length).toBeGreaterThan(0);

      if (env.scopes.length > 0) {
        const expectedScopes = env.scopes.map((scope) =>
          scope.includes(':') ? scope : registry.resolveByDeveloperKey(scope).scope,
        );
        expectedScopes.forEach((scope) => {
          expect(exchangedToken!.grantedScopes).toContain(scope);
        });
      }

      if (env.presetKeys.length > 0) {
        env.presetKeys.forEach((presetKey) => {
          expect(exchangedToken!.presetKeys).toContain(presetKey);
        });
      }
    });
  });

  describe('preset verification', () => {
    it.each(targetPresetKeys.map((preset) => [preset]))(
      'verifies preset "%s" and normalizes the payload',
      async (preset) => {
      const token = expectToken();

        try {
          const result = await sdk.verifyPreset(preset, token.accessToken);
          expect(result.preset).toBe(preset);
          expect(result.scope).toBe(registry.resolveByDeveloperKey(preset).scope);
          expect(typeof result.status).toBe('string');
          expect(typeof result.expiresAt).toBe('string');
        } catch (error) {
          expect(error).toBeInstanceOf(HumanityError);
          const humanityError = error as HumanityError;
          expect(ALLOWED_PRESET_ERROR_CODES.has(humanityError.code)).toBe(true);
        }
      },
    );

    it('verifies multiple presets in batch and preserves ordering', async () => {
      const token = expectToken();
      const batchKeys = targetPresetKeys.slice(0, Math.min(targetPresetKeys.length, 3));
      expect(batchKeys.length).toBeGreaterThan(0);

      const batch = await sdk.verifyPresets(batchKeys, token.accessToken);
      expect(batch.results.length + batch.errors.length).toBe(batchKeys.length);
      batch.results.forEach((result) => {
        expect(batchKeys).toContain(result.preset);
        expect(typeof result.status).toBe('string');
      });
      batch.errors.forEach((error) => {
        expect(batchKeys).toContain(error.preset);
        expect(error.error.error_code).toBeDefined();
        expect(ALLOWED_PRESET_ERROR_CODES.has(error.error.error_code)).toBe(true);
      });
    });

    it('rejects verification requests that exceed the 10 preset batch limit (Dev API SDK Requirements)', async () => {
      const token = expectToken();
      const seed = targetPresetKeys[0] ?? 'isHuman';
      const oversizedBatch = Array.from({ length: 11 }, () => seed);

      await expect(sdk.verifyPresets(oversizedBatch, token.accessToken)).rejects.toThrow(
        'A maximum of 10 presets can be verified in a single request',
      );
    });

    it('surfaces structured errors when a preset is unavailable', async () => {
      const token = expectToken();
      const unavailableKey =
        env.unavailablePresetKey ?? 'nonExistentPresetKeyForIntegrationValidation';

      expect.assertions(2);
      try {
        await sdk.verifyPreset(unavailableKey, token.accessToken);
        throw new Error('Expected preset verification to fail for unavailable preset.');
      } catch (error) {
        expect(error).toBeInstanceOf(HumanityError);
        const humanityError = error as HumanityError;
        expect(ALLOWED_PRESET_ERROR_CODES.has(humanityError.code)).toBe(true);
      }
    });
  });

  describe('status polling', () => {
    it('polls credential updates with pagination metadata', async () => {
      const token = expectToken();
      const limit = 5;
      const response = await sdk.pollCredentialUpdates(token.accessToken, {
        limit,
        updatedSince: env.credentialUpdatedSince,
      });

      expect(Array.isArray(response.credentials)).toBe(true);
      expect(response.credentials.length).toBeLessThanOrEqual(limit);
      response.credentials.forEach((credential) => {
        expect(typeof credential.preset).toBe('string');
        expect(typeof credential.scope).toBe('string');
        expect(typeof credential.updatedAt).toBe('string');
      });
      expect(response.raw).toBeDefined();
    });

    it('polls authorization updates using status filters', async () => {
      const token = expectToken();
      const response = await sdk.pollAuthorizationUpdates(token.accessToken, {
        status: env.authorizationStatusFilter,
        limit: 5,
      });

      expect(Array.isArray(response.authorizations)).toBe(true);
      response.authorizations.forEach((authorization) => {
        expect(typeof authorization.authorizationId).toBe('string');
        expect(typeof authorization.status).toBe('string');
        expect(['revoked', 'active']).toContain(authorization.status);
      });
    });
  });

  describe('discovery and health', () => {
    it('caches discovery configuration until the cache is cleared', async () => {
      const first = await sdk.getConfiguration();
      const second = await sdk.getConfiguration();
      expect(second).toBe(first);

      sdk.clearCache();
      const refreshed = await sdk.getConfiguration();
      expect(refreshed).not.toBe(first);
    });

    it('fetches liveness health status', async () => {
      const response = await sdk.healthcheck();
      expect(response.status).toBe('ok');
      expect(typeof response.uptime).toBe('number');
    });

    it('fetches readiness checks', async () => {
      const response = await sdk.readiness();
      expect(['ready', 'not_ready']).toContain(response.status);
      expect(Array.isArray(response.checks)).toBe(true);
    });
  });

  describe('token revocation', () => {
    it('revokes tokens and returns detailed revocation metadata', async () => {
      const token = expectToken();

      const revoked = await sdk.revokeTokens({
        token: token.accessToken,
        tokenTypeHint: 'access_token',
        cascade: true,
      });

      expect(revoked.revoked).toBe(true);
      expect(revoked.revoked_count).toBeGreaterThanOrEqual(1);
    });
  });
});

async function obtainAuthorizationCode(): Promise<{ code: string; verifier: string }> {
  const requestedScopes = env.scopes.length > 0 ? env.scopes : targetPresetKeys;
  if (!requestedScopes.length) {
    throw new Error('Unable to derive authorization scopes for integration tests.');
  }

  const state = env.state ?? 'integration-state';
  const { url, codeVerifier: verifier } = sdk.buildAuthUrl({
    scopes: requestedScopes,
    state,
    additionalQueryParams: { prompt: 'consent' },
  });

  const authorizeResponse = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.sharedToken}`,
    },
    redirect: 'manual',
  });

  if (authorizeResponse.status !== 302) {
    const body = await authorizeResponse.text();
    throw new Error(
      `Expected 302 redirect from /oauth/authorize but received ${authorizeResponse.status}: ${body}`,
    );
  }

  const location = authorizeResponse.headers.get('location');
  if (!location) {
    throw new Error('Authorize endpoint did not provide a redirect location header.');
  }

  const authorizeUrl = new URL(url);
  const redirectUrl = new URL(location, authorizeUrl.origin);
  let code = redirectUrl.searchParams.get('code');
  const authorizationId = redirectUrl.searchParams.get('authorization_id');

  if (!code) {
    if (!authorizationId) {
      throw new Error('Authorization ID missing from redirect; cannot approve authorization.');
    }

    const approvalScopes = requestedScopes.map((scope) =>
      scope.includes(':')
        ? scope
        : registry.resolveByDeveloperKey(scope as DeveloperPresetKey).scope,
    );

    const approveUrl = new URL('/oauth/authorize/approve', authorizeUrl.origin);
    const approveResponse = await fetch(approveUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.sharedToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorization_id: authorizationId,
        scopes: approvalScopes,
      }),
    });

    if (!approveResponse.ok) {
      const approveBody = await approveResponse.text();
      throw new Error(
        `Failed to approve authorization ${authorizationId}: ${approveResponse.status} ${approveResponse.statusText} ${approveBody}`,
      );
    }

    const approvalResult = (await approveResponse.json()) as { code?: string };
    if (!approvalResult.code) {
      throw new Error('Approval response did not include an authorization code.');
    }
    code = approvalResult.code;
  }

  return { code, verifier };
}

