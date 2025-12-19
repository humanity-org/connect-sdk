import type { Recordstringstringnumberbooleanstringnull } from "./Recordstringstringnumberbooleanstringnull";

export type PresetError = {
  error: string;
  error_code: "E4003" | "E4004" | "E4010" | "E4041" | "E4042" | "E4044";
  error_description: string;
  error_subcode?: undefined | string;
  context?: undefined | Recordstringstringnumberbooleanstringnull;
};
