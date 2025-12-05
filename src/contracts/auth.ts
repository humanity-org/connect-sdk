export type AccessClaims = {
  sub: string;
  iss: string;
  aud: string[];
  tenantId?: string;
  roles: string[];
  scopes?: string[];
  iat: number;
  exp: number;
  jti: string;
  typ: 'access';
};

export type AuthLogoutRequest = {
  accessToken?: string;
  refreshToken?: string;
};

export type AuthLogoutResponse = {
  ok: true;
};

export type AuthMeResponse = {
  user: AccessClaims;
};

