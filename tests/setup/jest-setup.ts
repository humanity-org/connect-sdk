import { setTimeout as delay } from 'node:timers/promises';

const DEFAULT_TIMEOUT_MS = Number(process.env.HUMANITY_SDK_TEST_TIMEOUT_MS ?? '60000');
const RATE_LIMIT_DELAY_MS = Number(process.env.HUMANITY_SDK_TEST_DELAY_MS ?? '500');

jest.setTimeout(DEFAULT_TIMEOUT_MS);

afterEach(async () => {
  if (RATE_LIMIT_DELAY_MS > 0) {
    await delay(RATE_LIMIT_DELAY_MS);
  }
});

