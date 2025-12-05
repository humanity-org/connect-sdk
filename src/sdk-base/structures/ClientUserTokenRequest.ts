export type ClientUserTokenRequest = {
  client_id: string;
  client_secret: string;
  identifier?: undefined | string;
  user_id?: undefined | string;
  email?: undefined | string;
  evm_address?: undefined | string;
};
