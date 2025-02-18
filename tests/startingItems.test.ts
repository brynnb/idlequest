import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { StartingItems } from "../src/entities/StartingItems";
import CharCreateCombination from "../src/entities/CharCreateCombination";
import charCreateCombinations from "@data/json/char_create_combinations.json";
import startingItemsData from "@data/json/starting_items.json";

describe("Starting Items Validation", () => {
  it("ensures every char_create_combination has a matching starting item", () => {
    const charCreateCombinationsPath = path.join(
      __dirname,
      "../data/char_create_combinations.json"
    );
    const startingItemsPath = path.join(
      __dirname,
      "../data/starting_items.json"
    );

    const charCreateCombinations: CharCreateCombination[] = JSON.parse(
      fs.readFileSync(charCreateCombinationsPath, "utf-8")
    );
    const startingItems: StartingItems[] = JSON.parse(
      fs.readFileSync(startingItemsPath, "utf-8")
    );

    const missingCombinations: CharCreateCombination[] = [];

    charCreateCombinations.forEach((combination) => {
      const matchingItem = startingItems.find((item) => {
        const classMatch =
          item.class === 0 ||
          item.class === combination.class ||
          (item.class_list &&
            item.class_list.split(",").includes(combination.class.toString()));
        const deityMatch =
          item.deityid === 0 || item.deityid === combination.deity;
        const zoneMatch =
          !item.zone_id_list ||
          item.zone_id_list
            .split(",")
            .includes(combination.start_zone.toString());

        return classMatch && deityMatch && zoneMatch;
      });

      if (!matchingItem) {
        missingCombinations.push(combination);
      }
    });

    if (missingCombinations.length > 0) {
      console.log(
        "Missing combinations:",
        JSON.stringify(missingCombinations, null, 2)
      );
    }

    expect(missingCombinations).toHaveLength(0);
  });
});
