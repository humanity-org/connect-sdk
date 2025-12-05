import type { AuthorizeApplicationDetail } from "./AuthorizeApplicationDetail";
import type { AuthorizeContextMetadata } from "./AuthorizeContextMetadata";
import type { AuthorizeContextPolicy } from "./AuthorizeContextPolicy";
import type { AuthorizeScopeDetail } from "./AuthorizeScopeDetail";

export type AuthorizeContextResponse = {
  authorization_id: string;
  client_id: string;
  user_id: string;
  app_scoped_user_id: string;
  status: "pending_admin" | "approved" | "denied" | "revoked" | "consumed";
  redirect_uri: string;
  state?: undefined | string;
  requested_scopes: string[];
  granted_scopes?: undefined | string[];
  code?: undefined | string;
  code_expires_at?: undefined | string;
  nonce?: undefined | string;
  application: AuthorizeApplicationDetail;
  scopes: AuthorizeScopeDetail[];
  metadata: AuthorizeContextMetadata;
  policy: AuthorizeContextPolicy;
};
