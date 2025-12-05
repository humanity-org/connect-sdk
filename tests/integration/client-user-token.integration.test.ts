import { HumanitySDK, type ClientUserTokenResult } from '../../src/HumanitySDK';
import { HumanityError } from '../../src/types/humanity-error';
import { getClientUserTokenTestEnvironment } from '../utils/client-user-token-environment';

const env = getClientUserTokenTestEnvironment();
const sdk = new HumanitySDK(env.config);

describe('HumanitySDK client user token integration', () => {
  describe('getClientUserToken', () => {
    it('issues an access token for a user with an active authorization using email lookup', async () => {
      if (!env.testUserEmail) {
        console.warn('Skipping email lookup test: HUMANITY_SDK_TEST_USER_EMAIL not set');
        return;
      }

      const result = await sdk.getClientUserToken({
        clientSecret: env.clientSecret,
        email: env.testUserEmail,
      });

      expectValidClientUserTokenResult(result);
      expect(result.scopes.length).toBeGreaterThan(0);
    });

    it('issues an access token for a user using direct user ID lookup', async () => {
      if (!env.testUserId) {
        console.warn('Skipping user ID lookup test: HUMANITY_SDK_TEST_USER_ID not set');
        return;
      }

      const result = await sdk.getClientUserToken({
        clientSecret: env.clientSecret,
        userId: env.testUserId,
      });

      expectValidClientUserTokenResult(result);
      expect(result.userId).toBe(env.testUserId);
    });

    it('issues an access token for a user using EVM address lookup', async () => {
      if (!env.testUserEvmAddress) {
        console.warn('Skipping EVM address lookup test: HUMANITY_SDK_TEST_USER_EVM_ADDRESS not set');
        return;
      }

      const result = await sdk.getClientUserToken({
        clientSecret: env.clientSecret,
        evmAddress: env.testUserEvmAddress,
      });

      expectValidClientUserTokenResult(result);
    });

    it('issues an access token using compound identifier format', async () => {
      if (!env.testUserEmail) {
        console.warn('Skipping compound identifier test: HUMANITY_SDK_TEST_USER_EMAIL not set');
        return;
      }

      const result = await sdk.getClientUserToken({
        clientSecret: env.clientSecret,
        identifier: `email|${env.testUserEmail}`,
      });

      expectValidClientUserTokenResult(result);
    });

    it('supports compound identifier with user_id prefix', async () => {
      if (!env.testUserId) {
        console.warn('Skipping compound user_id test: HUMANITY_SDK_TEST_USER_ID not set');
        return;
      }

      const result = await sdk.getClientUserToken({
        clientSecret: env.clientSecret,
        identifier: `user_id|${env.testUserId}`,
      });

      expectValidClientUserTokenResult(result);
      expect(result.userId).toBe(env.testUserId);
    });

    it('supports compound identifier with evm prefix', async () => {
      if (!env.testUserEvmAddress) {
        console.warn('Skipping compound EVM test: HUMANITY_SDK_TEST_USER_EVM_ADDRESS not set');
        return;
      }

      const result = await sdk.getClientUserToken({
        clientSecret: env.clientSecret,
        identifier: `evm|${env.testUserEvmAddress}`,
      });

      expectValidClientUserTokenResult(result);
    });
  });

  describe('error handling', () => {
    it('throws an error when client secret is missing', async () => {
      await expect(
        sdk.getClientUserToken({
          clientSecret: '',
          email: 'test@example.com',
        }),
      ).rejects.toThrow('HumanitySDK.getClientUserToken requires a clientSecret');
    });

    it('throws an error when no user identifier is provided', async () => {
      await expect(
        sdk.getClientUserToken({
          clientSecret: env.clientSecret,
        }),
      ).rejects.toThrow(
        'HumanitySDK.getClientUserToken requires at least one user identifier',
      );
    });

    it('throws HumanityError for invalid client secret', async () => {
      expect.assertions(2);
      try {
        await sdk.getClientUserToken({
          clientSecret: 'sk_invalid_secret_that_does_not_exist',
          email: env.testUserEmail ?? 'test@example.com',
        });
        throw new Error('Expected request to fail with invalid client secret');
      } catch (error) {
        expect(error).toBeInstanceOf(HumanityError);
        const humanityError = error as HumanityError;
        expect(humanityError.httpStatus).toBe(401);
      }
    });

    it('throws HumanityError for non-existent user', async () => {
      expect.assertions(2);
      try {
        await sdk.getClientUserToken({
          clientSecret: env.clientSecret,
          email: 'nonexistent-user-integration-test@example.invalid',
        });
        throw new Error('Expected request to fail for non-existent user');
      } catch (error) {
        expect(error).toBeInstanceOf(HumanityError);
        const humanityError = error as HumanityError;
        expect(humanityError.httpStatus).toBe(404);
      }
    });

    it('throws HumanityError when user has no active authorization', async () => {
      if (!env.unauthorizedUserEmail) {
        console.warn(
          'Skipping unauthorized user test: HUMANITY_SDK_TEST_UNAUTHORIZED_USER_EMAIL not set',
        );
        return;
      }

      expect.assertions(2);
      try {
        await sdk.getClientUserToken({
          clientSecret: env.clientSecret,
          email: env.unauthorizedUserEmail,
        });
        throw new Error('Expected request to fail for unauthorized user');
      } catch (error) {
        expect(error).toBeInstanceOf(HumanityError);
        const humanityError = error as HumanityError;
        expect(humanityError.httpStatus).toBe(403);
      }
    });

    it('throws HumanityError when user does not have developer access', async () => {
      if (!env.nonDeveloperUserEmail) {
        console.warn(
          'Skipping non-developer user test: HUMANITY_SDK_TEST_NON_DEVELOPER_USER_EMAIL not set',
        );
        return;
      }

      expect.assertions(2);
      try {
        await sdk.getClientUserToken({
          clientSecret: env.clientSecret,
          email: env.nonDeveloperUserEmail,
        });
        throw new Error('Expected request to fail for non-developer user');
      } catch (error) {
        expect(error).toBeInstanceOf(HumanityError);
        const humanityError = error as HumanityError;
        expect(humanityError.httpStatus).toBe(403);
      }
    });
  });

  describe('token usage', () => {
    it('issued token can be used to verify presets', async () => {
      if (!env.testUserEmail || !env.testPresetKey) {
        console.warn(
          'Skipping token usage test: HUMANITY_SDK_TEST_USER_EMAIL or HUMANITY_SDK_TEST_PRESET_KEY not set',
        );
        return;
      }

      const tokenResult = await sdk.getClientUserToken({
        clientSecret: env.clientSecret,
        email: env.testUserEmail,
      });

      // Use the issued token to verify a preset
      const presetResult = await sdk.verifyPreset(env.testPresetKey, tokenResult.accessToken);
      expect(presetResult.preset).toBe(env.testPresetKey);
      expect(typeof presetResult.status).toBe('string');
    });

    it('token contains expected client_id matching SDK config', async () => {
      if (!env.testUserEmail) {
        console.warn('Skipping client_id test: HUMANITY_SDK_TEST_USER_EMAIL not set');
        return;
      }

      const result = await sdk.getClientUserToken({
        clientSecret: env.clientSecret,
        email: env.testUserEmail,
      });

      expect(result.clientId).toBe(env.config.clientId);
    });

    it('token expiration is within expected range', async () => {
      if (!env.testUserEmail) {
        console.warn('Skipping expiration test: HUMANITY_SDK_TEST_USER_EMAIL not set');
        return;
      }

      const result = await sdk.getClientUserToken({
        clientSecret: env.clientSecret,
        email: env.testUserEmail,
      });

      // Token should expire within a reasonable time (e.g., 1 hour = 3600 seconds)
      expect(result.expiresIn).toBeGreaterThan(0);
      expect(result.expiresIn).toBeLessThanOrEqual(3600);
    });
  });
});

function expectValidClientUserTokenResult(result: ClientUserTokenResult): void {
  expect(result.accessToken).toMatch(/^[-_A-Za-z0-9\.]+$/);
  expect(result.tokenType).toBe('Bearer');
  expect(typeof result.expiresIn).toBe('number');
  expect(result.expiresIn).toBeGreaterThan(0);
  expect(typeof result.issuedAt).toBe('string');
  expect(result.userId).toBeTruthy();
  expect(result.clientId).toBeTruthy();
  expect(result.authorizationId).toBeTruthy();
  expect(Array.isArray(result.scopes)).toBe(true);
  expect(result.raw).toBeDefined();
}

