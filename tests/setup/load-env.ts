import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_FILES = ['.env.test.local', '.env.local', '.env'];

for (const file of ENV_FILES) {
  const fullPath = resolve(__dirname, '..', '..', file);
  if (existsSync(fullPath)) {
    loadEnv({ path: fullPath });
  }
}

