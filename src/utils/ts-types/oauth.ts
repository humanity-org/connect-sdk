import type { IsoDateString } from './common';

export type AuthorizeQuery = {
  client_id: string;
  redirect_uri: string;
  response_type: 'code';
  scope: string;
  state?: string;
  code_challenge: string;
  code_challenge_method: 'S256';
};

export type TokenRequest = {
  grant_type: 'authorization_code';
  code: string;
  redirect_uri: string;
  client_id: string;
  code_verifier: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
  granted_scopes: string[];
  authorization_id: string;
  app_scoped_user_id: string;
  issued_at?: IsoDateString;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  refresh_issued_at?: IsoDateString;
};

export type RevokeRequest = {
  token?: string;
  tokens?: string[];
  token_type_hint?: 'access_token' | 'refresh_token' | 'authorization';
  authorization_id?: string;
  cascade?: boolean | 'true' | 'false' | '1' | '0';
  client_id?: string;
};

export type RevokedTokenDetail = {
  subject: 'token' | 'authorization';
  token_type?: 'access_token' | 'refresh_token';
  authorization_id?: string;
  client_id?: string;
  user_id?: string;
  status: 'revoked' | 'not_found' | 'invalid';
  reason?: string;
};

export type RevokeResponse = {
  revoked: boolean;
  revoked_count: number;
  details?: RevokedTokenDetail[];
};

export type AuthorizeApproveRequest = {
  authorization_id: string;
  scopes?: string[];
};

export type AuthorizeApproveResponse = {
  authorization_id: string;
  status: 'approved';
  code: string;
  code_expires_at: IsoDateString;
  scopes: string[];
  granted_scopes: string[];
  app_scoped_user_id: string;
  organization_id: string;
  state?: string;
  redirect_uri: string;
  client_id: string;
};

/**
 * Request body for obtaining an access token for a user who has already
 * authorized the application. Requires the application's client credentials.
 *
 * At least one user identifier must be provided: `user_id`, `email`,
 * `evm_address`, or `identifier` (compound format like "email|user@example.com").
 */
export type ClientUserTokenRequest = {
  /** The application's client ID */
  client_id: string;
  /** The application's client secret (private key) */
  client_secret: string;
  /**
   * Compound identifier in the format "type|value".
   * Supported types: id, user, user_id, email, evm, evm_addr, wallet
   */
  identifier?: string;
  /** Direct user ID lookup */
  user_id?: string;
  /** User's email address */
  email?: string;
  /** User's EVM wallet address */
  evm_address?: string;
};

/**
 * Response from the client user token endpoint containing an access token
 * that can be used to read data for the specified user.
 */
export type ClientUserTokenResponse = {
  /** The issued access token */
  access_token: string;
  /** Token type, always "Bearer" */
  token_type: 'Bearer';
  /** Token lifetime in seconds */
  expires_in: number;
  /** ISO 8601 timestamp when the token was issued */
  issued_at: IsoDateString;
  /** The user ID the token was issued for */
  user_id: string;
  /** The application's client ID */
  client_id: string;
  /** The authorization ID associated with this token */
  authorization_id: string;
  /** Scopes granted to this token */
  scopes: string[];
};

