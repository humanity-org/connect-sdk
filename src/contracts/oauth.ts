import type {
  AuthorizeApproveRequest,
  AuthorizeApproveResponse,
  AuthorizeQuery,
  ClientUserTokenRequest,
  ClientUserTokenResponse,
  RevokeRequest,
  RevokeResponse,
  TokenRequest,
  TokenResponse,
} from '@utils/ts-types/oauth';

export type OauthAuthorizeQuery = AuthorizeQuery;

export type OauthTokenRequest = TokenRequest;
export type OauthTokenResponse = TokenResponse;

export type OauthClientUserTokenRequest = ClientUserTokenRequest;
export type OauthClientUserTokenResponse = ClientUserTokenResponse;

export type OauthRevokeRequest = RevokeRequest;
export type OauthRevokeResponse = RevokeResponse;

export type OauthApproveRequest = AuthorizeApproveRequest;
export type OauthApproveResponse = AuthorizeApproveResponse;

