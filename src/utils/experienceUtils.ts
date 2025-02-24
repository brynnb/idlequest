import {
  getExperienceLevel,
  EXPERIENCE_TABLE,
} from "@entities/ExperienceLevel";

export function calculateExperienceProgress(currentExp: number) {
  const currentLevelData = getExperienceLevel(currentExp);
  const nextLevelData = EXPERIENCE_TABLE[currentLevelData.level];

  const expForCurrentLevel = currentLevelData.totalExperience;
  const expForNextLevel = nextLevelData
    ? nextLevelData.totalExperience
    : currentLevelData.totalExperience;
  const expIntoCurrentLevel = currentExp - expForCurrentLevel;
  const expNeededForNextLevel = expForNextLevel - expForCurrentLevel;

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
