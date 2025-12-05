import type { PresetName } from './presets';

export type HpScopeDescriptor = {
  id: string;
  display_name: string;
  description: string;
  category: string;
  implied_scopes?: string[];
  is_default?: boolean;
};

export type HpConfigurationPreset = {
  name: PresetName;
  scope: string;
  type: 'boolean' | 'enum' | 'bundled';
  description: string;
  consent_text: string;
};

export type HpConfiguration = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  revoke_endpoint: string;
  consent_presets_endpoint: string;
  presets_endpoint: string;
  presets_batch_endpoint: string;
  credentials_endpoint: string;
  authorizations_endpoint: string;
  hp_configuration_endpoint: string;
  scopes_supported: string[];
  scopes_catalog: HpScopeDescriptor[];
  grant_types_supported: string[];
  code_challenge_methods_supported: string[];
  response_types_supported: string[];
  presets_available: HpConfigurationPreset[];
  rate_limit_default: number;
  rate_limit_unit: string;
};

