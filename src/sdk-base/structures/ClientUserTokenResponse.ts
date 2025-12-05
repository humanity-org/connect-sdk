export type ClientUserTokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  issued_at: string;
  user_id: string;
  client_id: string;
  authorization_id: string;
  scopes: string[];
};
