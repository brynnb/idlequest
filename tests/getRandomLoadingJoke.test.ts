import { describe, it, expect } from "vitest";
import { LoadingJokeUtil } from "../src/utils/getRandomLoadingJoke";

describe("LoadingJokeUtil", () => {
  it("should return a string from the jokes array", () => {
    const joke = LoadingJokeUtil.getRandomLoadingJoke();
    expect(typeof joke).toBe("string");
    expect(joke.length).toBeGreaterThan(0);
  });

  it("should return different jokes on multiple calls", () => {
    const jokes = new Set();
    for (let i = 0; i < 100; i++) {
      jokes.add(LoadingJokeUtil.getRandomLoadingJoke());
    }
    expect(jokes.size).toBeGreaterThan(1);
  });

  it("should only return jokes from the predefined list", () => {
    const joke = LoadingJokeUtil.getRandomLoadingJoke();
    // Using type assertion to access private static property for testing
    const jokesArray = (LoadingJokeUtil as { jokes: string[] }).jokes;
    expect(jokesArray).toContain(joke);
  });
});
