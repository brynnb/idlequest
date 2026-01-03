import { describe, it, expect } from "vitest";
import { formatPrice } from "@utils/itemUtils";

describe("formatPrice", () => {
  it("formats copper into correct denominations", () => {
    expect(formatPrice(1234)).toBe("1p 2g 3s 4c");
    expect(formatPrice(5000)).toBe("5p 0g 0s 0c");
    expect(formatPrice(99)).toBe("0p 0g 9s 9c");
    expect(formatPrice(0)).toBe("0p 0g 0s 0c");
  });
});
