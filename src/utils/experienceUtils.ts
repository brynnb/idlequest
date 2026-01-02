import {
  getExperienceLevel,
  EXPERIENCE_TABLE,
} from "@entities/ExperienceLevel";

export function calculateExperienceProgress(currentExp: number) {
  const currentLevelData = getExperienceLevel(currentExp);
  const nextLevelData = EXPERIENCE_TABLE[currentLevelData.level];

  // The user has confirmed that Level 1 starts at 1000 XP (Base).
  // This means the table's 'totalExperience' represents the FLOOR of that level.
  // Level 1: 1000 XP (Floor) -> 8000 XP (Next Floor).
  // Level 2: 8000 XP (Floor) -> 27000 XP (Next Floor).
  const expForCurrentLevel = currentLevelData.totalExperience;

  // Hande the case where users might have < 1000 XP (e.g. 0 XP).
  // For display purposes, we treat them as Level 1, but with negative progress relative to the 1000 base
  // OR we just clamp it to 0 for the bar calculation to show "Empty Bar".
  const rawExpIntoLevel = currentExp - expForCurrentLevel;
  const expIntoCurrentLevel = Math.max(0, rawExpIntoLevel);

  // Calculate the full range of the current level (Distance to next level)
  let rangeSize = currentLevelData.experienceToLevelUp; // Default fallback from table

  if (nextLevelData) {
    // If there is a next level, the range is (Next Start - Current Start)
    // Level 1: 8000 - 1000 = 7000 range.
    // Level 2: 27000 - 8000 = 19000 range.
    rangeSize = nextLevelData.totalExperience - currentLevelData.totalExperience;
  }

  const expNeededForNextLevel = rangeSize;

  const totalProgressPercent = expIntoCurrentLevel / expNeededForNextLevel;

  // Show the actual progress in the main bar
  const xpPercent = totalProgressPercent;

  // Calculate which segment we're in (0-4) and the progress within that segment
  const currentSegment = Math.floor(totalProgressPercent * 5);
  const progressInSegment = totalProgressPercent * 5 - currentSegment;

  // This is the percentage filled in the current subbar segment
  const xpPercentSubbar = progressInSegment;

  return {
    xpPercent,
    xpPercentSubbar,
    currentLevel: currentLevelData.level,
    expIntoCurrentLevel,
    expNeededForNextLevel,
  };
}
