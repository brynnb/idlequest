import { describe, it, expect } from "vitest";
import useRandomName from "@hooks/useRandomName";

describe("useRandomName", () => {
  it("generates a random name", () => {
    const { generateRandomName } = useRandomName();
    const name = generateRandomName();
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThanOrEqual(5);
    expect(name.length).toBeLessThanOrEqual(15);
    expect(name[0]).toBe(name[0].toUpperCase());
  });

  it("generates different names on subsequent calls", () => {
    const { generateRandomName } = useRandomName();
    const name1 = generateRandomName();
    const name2 = generateRandomName();
    expect(name1).not.toBe(name2);
  });

  it("generates names with valid patterns", () => {
    const { generateRandomName } = useRandomName();
    const names = Array.from({ length: 10 }, () => generateRandomName());
    console.log('Generated names:', names);
    const validPattern =
      /^[A-Z][a-z]{3,8}(a|e|i|o|u|os|as|us|is|y|an|en|in|on|un)$/;
    names.forEach((name) => {
      expect(name).toMatch(validPattern);
    });
  });
});


