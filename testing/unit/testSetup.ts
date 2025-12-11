import { beforeAll } from "vitest";
import { initDatabase } from "@utils/databaseOperations";
// import { zoneCache } from "../src/utils/zoneCache";

beforeAll(async () => {
  await initDatabase(true);
  // await zoneCache.initialize();
});
