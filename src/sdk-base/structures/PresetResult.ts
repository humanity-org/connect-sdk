import type { Recordstringstringnumberbooleannull } from "./Recordstringstringnumberbooleannull";

export type PresetResult = {
  preset:
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
  value: boolean;
  status: "valid" | "expired" | "pending" | "unavailable";
  expires_at: string;
  verified_at?: undefined | string;
  evidence?: undefined | Recordstringstringnumberbooleannull;
};
