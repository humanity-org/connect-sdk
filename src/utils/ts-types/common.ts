export type IsoDateString = string;
export type UUID = string;

export type PresetStatus = 'valid' | 'expired' | 'pending' | 'unavailable';
export type AuthorizationStatus = 'active' | 'revoked';

export type ApiError = {
  code: string;
  message: string;
  request_id?: string;
  status_code?: number;
  details?: unknown;
};

