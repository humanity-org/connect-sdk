export type ConsentPresetsRequest = {
  presets: {
    name:
      | "is_human"
      | "is_18_plus"
      | "is_21_plus"
      | "net_worth_over_10k"
      | "net_worth_over_100k"
      | "palm_verified"
      | "humanity_user"
      | "proof_of_assets"
      | "proof_of_investments"
      | "proof_of_mortgage"
      | "proof_of_residency"
      | "proof_of_retirement";
    value: string | number | boolean;
  }[];
  computed_at: string;
};
