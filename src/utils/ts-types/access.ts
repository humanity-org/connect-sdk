import type { IsoDateString } from './common';

/**
 * Access key values as a const object.
 * Use `AccessKey.STANDARD`, `AccessKey.DEVELOPER`, or `AccessKey.ADMIN` for type-safe references.
 * String literals ('standard', 'developer', 'admin') are also valid and fully compatible.
 */
export const AccessKey = {
  STANDARD: 'standard',
  DEVELOPER: 'developer',
  ADMIN: 'admin',
} as const;

/**
 * Union type of all valid access key string values.
 * Accepts both `AccessKey.STANDARD` and literal `'standard'`.
 */
export type AccessKey = (typeof AccessKey)[keyof typeof AccessKey];

export type AccessScope = {
  orgId?: string;
};

export type AccessGrant = {
  subject_id: string;
  key: AccessKey;
  scope?: AccessScope;
  granted_by?: string;
  created_at: IsoDateString;
  updated_at?: IsoDateString;
};

export type AccessRequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

export type AccessRequest = {
  id: string;
  applicant_id: string;
  requested_key: AccessKey;
  status: AccessRequestStatus;
  reviewer_id?: string;
  reviewed_at?: IsoDateString;
  metadata?: Record<string, string | number | boolean>;
  created_at: IsoDateString;
  updated_at?: IsoDateString;
};

export type CreateStandardAccessRequestResponse = {
  id: string;
  status: 'pending';
};

export type AcceptDeveloperRequestBody = {
  userId: string;
  requestId?: string;
};

export type AccessListResponse = {
  access: AccessKey[];
};

