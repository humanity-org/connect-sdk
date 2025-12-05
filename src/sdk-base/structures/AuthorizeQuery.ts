export type AuthorizeQuery = {
  client_id: string;
  redirect_uri: string;
  response_type: "code";
  scope: string;
  state?: undefined | string;
  code_challenge: string;
  code_challenge_method: "S256";
  authorization_id?: undefined | string;
  login_hint?: undefined | string;
  locale?: undefined | string;
  nonce?: undefined | string;
};
