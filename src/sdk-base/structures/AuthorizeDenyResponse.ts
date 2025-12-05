export type AuthorizeDenyResponse = {
  authorization_id: string;
  status: string;
  redirect_uri: string;
  state?: undefined | string;
  client_id: string;
};
