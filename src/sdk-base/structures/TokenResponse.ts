export type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
  granted_scopes: string[];
  authorization_id: string;
  app_scoped_user_id: string;
  issued_at?: undefined | string;
  refresh_token?: undefined | string;
  refresh_token_expires_in?: undefined | number;
  refresh_issued_at?: undefined | string;
  id_token?: undefined | string;
};
