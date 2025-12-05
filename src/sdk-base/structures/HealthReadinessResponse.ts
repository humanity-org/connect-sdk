import type { HealthReadinessCheck } from "./HealthReadinessCheck";

export type HealthReadinessResponse = {
  status: "ready" | "not_ready";
  checks: HealthReadinessCheck[];
};
