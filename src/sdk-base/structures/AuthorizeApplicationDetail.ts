export type AuthorizeApplicationDetail = {
  client_id: string;
  name: string;
  organization_id: string;
  status: "active" | "revoked";
  redirect_uris: string[];
  created_by_user_id?: undefined | string;
  created_at?: undefined | string;
  updated_at?: undefined | string;
  revoked_at?: undefined | string;
};
