export type AuthorizeApproveResponse = {
  authorization_id: string;
  status: "approved";
  code: string;
  code_expires_at: string;
  scopes: string[];
  granted_scopes: string[];
  app_scoped_user_id: string;
  organization_id: string;
  state?: undefined | string;
  redirect_uri: string;
  client_id: string;
};
