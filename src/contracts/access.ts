import type {
  AcceptDeveloperRequestBody,
  AccessListResponse,
  CreateStandardAccessRequestResponse,
} from '@utils/ts-types/access';

export type AccessApplyStandardResponse = CreateStandardAccessRequestResponse;

export type AccessAcceptDeveloperRequest = AcceptDeveloperRequestBody;
export type AccessAcceptDeveloperResponse = { ok: true };

export type AccessListMeResponse = AccessListResponse;

