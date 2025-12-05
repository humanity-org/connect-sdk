export type HpScopeDescriptor = {
  id: string;
  display_name: string;
  description: string;
  category: string;
  implied_scopes?: undefined | string[];
  is_default?: undefined | boolean;
};
