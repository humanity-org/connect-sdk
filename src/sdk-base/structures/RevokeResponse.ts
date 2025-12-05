import type { RevokedTokenDetail } from "./RevokedTokenDetail";

export type RevokeResponse = {
  revoked: boolean;
  revoked_count: number;
  details?: undefined | RevokedTokenDetail[];
};
