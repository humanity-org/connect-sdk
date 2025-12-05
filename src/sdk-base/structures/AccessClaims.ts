export type AccessClaims = {
  sub: string;
  iss: string;
  aud: string[];
  tenantId?: undefined | string;
  roles: string[];
  scopes?: undefined | string[];
  iat: number;
  exp: number;
  jti: string;
  typ: "access";
};
