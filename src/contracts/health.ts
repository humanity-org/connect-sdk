export type HealthLivenessResponse = {
  status: 'ok';
  uptime: number;
  version: string;
  commit: string | null;
  timestamp: string;
};

export type HealthReadinessCheck = {
  name: string;
  ok: boolean;
  details?: unknown;
};

export type HealthReadinessResponse = {
  status: 'ready' | 'not_ready';
  checks: HealthReadinessCheck[];
};

