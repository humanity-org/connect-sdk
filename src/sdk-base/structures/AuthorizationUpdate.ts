export type AuthorizationUpdate = {
  authorization_id: string;
  organization_id: string;
  app_scoped_user_id: string;
  status: "active" | "revoked";
  updated_at: string;
};
