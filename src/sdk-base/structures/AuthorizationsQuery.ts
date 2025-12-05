export type AuthorizationsQuery = {
  status?: undefined | "active" | "revoked";
  updated_since?: undefined | string;
  limit?: undefined | number;
};
