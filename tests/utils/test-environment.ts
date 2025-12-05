import type { HumanitySdkConfig } from '../../src/HumanitySDK';
import type { DeveloperPresetKey } from '../../src/adapters/preset-registry';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable "${name}" for Humanity SDK integration tests.`,
    );
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .flatMap((chunk) => chunk.split(' '))
    .map((part) => part.trim())
    .filter(Boolean);
}

export interface IntegrationTestEnvironment {
  config: HumanitySdkConfig;
  scopes: string[];
  presetKeys: DeveloperPresetKey[];
  sharedToken: string;
  unavailablePresetKey?: DeveloperPresetKey;
  state?: string;
  credentialUpdatedSince?: string;
  authorizationStatusFilter: 'active' | 'revoked';
}

export function getIntegrationTestEnvironment(): IntegrationTestEnvironment {
  const config: HumanitySdkConfig = {
    clientId: requireEnv('HUMANITY_SDK_CLIENT_ID'),
    redirectUri: requireEnv('HUMANITY_SDK_REDIRECT_URI'),
    clientSecret: optionalEnv('HUMANITY_SDK_CLIENT_SECRET'),
    environment: optionalEnv('HUMANITY_SDK_ENVIRONMENT'),
    baseUrl: optionalEnv('HUMANITY_SDK_BASE_URL'),
  };

  const presetKeys = parseList(optionalEnv('HUMANITY_SDK_TEST_PRESET_KEYS')) as DeveloperPresetKey[];
  if (presetKeys.length === 0) {
    throw new Error(
      'HUMANITY_SDK_TEST_PRESET_KEYS must specify at least one developer preset key (comma or space delimited).',
    );
  }

  const scopes = parseList(optionalEnv('HUMANITY_SDK_TEST_SCOPES'));

  return {
    config,
    scopes,
    presetKeys,
    sharedToken: requireEnv('HUMANITY_SDK_TEST_SHARED_TOKEN'),
    unavailablePresetKey: optionalEnv('HUMANITY_SDK_TEST_UNAVAILABLE_PRESET') as
      | DeveloperPresetKey
      | undefined,
    state: optionalEnv('HUMANITY_SDK_TEST_STATE'),
    credentialUpdatedSince: optionalEnv('HUMANITY_SDK_TEST_UPDATED_SINCE'),
    authorizationStatusFilter:
      (optionalEnv('HUMANITY_SDK_TEST_AUTHORIZATION_STATUS') as 'active' | 'revoked' | undefined) ??
      'active',
  };
}

