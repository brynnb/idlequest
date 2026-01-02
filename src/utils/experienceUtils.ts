/**
 * Calculates experience progress based on server-sent percent
 * @param xpPercentRaw - 0-10000 from server representing 0.00% to 100.00%
 */
export function calculateExperienceProgress(xpPercentRaw: number) {
  // Convert 0-10000 to 0-1.0 (float) for StatBar
  const xpPercent = Math.min(1, Math.max(0, xpPercentRaw / 10000));

  // Calculate sub-bar (each bubble is 10% of total)
  // xpPercentRaw % 1000 gives us the progress within the current 10% chunk (0-999)
  // Divide by 1000 to get 0-1.0 scale
  const xpPercentSubbar = (xpPercentRaw % 1000) / 1000;

  return {
    xpPercent,
    xpPercentSubbar,
    // Legacy fields for UI compatibility
    totalExperience: xpPercentRaw,
    experienceToLevelUp: 10000,
    remainingExperience: 10000 - xpPercentRaw,
  };
}
