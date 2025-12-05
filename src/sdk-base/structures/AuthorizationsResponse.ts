import type { AuthorizationUpdate } from "./AuthorizationUpdate";

export type AuthorizationsResponse = {
  items: AuthorizationUpdate[];
  last_modified?: undefined | string;
  has_more?: undefined | boolean;
};
