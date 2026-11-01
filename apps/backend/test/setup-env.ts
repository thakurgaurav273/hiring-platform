/**
 * Test environment. Runs before any module is imported, so src/config/env.ts
 * sees these values (dotenv never overrides variables that are already set).
 *
 * Tests run against a dedicated database: TEST_DATABASE_URL, or a local
 * `grovyn_test` database by default. They refuse to run against a database
 * whose name does not contain "test".
 */
import os from "os";
import path from "path";

export const TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL ??
    `postgresql://${encodeURIComponent(os.userInfo().username)}@localhost:5432/grovyn_test?schema=public`;

if (!/test/i.test(new URL(TEST_DATABASE_URL).pathname)) {
    throw new Error(`Refusing to run tests against non-test database: ${TEST_DATABASE_URL}`);
}

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = "test-jwt-secret-0123456789";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-0123456789";
process.env.JWT_EXPIRY = "15m";
process.env.STORAGE_PROVIDER = "local";
process.env.LOCAL_STORAGE_DIR = path.join(os.tmpdir(), "robin-talent-test-uploads");
process.env.RATE_LIMIT_MAX = "100000";
process.env.API_BASE_URL = "http://api.test";
