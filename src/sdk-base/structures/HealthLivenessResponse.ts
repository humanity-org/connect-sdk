export type HealthLivenessResponse = {
  status: "ok";
  uptime: number;
  version: string;
  commit: null | string;
  timestamp: string;
};
