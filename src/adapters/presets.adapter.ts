import type { VerifyPresetsResponse as PresetsVerifyResponse } from '@structures/VerifyPresetsResponse';
import type { PresetError } from '@structures/PresetError';
import type { PresetResult } from '@structures/PresetResult';
import type { PresetStatus } from '@utils/ts-types/common';
import type { RateLimitInfo } from '../types/rate-limit';
import { PresetRegistry, type DeveloperPresetKey } from './preset-registry';

export interface PresetCheckResult {
  preset: DeveloperPresetKey;
  presetName: string;
  scope: string;
  value: boolean;
  status: PresetStatus;
  expiresAt: string;
  verifiedAt?: string;
  evidence?: Record<string, unknown>;
  rateLimit?: RateLimitInfo;
}

export interface PresetErrorResult {
  preset: DeveloperPresetKey;
  presetName: string;
  scope: string;
  error: PresetError;
}

export interface PresetBatchResult {
  results: PresetCheckResult[];
  errors: PresetErrorResult[];
  raw: PresetsVerifyResponse;
  rateLimit?: RateLimitInfo;
}

export class PresetsAdapter {
  constructor(private readonly registry: PresetRegistry) {}

  fromBatchResponse(
    response: PresetsVerifyResponse,
    context?: { rateLimit?: RateLimitInfo },
  ): PresetBatchResult {
    const results: PresetCheckResult[] = (response.results ?? []).map((result) =>
      this.mapResult(result, context?.rateLimit),
    );
    const errors: PresetErrorResult[] = (response.errors ?? []).map((error) =>
      this.mapError(error),
    );

    return {
      results,
      errors,
      raw: response,
      rateLimit: context?.rateLimit,
    };
  }

  fromSingleResponse(
    response: PresetsVerifyResponse,
    context?: { rateLimit?: RateLimitInfo },
  ): PresetCheckResult {
    const batch = this.fromBatchResponse(response, context);
    if (!batch.results.length) {
      const message =
        batch.errors.length > 0
          ? batch.errors.map((error) => error.error.error_description ?? error.error.error).join('; ')
          : 'Preset verification did not return any results';
      throw new Error(message);
    }
    return batch.results[0];
  }

  private mapResult(result: PresetResult, rateLimit?: RateLimitInfo): PresetCheckResult {
    const descriptor = this.registry.resolveByPresetName(result.preset);
    return {
      preset: descriptor.developerKey,
      presetName: descriptor.presetName,
      scope: descriptor.scope,
      value: result.value,
      status: result.status,
      expiresAt: result.expires_at,
      verifiedAt: result.verified_at,
      evidence: result.evidence,
      rateLimit,
    };
  }

  private mapError(error: { preset: string; error: PresetError }): PresetErrorResult {
    const descriptor = this.registry.resolveByPresetName(error.preset);
    return {
      preset: descriptor.developerKey,
      presetName: descriptor.presetName,
      scope: descriptor.scope,
      error: error.error,
    };
  }
}

