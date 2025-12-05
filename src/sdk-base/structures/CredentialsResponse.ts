import type { CredentialItem } from "./CredentialItem";

export type CredentialsResponse = {
  items: CredentialItem[];
  last_modified?: undefined | string;
  has_more?: undefined | boolean;
};
