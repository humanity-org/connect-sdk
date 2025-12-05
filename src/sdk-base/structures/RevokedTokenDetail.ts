export type RevokedTokenDetail = {
  subject: "token" | "authorization";
  token_type?: undefined | "refresh_token" | "access_token";
  authorization_id?: undefined | string;
  client_id?: undefined | string;
  user_id?: undefined | string;
  status: "revoked" | "not_found" | "invalid";
  reason?: undefined | string;
};
