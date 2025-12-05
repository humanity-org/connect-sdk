import api, { HttpError } from './sdk-base';

import type { RevokeRequest as OauthRevokeRequest } from '@structures/RevokeRequest';
import type { RevokeResponse as OauthRevokeResponse } from '@structures/RevokeResponse';
import type { TokenRequest as OauthTokenRequest } from '@structures/TokenRequest';
import type { TokenResponse as OauthTokenResponse } from '@structures/TokenResponse';
import type { ClientUserTokenRequest as OauthClientUserTokenRequest } from '@structures/ClientUserTokenRequest';
import type { ClientUserTokenResponse as OauthClientUserTokenResponse } from '@structures/ClientUserTokenResponse';
import type { VerifyPresetsRequest as PresetsVerifyRequest } from '@structures/VerifyPresetsRequest';
import type { VerifyPresetsResponse as PresetsVerifyResponse } from '@structures/VerifyPresetsResponse';
import type { IConnection } from '@nestia/fetcher';
import type { AuthorizationsQuery as StatusAuthorizationsQuery } from '@structures/AuthorizationsQuery';
import type { CredentialsQuery as StatusCredentialsQuery } from '@structures/CredentialsQuery';
import type { HpConfiguration as DiscoveryConfiguration } from '@structures/HpConfiguration';
import type { HealthLivenessResponse } from '@structures/HealthLivenessResponse';
import type { HealthReadinessResponse } from '@structures/HealthReadinessResponse';
import { PresetRegistry, type DeveloperPresetKey } from './adapters/preset-registry';
import { PresetsAdapter, type PresetBatchResult, type PresetCheckResult } from './adapters/presets.adapter';
import {
  AuthorizationUpdates,
  CredentialUpdates,
  StatusAdapter,
} from './adapters/status.adapter';
import { ScopesAdapter } from './adapters/scopes.adapter';
import { HttpConnectionFactory } from './internal/connection';
import { EnvironmentRegistry, type EnvironmentDescriptor, type EnvironmentName } from './internal/environment';
import { deriveCodeChallenge, generateCodeVerifier } from './internal/pkce';
import { camelToSnake } from './internal/casing';
import type { RateLimitInfo } from './types/rate-limit';
import { HumanityError } from './types/humanity-error';

type HeadersLike = {
  forEach(callback: (value: string, key: string) => void): void;
};

export interface HumanitySdkConfig {
  clientId: string;
  redirectUri: string;
  clientSecret?: string;
  environment?: EnvironmentName | string;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  fetch?: typeof fetch;
}

export interface AuthorizationUrlOptions {
  scopes: string[];
  state?: string;
  nonce?: string;
  codeVerifierLength?: number;
  codeVerifier?: string;
  additionalQueryParams?: Record<string, string | undefined>;
}

export interface AuthorizationUrlResult {
  url: string;
  codeVerifier: string;
}

export interface TokenResult {
  accessToken: string;
  tokenType: OauthTokenResponse['token_type'];
  expiresIn: number;
  scope: string;
  grantedScopes: string[];
  presetKeys: DeveloperPresetKey[];
  authorizationId: string;
  appScopedUserId: string;
  issuedAt?: string;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
  refreshIssuedAt?: string;
  idToken?: string;
  raw: OauthTokenResponse;
  rateLimit?: RateLimitInfo;
}
export interface RefreshAccessTokenOptions {
  scope?: string | string[];
  clientId?: string;
}


export interface RevokeTokenOptions {
  token?: string;
  tokens?: string[];
  tokenTypeHint?: 'access_token' | 'refresh_token' | 'authorization';
  authorizationId?: string;
  cascade?: boolean;
}

export type RevokeTokenResult = OauthRevokeResponse &  {
  rateLimit?: RateLimitInfo;
}

export interface VerifyPresetsOptions {
  accessToken: string;
  presets: DeveloperPresetKey[];
}

export interface VerifyPresetOptions {
  accessToken: string;
  preset: DeveloperPresetKey;
}

export interface PollCredentialUpdatesOptions {
  updatedSince?: string | Date;
  limit?: number;
}

export interface PollAuthorizationUpdatesOptions {
  updatedSince?: string | Date;
  status?: 'revoked' | 'active';
  limit?: number;
}

/**
 * Options for obtaining an access token for a user who has already authorized
 * the application. This allows server-to-server token issuance without user interaction.
 */
export interface ClientUserTokenOptions {
  /** The application's client secret (private key) */
  clientSecret: string;
  /**
   * Compound identifier in the format "type|value".
   * Supported types: id, user, user_id, email, evm, evm_addr, wallet
   */
  identifier?: string;
  /** Direct user ID lookup */
  userId?: string;
  /** User's email address */
  email?: string;
  /** User's EVM wallet address */
  evmAddress?: string;
}

/**
 * Result from the client user token endpoint containing an access token
 * that can be used to read data for the specified user.
 */
export interface ClientUserTokenResult {
  /** The issued access token */
  accessToken: string;
  /** Token type, always "Bearer" */
  tokenType: 'Bearer';
  /** Token lifetime in seconds */
  expiresIn: number;
  /** ISO 8601 timestamp when the token was issued */
  issuedAt: string;
  /** The user ID the token was issued for */
  userId: string;
  /** The application's client ID */
  clientId: string;
  /** The authorization ID associated with this token */
  authorizationId: string;
  /** Scopes granted to this token */
  scopes: string[];
  /** Raw API response */
  raw: OauthClientUserTokenResponse;
  /** Rate limit information if available */
  rateLimit?: RateLimitInfo;
}

export class HumanitySDK {
  private static readonly environments = new EnvironmentRegistry();
  private static readonly configurationCacheTtlMs = 60 * 60 * 1000;

  private static readonly literalScopeKeywords = new Set(['openid']);

  private readonly config: HumanitySdkConfig;
  private readonly environment: EnvironmentDescriptor;
  private readonly connectionFactory: HttpConnectionFactory;
  private readonly presetRegistry = new PresetRegistry();
  private readonly scopesAdapter = new ScopesAdapter(this.presetRegistry);
  private readonly presetsAdapter = new PresetsAdapter(this.presetRegistry);
  private readonly statusAdapter = new StatusAdapter(this.presetRegistry);
  private configurationCache?: DiscoveryConfiguration;
  private configurationCacheTimestamp?: number;

  constructor(config: HumanitySdkConfig) {
    if (!config.clientId) throw new Error('HumanitySDK requires a clientId');
    if (!config.redirectUri) throw new Error('HumanitySDK requires a redirectUri');

    this.config = config;
    this.environment = HumanitySDK.resolveEnvironment(config);
    this.connectionFactory = new HttpConnectionFactory({
      environment: this.environment,
      fetch: config.fetch,
      defaultHeaders: config.defaultHeaders,
    });
  }

  static registerEnvironment(descriptor: EnvironmentDescriptor): void {
    HumanitySDK.environments.register(descriptor);
  }

  buildAuthUrl(options: AuthorizationUrlOptions): AuthorizationUrlResult {
    if (!options?.scopes?.length) {
      throw new Error('At least one scope is required to build an authorization URL');
    }

    const endpoints = this.getOauthEndpoints();
    const codeVerifier = options.codeVerifier ?? generateCodeVerifier(options.codeVerifierLength ?? 64);
    const codeChallenge = deriveCodeChallenge(codeVerifier);
    const scopeValues = this.composeAuthorizationScopes(options.scopes);

    const authorizeUrl = new URL(endpoints.authorize);
    const query = authorizeUrl.searchParams;
    query.set('client_id', this.config.clientId);
    query.set('redirect_uri', this.config.redirectUri);
    query.set('response_type', 'code');
    query.set('scope', scopeValues.join(' '));
    query.set('code_challenge', codeChallenge);
    query.set('code_challenge_method', 'S256');

    if (options.state) {
      query.set('state', options.state);
    }
    if (options.nonce) {
      query.set('nonce', options.nonce);
    }

    const extras = options.additionalQueryParams ?? {};
    Object.entries(extras).forEach(([key, value]) => {
      if (value !== undefined) {
        query.set(camelToSnake(key), value);
      }
    });

    return {
      url: authorizeUrl.toString(),
      codeVerifier,
    };
  }

  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResult> {
    const connection = this.connectionFactory.createRootConnection();
    const body: OauthTokenRequest = {
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
    };
    const { data, rateLimit } = await this.executeWithRateLimit(connection, (conn) =>
      api.functional.oauth.token(conn, body),
    );
    return this.mapTokenResponse(data, rateLimit);
  }

  async refreshAccessToken(
    refreshToken: string,
    options: RefreshAccessTokenOptions = {},
  ): Promise<TokenResult> {
    if (!refreshToken) {
      throw new Error('HumanitySDK.refreshAccessToken requires a refresh token');
    }
    const connection = this.connectionFactory.createRootConnection();
    const scope =
      Array.isArray(options.scope) && options.scope.length
        ? options.scope.join(' ')
        : typeof options.scope === 'string'
          ? options.scope
          : undefined;
    const body = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: options.clientId ?? this.config.clientId,
      scope,
    } as unknown as OauthTokenRequest;
    const { data, rateLimit } = await this.executeWithRateLimit(connection, (conn) =>
      api.functional.oauth.token(conn, body),
    );
    return this.mapTokenResponse(data, rateLimit);
  }
  static generateState(length = 32): string {
    return generateCodeVerifier(Math.max(length, 43));
  }

  static generateNonce(length = 32): string {
    return generateCodeVerifier(Math.max(length, 43));
  }

  static verifyState(expected: string, received?: string | null): boolean {
    return HumanitySDK.safeCompare(expected, received);
  }

  static verifyNonce(expected: string, received?: string | null): boolean {
    return HumanitySDK.safeCompare(expected, received);
  }


  async revokeTokens(options: RevokeTokenOptions): Promise<RevokeTokenResult> {
    const connection = this.connectionFactory.createRootConnection();
    const body: OauthRevokeRequest = {
      client_id: this.config.clientId,
      token: options.token,
      tokens: options.tokens,
      token_type_hint: options.tokenTypeHint,
      authorization_id: options.authorizationId,
      cascade: options.cascade,
    };
    const { data, rateLimit } = await this.executeWithRateLimit(connection, (conn) =>
      api.functional.oauth.revoke(conn, body),
    );
    return rateLimit ? { ...data, rateLimit } : data;
  }

  /**
   * Obtain an access token for a user who has already authorized the application.
   * This enables server-to-server token issuance without requiring user interaction.
   *
   * The user must:
   * 1. Have developer access
   * 2. Have an active authorization for this application
   *
   * @param options - Configuration for the token request including user identifier
   * @returns Access token and associated metadata
   * @throws {HumanityError} When the user is not found, not authorized, or credentials are invalid
   *
   * @example
   * ```typescript
   * // Using email lookup
   * const result = await sdk.getClientUserToken({
   *   clientSecret: 'sk_...',
   *   email: 'developer@example.com',
   * });
   *
   * // Using compound identifier
   * const result = await sdk.getClientUserToken({
   *   clientSecret: 'sk_...',
   *   identifier: 'email|developer@example.com',
   * });
   *
   * // Using direct user ID
   * const result = await sdk.getClientUserToken({
   *   clientSecret: 'sk_...',
   *   userId: '507f1f77bcf86cd799439011',
   * });
   * ```
   */
  async getClientUserToken(options: ClientUserTokenOptions): Promise<ClientUserTokenResult> {
    if (!options.clientSecret) {
      throw new Error('HumanitySDK.getClientUserToken requires a clientSecret');
    }
    if (!options.identifier && !options.userId && !options.email && !options.evmAddress) {
      throw new Error(
        'HumanitySDK.getClientUserToken requires at least one user identifier (identifier, userId, email, or evmAddress)',
      );
    }

    const connection = this.connectionFactory.createRootConnection();
    const body: OauthClientUserTokenRequest = {
      client_id: this.config.clientId,
      client_secret: options.clientSecret,
      identifier: options.identifier,
      user_id: options.userId,
      email: options.email,
      evm_address: options.evmAddress,
    };

    const { data, rateLimit } = await this.executeWithRateLimit(connection, (conn) =>
      api.functional.oauth.client.user_token.clientUserToken(conn, body),
    );

    return this.mapClientUserTokenResponse(data, rateLimit);
  }

  async verifyPreset(preset: DeveloperPresetKey, accessToken: string): Promise<PresetCheckResult>;
  async verifyPreset(options: VerifyPresetOptions): Promise<PresetCheckResult>;
  async verifyPreset(
    arg1: DeveloperPresetKey | VerifyPresetOptions,
    arg2?: string,
  ): Promise<PresetCheckResult> {
    const { preset, accessToken } = this.normalizeVerifyPresetArgs(arg1, arg2);
    const presetName = this.scopesAdapter.toPresetName(preset);
    const connection = this.connectionFactory.createCoreConnection(accessToken);
    const { data, rateLimit } = await this.executeWithRateLimit(connection, (conn) =>
      api.functional.presets.getPreset(conn, presetName),
    );
    const wrapped = { results: [data], errors: [] } as PresetsVerifyResponse;
    return this.presetsAdapter.fromSingleResponse(wrapped, { rateLimit });
  }

  async verifyPresets(
    presets: DeveloperPresetKey[],
    accessToken: string,
  ): Promise<PresetBatchResult>;
  async verifyPresets(options: VerifyPresetsOptions): Promise<PresetBatchResult>;
  async verifyPresets(
    arg1: DeveloperPresetKey[] | VerifyPresetsOptions,
    arg2?: string,
  ): Promise<PresetBatchResult> {
    const { presets, accessToken } = this.normalizeVerifyPresetsArgs(arg1, arg2);
    if (!presets.length) {
      throw new Error('At least one preset is required for verification');
    }
    if (presets.length > 10) {
      throw new Error('A maximum of 10 presets can be verified in a single request');
    }
    const body: PresetsVerifyRequest = {
      presets: presets.map((preset) => this.scopesAdapter.toPresetName(preset)) as PresetsVerifyRequest['presets'],
    };
    const connection = this.connectionFactory.createCoreConnection(accessToken);
    const { data, rateLimit } = await this.executeWithRateLimit(connection, (conn) =>
      api.functional.presets.batch(conn, body),
    );
    return this.presetsAdapter.fromBatchResponse(data, { rateLimit });
  }

  async pollCredentialUpdates(
    accessToken: string,
    options: PollCredentialUpdatesOptions = {},
  ): Promise<CredentialUpdates> {
    this.validateLimit(options.limit);
    const query: StatusCredentialsQuery = this.statusAdapter.normalizeCredentialsQuery({
      updated_since: this.toIsoString(options.updatedSince),
      limit: options.limit,
    });
    const connection = this.connectionFactory.createCoreConnection(accessToken);
    const { data, rateLimit } = await this.executeWithRateLimit(connection, (conn) =>
      api.functional.credentials(conn, query),
    );
    return this.statusAdapter.fromCredentialsResponse(data, { rateLimit });
  }

  async pollAuthorizationUpdates(
    accessToken: string,
    options: PollAuthorizationUpdatesOptions = {},
  ): Promise<AuthorizationUpdates> {
    this.validateLimit(options.limit);
    const query: StatusAuthorizationsQuery = this.statusAdapter.normalizeAuthorizationsQuery({
      status: options.status,
      updated_since: this.toIsoString(options.updatedSince),
      limit: options.limit,
    });
    const connection = this.connectionFactory.createCoreConnection(accessToken);
    const { data, rateLimit } = await this.executeWithRateLimit(connection, (conn) =>
      api.functional.authorizations(conn, query),
    );
    return this.statusAdapter.fromAuthorizationsResponse(data, { rateLimit });
  }

  async getConfiguration(forceRefresh = false): Promise<DiscoveryConfiguration> {
    if (!forceRefresh && this.hasFreshConfigurationCache()) {
      return this.configurationCache!;
    }
    const connection = this.connectionFactory.createDiscoveryConnection();
    try {
      const configuration = await api.functional._well_known.hp_configuration.getHpConfiguration(
        connection,
      );
      this.configurationCache = configuration;
      this.configurationCacheTimestamp = Date.now();
      this.scopesAdapter.ingestConfiguration(configuration);
      return configuration;
    } catch (error) {
      this.rethrowAsHumanityError(error);
    }
  }

  clearCache(): void {
    this.configurationCache = undefined;
    this.configurationCacheTimestamp = undefined;
  }

  async healthcheck(): Promise<HealthLivenessResponse> {
    const connection = this.connectionFactory.createHealthConnection();
    try {
      return await api.functional.health.healthcheck(connection);
    } catch (error) {
      this.rethrowAsHumanityError(error);
    }
  }

  async readiness(): Promise<HealthReadinessResponse> {
    const connection = this.connectionFactory.createHealthConnection();
    try {
      return await api.functional.ready.readiness(connection);
    } catch (error) {
      this.rethrowAsHumanityError(error);
    }
  }

  private composeAuthorizationScopes(scopes: string[]): string[] {
    const normalizedScopes = scopes.map((scope) => scope.trim()).filter(Boolean);
    const directScopes = new Set<string>();
    const developerKeys: string[] = [];

    for (const scope of normalizedScopes) {
      if (this.isLiteralScope(scope)) {
        directScopes.add(scope);
      } else {
        developerKeys.push(scope);
      }
    }

    this.scopesAdapter.toAuthorizationScopes(developerKeys).forEach((scope) =>
      directScopes.add(scope),
    );
    return Array.from(directScopes);
  }

  private isLiteralScope(scope: string): boolean {
    if (!scope) return false;
    if (scope.includes(':') || scope.includes('.')) {
      return true;
    }
    return HumanitySDK.literalScopeKeywords.has(scope.trim().toLowerCase());
  }

  private mapTokenResponse(response: OauthTokenResponse, rateLimit?: RateLimitInfo): TokenResult {
    const presetKeys = this.scopesAdapter.fromGrantedScopes(response.granted_scopes);
    return {
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresIn: response.expires_in,
      scope: response.scope,
      grantedScopes: response.granted_scopes,
      presetKeys,
      authorizationId: response.authorization_id,
      appScopedUserId: response.app_scoped_user_id,
      issuedAt: response.issued_at,
      refreshToken: response.refresh_token,
      refreshTokenExpiresIn: response.refresh_token_expires_in,
      refreshIssuedAt: response.refresh_issued_at,
      idToken: response.id_token,
      raw: response,
      rateLimit,
    };
  }

  private mapClientUserTokenResponse(
    response: OauthClientUserTokenResponse,
    rateLimit?: RateLimitInfo,
  ): ClientUserTokenResult {
    return {
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresIn: response.expires_in,
      issuedAt: response.issued_at,
      userId: response.user_id,
      clientId: response.client_id,
      authorizationId: response.authorization_id,
      scopes: response.scopes,
      raw: response,
      rateLimit,
    };
  }

  private static safeCompare(expected?: string, received?: string | null): boolean {
    if (!expected || !received) {
      return false;
    }
    return expected === received;
  }

  private static resolveEnvironment(config: HumanitySdkConfig): EnvironmentDescriptor {
    if (config.baseUrl) {
      return {
        name: config.environment ?? 'custom',
        apiBaseUrl: config.baseUrl,
        discoveryBaseUrl: config.baseUrl,
      };
    }
    return HumanitySDK.environments.resolve(config.environment);
  }

  private getOauthEndpoints(): { authorize: string; token: string; revoke: string } {
    if (this.configurationCache) {
      return {
        authorize: this.configurationCache.authorization_endpoint,
        token: this.configurationCache.token_endpoint,
        revoke: this.configurationCache.revoke_endpoint,
      };
    }
    const baseApiUrl = stripTrailingSlash(this.environment.apiBaseUrl);
    return {
      authorize: `${baseApiUrl}/oauth/authorize`,
      token: `${baseApiUrl}/oauth/token`,
      revoke: `${baseApiUrl}/oauth/revoke`,
    };
  }

  private normalizeVerifyPresetArgs(
    arg1: DeveloperPresetKey | VerifyPresetOptions,
    arg2?: string,
  ): { preset: DeveloperPresetKey; accessToken: string } {
    if (typeof arg1 === 'string') {
      if (!arg2) {
        throw new Error(
          'HumanitySDK.verifyPreset requires an access token when using positional arguments',
        );
      }
      return { preset: arg1, accessToken: arg2 };
    }
    if (!arg1?.preset) {
      throw new Error('HumanitySDK.verifyPreset requires a preset identifier');
    }
    if (!arg1.accessToken) {
      throw new Error('HumanitySDK.verifyPreset requires an access token');
    }
    return { preset: arg1.preset, accessToken: arg1.accessToken };
  }

  private normalizeVerifyPresetsArgs(
    arg1: DeveloperPresetKey[] | VerifyPresetsOptions,
    arg2?: string,
  ): { presets: DeveloperPresetKey[]; accessToken: string } {
    if (Array.isArray(arg1)) {
      if (!arg2) {
        throw new Error(
          'HumanitySDK.verifyPresets requires an access token when using positional arguments',
        );
      }
      return { presets: [...arg1], accessToken: arg2 };
    }
    if (!Array.isArray(arg1?.presets)) {
      throw new Error('HumanitySDK.verifyPresets requires an array of presets');
    }
    if (!arg1.accessToken) {
      throw new Error('HumanitySDK.verifyPresets requires an access token');
    }
    return { presets: [...arg1.presets], accessToken: arg1.accessToken };
  }

  private async executeWithRateLimit<T>(
    connection: IConnection,
    call: (conn: IConnection) => Promise<T>,
  ): Promise<{ data: T; rateLimit?: RateLimitInfo }> {
    const fetchImpl = connection.fetch ?? this.resolveFetch();
    let capturedHeaders: Record<string, string> | undefined;

    const wrappedFetch = Object.assign(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const response = await fetchImpl(input as any, init as any);
        capturedHeaders = this.normalizeHeaders((response as Response).headers as HeadersLike);
        return response as Response;
      },
      fetchImpl,
    ) as typeof fetch;

    const wrappedConnection: IConnection = {
      ...connection,
      fetch: wrappedFetch,
    };

    try {
      const data = await call(wrappedConnection);
      return {
        data,
        rateLimit: capturedHeaders ? this.extractRateLimit(capturedHeaders) : undefined,
      };
    } catch (error) {
      this.rethrowAsHumanityError(error);
      throw error as never;
    }
  }

  private resolveFetch(): typeof fetch {
    const fetchImpl =
      this.connectionFactory.getFetch() ?? (globalThis as unknown as { fetch?: typeof fetch }).fetch;
    if (!fetchImpl) {
      throw new Error(
        'HumanitySDK requires a fetch implementation. Provide config.fetch when running in environments without global fetch.',
      );
    }
    return fetchImpl;
  }

  private extractRateLimit(headers: Record<string, string>): RateLimitInfo | undefined {
    const limit = this.parseInteger(headers['x-ratelimit-limit']);
    const remaining = this.parseInteger(headers['x-ratelimit-remaining']);
    const reset = this.parseInteger(headers['x-ratelimit-reset']);
    if (limit === undefined && remaining === undefined && reset === undefined) {
      return undefined;
    }
    const rateLimit: RateLimitInfo = {};
    if (limit !== undefined) rateLimit.limit = limit;
    if (remaining !== undefined) rateLimit.remaining = remaining;
    if (reset !== undefined) rateLimit.reset = reset;
    return rateLimit;
  }

  private parseInteger(value?: string): number | undefined {
    if (value === undefined) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private toIsoString(input?: string | Date): string | undefined {
    if (!input) return undefined;
    return typeof input === 'string' ? input : input.toISOString();
  }

  private validateLimit(limit?: number): void {
    if (limit === undefined) return;
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('HumanitySDK limit must be a positive integer');
    }
    if (limit > 100) {
      throw new Error('HumanitySDK limit cannot exceed 100');
    }
  }

  private hasFreshConfigurationCache(): boolean {
    if (!this.configurationCache || !this.configurationCacheTimestamp) {
      return false;
    }
    return Date.now() - this.configurationCacheTimestamp < HumanitySDK.configurationCacheTtlMs;
  }

  private throwHumanityError(
    method: 'GET' | 'POST',
    url: string,
    status: number,
    headers: Record<string, string>,
    body: string,
  ): never {
    const httpError = new HttpError(method, url, status, headers, body);
    throw HumanityError.fromHttpError(httpError);
  }

  private rethrowAsHumanityError(error: unknown): never {
    if (error instanceof HumanityError) {
      throw error;
    }
    if (error instanceof HttpError) {
      throw HumanityError.fromHttpError(error);
    }
    throw error;
  }

  private normalizeHeaders(headers: HeadersLike | undefined): Record<string, string> {
    if (!headers) return {};
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value;
    });
    return result;
  }
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export { HttpError };

