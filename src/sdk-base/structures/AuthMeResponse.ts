import type { AccessClaims } from "./AccessClaims";

export type AuthMeResponse = {
  user: AccessClaims;
};
