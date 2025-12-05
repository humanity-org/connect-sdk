export type UserInfoResponse = {
  sub: string;
  iss: string;
  aud: string;
  authorization_id: string;
  scopes: string[];
  updated_at?: undefined | string;
  humanity_id?: null | undefined | string;
  wallet_address?: null | undefined | string;
  email?: null | undefined | string;
  email_verified?: undefined | boolean;
};
