export type HpConfigurationPreset = {
  name:
    | "is_human"
    | "is_18_plus"
    | "is_21_plus"
    | "is_accredited_investor"
    | "is_qualified_purchaser"
    | "is_institutional_investor"
    | "palm_verified"
    | "age_gate_alcohol"
    | "age_gate_gambling"
    | "investment_gate"
    | "humanity_user";
  scope: string;
  type: "boolean" | "enum" | "bundled";
  description: string;
  consent_text: string;
};
