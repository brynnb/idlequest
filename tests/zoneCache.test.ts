import { describe, it, expect, beforeEach, vi } from 'vitest';
import { zoneCache } from '../src/utils/zoneCache';
import * as databaseOperations from '../src/utils/databaseOperations';

// Mock the database operations with real data
vi.mock('../src/utils/databaseOperations', () => ({
  initDatabase: vi.fn(),
  getDatabase: vi.fn(() => ({
    exec: vi.fn(() => [{
      values: [
        [54, 'gfaydark'],
        [118, 'greatdivide'],
        [163, 'griegsend'],
        [167, 'grimling'],
        [52, 'grobb'],
        [127, 'growthplane'],
        [66, 'gukbottom']
      ]
    }])
  }))
}));

describe('ZoneCache', () => {
  beforeEach(async () => {
    vi.clearAllMocks(); // Clear mock calls before each test
    await zoneCache.initialize(true); // Force reinitialization for each test
  });

  // it("should initialize with mock data", () => {
  //   expect(databaseOperations.getDatabase).toHaveBeenCalled();
  // });

  it("should return correct name for a given ID", () => {
    expect(zoneCache.getNameById(54)).toBe('gfaydark');
    expect(zoneCache.getNameById(118)).toBe('greatdivide');
    expect(zoneCache.getNameById(52)).toBe('grobb');
  });

  it("should return correct ID for a given name", () => {
    expect(zoneCache.getIdByName('gfaydark')).toBe(54);
    expect(zoneCache.getIdByName('greatdivide')).toBe(118);
    expect(zoneCache.getIdByName('grobb')).toBe(52);
  });

  it("should return undefined for non-existent ID", () => {
    expect(zoneCache.getNameById(999)).toBeUndefined();
  });

  it("should return undefined for non-existent name", () => {
    expect(zoneCache.getIdByName('nonexistent')).toBeUndefined();
  });
});
