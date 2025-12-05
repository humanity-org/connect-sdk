import type { AuthorizationsQuery as StatusAuthorizationsQuery } from '@structures/AuthorizationsQuery';
import type { AuthorizationsResponse as StatusAuthorizationsResponse } from '@structures/AuthorizationsResponse';
import type { CredentialsQuery as StatusCredentialsQuery } from '@structures/CredentialsQuery';
import type { CredentialsResponse as StatusCredentialsResponse } from '@structures/CredentialsResponse';
import type { AuthorizationUpdate, CredentialItem } from '@utils/ts-types/status';
import type { RateLimitInfo } from '../types/rate-limit';
import { PresetRegistry, type DeveloperPresetKey } from './preset-registry';

export interface CredentialRecord {
  preset: DeveloperPresetKey;
  presetName: string;
  scope: string;
  value: boolean;
  status: CredentialItem['status'];
  userId: string;
  expiresAt: string;
  updatedAt: string;
}

export interface CredentialUpdates {
  credentials: CredentialRecord[];
  lastModified?: string;
  hasMore?: boolean;
  raw: StatusCredentialsResponse;
  rateLimit?: RateLimitInfo;
}

export interface AuthorizationRecord {
  authorizationId: string;
  organizationId: string;
  appScopedUserId: string;
  status: AuthorizationUpdate['status'];
  updatedAt: string;
}

export interface AuthorizationUpdates {
  authorizations: AuthorizationRecord[];
  lastModified?: string;
  hasMore?: boolean;
  raw: StatusAuthorizationsResponse;
  rateLimit?: RateLimitInfo;
}

export class StatusAdapter {
  constructor(private readonly registry: PresetRegistry) {}

  fromCredentialsResponse(
    response: StatusCredentialsResponse,
    context?: { rateLimit?: RateLimitInfo },
  ): CredentialUpdates {
    const credentials: CredentialRecord[] = (response.items ?? []).map((item) => {
      const descriptor = this.registry.resolveByPresetName(item.preset);
      return {
        preset: descriptor.developerKey,
        presetName: descriptor.presetName,
        scope: descriptor.scope,
        value: item.value,
        status: item.status,
        userId: item.user_id,
        expiresAt: item.expires_at,
        updatedAt: item.updated_at,
      };
    });
    return {
      credentials,
      lastModified: response.last_modified,
      hasMore: response.has_more ?? false,
      raw: response,
      rateLimit: context?.rateLimit,
    };
  }

  fromAuthorizationsResponse(
    response: StatusAuthorizationsResponse,
    context?: { rateLimit?: RateLimitInfo },
  ): AuthorizationUpdates {
    const authorizations: AuthorizationRecord[] = (response.items ?? []).map((item) => ({
      authorizationId: item.authorization_id,
      organizationId: item.organization_id,
      appScopedUserId: item.app_scoped_user_id,
      status: item.status,
      updatedAt: item.updated_at,
    }));
    return {
      authorizations,
      lastModified: response.last_modified,
      hasMore: response.has_more ?? false,
      raw: response,
      rateLimit: context?.rateLimit,
    };
  }

  normalizeCredentialsQuery(query: StatusCredentialsQuery): StatusCredentialsQuery {
    return query;
  }

  normalizeAuthorizationsQuery(query: StatusAuthorizationsQuery): StatusAuthorizationsQuery {
    if (query.status) {
      return query;
    }
    return {
      ...query,
      status: 'revoked',
    };
  }
}

