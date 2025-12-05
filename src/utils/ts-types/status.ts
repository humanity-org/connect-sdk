import type { IsoDateString, AuthorizationStatus, PresetStatus, UUID } from './common';
import type { PresetName } from './presets';

export type CredentialsQuery = {
  updated_since?: IsoDateString;
  limit?: number;
};

export type CredentialItem = {
  user_id: string;
  preset: PresetName;
  value: boolean;
  status: PresetStatus;
  expires_at: IsoDateString;
  updated_at: IsoDateString;
};

export type CredentialsResponse = {
  items: CredentialItem[];
  last_modified?: IsoDateString;
  has_more?: boolean;
};

export type AuthorizationsQuery = {
  status?: 'revoked' | 'active';
  updated_since?: IsoDateString;
  limit?: number;
};

export type AuthorizationUpdate = {
  authorization_id: UUID;
  organization_id: UUID;
  app_scoped_user_id: string;
  status: AuthorizationStatus;
  updated_at: IsoDateString;
};

export type AuthorizationsResponse = {
  items: AuthorizationUpdate[];
  last_modified?: IsoDateString;
  has_more?: boolean;
};

