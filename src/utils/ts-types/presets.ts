import type { IsoDateString, PresetStatus } from './common';

export enum PresetScope {
  IS_HUMAN = 'hp:presets.is_human',
  IS_18_PLUS = 'hp:presets.is_18_plus',
  IS_21_PLUS = 'hp:presets.is_21_plus',
  IS_ACCREDITED_INVESTOR = 'hp:presets.is_accredited_investor',
  IS_QUALIFIED_PURCHASER = 'hp:presets.is_qualified_purchaser',
  IS_INSTITUTIONAL_INVESTOR = 'hp:presets.is_institutional_investor',
  PALM_VERIFIED = 'hp:presets.palm_verified',
  AGE_GATE_ALCOHOL = 'hp:presets.age_gate_alcohol',
  AGE_GATE_GAMBLING = 'hp:presets.age_gate_gambling',
  INVESTMENT_GATE = 'hp:presets.investment_gate',
}

export type PresetName =
  | 'is_human'
  | 'is_18_plus'
  | 'is_21_plus'
  | 'is_accredited_investor'
  | 'is_qualified_purchaser'
  | 'is_institutional_investor'
  | 'palm_verified'
  | 'age_gate_alcohol'
  | 'age_gate_gambling'
  | 'investment_gate';

export const PRESET_SCOPE_MAP: Record<PresetName, PresetScope> = {
  is_human: PresetScope.IS_HUMAN,
  is_18_plus: PresetScope.IS_18_PLUS,
  is_21_plus: PresetScope.IS_21_PLUS,
  is_accredited_investor: PresetScope.IS_ACCREDITED_INVESTOR,
  is_qualified_purchaser: PresetScope.IS_QUALIFIED_PURCHASER,
  is_institutional_investor: PresetScope.IS_INSTITUTIONAL_INVESTOR,
  palm_verified: PresetScope.PALM_VERIFIED,
  age_gate_alcohol: PresetScope.AGE_GATE_ALCOHOL,
  age_gate_gambling: PresetScope.AGE_GATE_GAMBLING,
  investment_gate: PresetScope.INVESTMENT_GATE,
};

export enum ErrorCode {
  E4003 = 'E4003',
  E4004 = 'E4004',
  E4010 = 'E4010',
  E4041 = 'E4041',
  E4042 = 'E4042',
  E4044 = 'E4044',
}

export type ConsentPresetsRequest = {
  presets: Array<{
    name: PresetName;
    value: boolean | string | number;
  }>;
  computed_at: IsoDateString;
};

export type ConsentPresetsResponse = {
  accepted: boolean;
  expires_at?: IsoDateString;
};

export type PresetResult = {
  preset: PresetName;
  value: boolean;
  status: PresetStatus;
  expires_at: IsoDateString;
  verified_at?: IsoDateString;
  evidence?: Record<string, unknown>;
};

export type VerifyPresetResponse = PresetResult;

export type VerifyPresetsRequest = {
  presets: PresetName[];
};

export type PresetError = {
  error: string;
  error_code: ErrorCode;
  error_description: string;
  error_subcode?: string;
  context?: Record<string, unknown>;
};

export type VerifyPresetsResponse = {
  results: PresetResult[];
  errors: Array<{ preset: PresetName; error: PresetError }>;
};

