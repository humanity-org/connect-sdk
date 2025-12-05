import type { IsoDateString } from './common';

export type AccessKey = 'standard' | 'developer' | 'admin';

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

