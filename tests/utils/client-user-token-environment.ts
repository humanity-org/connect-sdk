import type { HumanitySdkConfig } from '../../src/HumanitySDK';
import type { DeveloperPresetKey } from '../../src/adapters/preset-registry';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable "${name}" for client user token integration tests.`,
    );
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

/**
 * Environment configuration for client user token integration tests.
 *
 * Required environment variables:
 * - HUMANITY_SDK_CLIENT_ID: The application's client ID
 * - HUMANITY_SDK_REDIRECT_URI: The application's redirect URI
 * - HUMANITY_SDK_CLIENT_SECRET: The application's client secret (private key)
 *
 * Optional environment variables for user lookups:
 * - HUMANITY_SDK_TEST_USER_EMAIL: Email of a user with developer access and active authorization
 * - HUMANITY_SDK_TEST_USER_ID: User ID of a user with developer access and active authorization
 * - HUMANITY_SDK_TEST_USER_EVM_ADDRESS: EVM address of a user with developer access and active authorization
 *
 * Optional environment variables for error case testing:
 * - HUMANITY_SDK_TEST_UNAUTHORIZED_USER_EMAIL: Email of a user without active authorization
 * - HUMANITY_SDK_TEST_NON_DEVELOPER_USER_EMAIL: Email of a user without developer access
 *
 * Optional environment variables for token usage testing:
 * - HUMANITY_SDK_TEST_PRESET_KEY: A preset key to verify with the issued token
 */
export interface ClientUserTokenTestEnvironment {
  config: HumanitySdkConfig;
  clientSecret: string;
  testUserEmail?: string;
  testUserId?: string;
  testUserEvmAddress?: string;
  unauthorizedUserEmail?: string;
  nonDeveloperUserEmail?: string;
  testPresetKey?: DeveloperPresetKey;
}

export function getClientUserTokenTestEnvironment(): ClientUserTokenTestEnvironment {
  const config: HumanitySdkConfig = {
    clientId: requireEnv('HUMANITY_SDK_CLIENT_ID'),
    redirectUri: requireEnv('HUMANITY_SDK_REDIRECT_URI'),
    clientSecret: optionalEnv('HUMANITY_SDK_CLIENT_SECRET'),
    environment: optionalEnv('HUMANITY_SDK_ENVIRONMENT'),
    baseUrl: optionalEnv('HUMANITY_SDK_BASE_URL'),
  };

  const clientSecret = requireEnv('HUMANITY_SDK_CLIENT_SECRET');

  return {
    config,
    clientSecret,
    testUserEmail: optionalEnv('HUMANITY_SDK_TEST_USER_EMAIL'),
    testUserId: optionalEnv('HUMANITY_SDK_TEST_USER_ID'),
    testUserEvmAddress: optionalEnv('HUMANITY_SDK_TEST_USER_EVM_ADDRESS'),
    unauthorizedUserEmail: optionalEnv('HUMANITY_SDK_TEST_UNAUTHORIZED_USER_EMAIL'),
    nonDeveloperUserEmail: optionalEnv('HUMANITY_SDK_TEST_NON_DEVELOPER_USER_EMAIL'),
    testPresetKey: optionalEnv('HUMANITY_SDK_TEST_PRESET_KEY') as DeveloperPresetKey | undefined,
  };
}

