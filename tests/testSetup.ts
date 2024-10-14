import { beforeAll } from 'vitest';
import { initDatabase } from "../src/utils/databaseOperations";
// import { zoneCache } from "../src/utils/zoneCache";

beforeAll(async () => {
  await initDatabase(true);
  // await zoneCache.initialize();
});
