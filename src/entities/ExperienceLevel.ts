export interface Experience {
  level: number;
  totalExperience: number;
  experienceToLevelUp: number;
}

export const EXPERIENCE_TABLE: Experience[] = [
  { level: 1, totalExperience: 1000, experienceToLevelUp: 1000 },
  { level: 2, totalExperience: 8000, experienceToLevelUp: 7000 },
  { level: 3, totalExperience: 27000, experienceToLevelUp: 19000 },
  { level: 4, totalExperience: 64000, experienceToLevelUp: 37000 },
  { level: 5, totalExperience: 125000, experienceToLevelUp: 61000 },
  { level: 6, totalExperience: 216000, experienceToLevelUp: 91000 },
  { level: 7, totalExperience: 343000, experienceToLevelUp: 127000 },
  { level: 8, totalExperience: 512000, experienceToLevelUp: 169000 },
  { level: 9, totalExperience: 729000, experienceToLevelUp: 217000 },
  { level: 10, totalExperience: 1000000, experienceToLevelUp: 271000 },
  { level: 11, totalExperience: 1331000, experienceToLevelUp: 331000 },
  { level: 12, totalExperience: 1728000, experienceToLevelUp: 397000 },
  { level: 13, totalExperience: 2197000, experienceToLevelUp: 469000 },
  { level: 14, totalExperience: 2744000, experienceToLevelUp: 547000 },
  { level: 15, totalExperience: 3375000, experienceToLevelUp: 631000 },
  { level: 16, totalExperience: 4096000, experienceToLevelUp: 721000 },
  { level: 17, totalExperience: 4913000, experienceToLevelUp: 817000 },
  { level: 18, totalExperience: 5832000, experienceToLevelUp: 919000 },
  { level: 19, totalExperience: 6859000, experienceToLevelUp: 1027000 },
  { level: 20, totalExperience: 8000000, experienceToLevelUp: 1141000 },
  { level: 21, totalExperience: 9261000, experienceToLevelUp: 1261000 },
  { level: 22, totalExperience: 10648000, experienceToLevelUp: 1387000 },
  { level: 23, totalExperience: 12167000, experienceToLevelUp: 1519000 },
  { level: 24, totalExperience: 13824000, experienceToLevelUp: 1657000 },
  { level: 25, totalExperience: 15625000, experienceToLevelUp: 1801000 },
  { level: 26, totalExperience: 17576000, experienceToLevelUp: 1951000 },
  { level: 27, totalExperience: 19683000, experienceToLevelUp: 2107000 },
  { level: 28, totalExperience: 21952000, experienceToLevelUp: 2269000 },
  { level: 29, totalExperience: 24389000, experienceToLevelUp: 2437000 },
  { level: 30, totalExperience: 29700000, experienceToLevelUp: 5311000 },
  { level: 31, totalExperience: 32770100, experienceToLevelUp: 3070100 },
  { level: 32, totalExperience: 36044800, experienceToLevelUp: 3274700 },
  { level: 33, totalExperience: 39530700, experienceToLevelUp: 3485900 },
  { level: 34, totalExperience: 43234400, experienceToLevelUp: 3703700 },
  { level: 35, totalExperience: 51450000, experienceToLevelUp: 8215600 },
  { level: 36, totalExperience: 55987200, experienceToLevelUp: 4537200 },
  { level: 37, totalExperience: 60783600, experienceToLevelUp: 4796400 },
  { level: 38, totalExperience: 65846400, experienceToLevelUp: 5062800 },
  { level: 39, totalExperience: 71182800, experienceToLevelUp: 5336400 },
  { level: 40, totalExperience: 83200000, experienceToLevelUp: 12017200 },
  { level: 41, totalExperience: 89597296, experienceToLevelUp: 6397296 },
  { level: 42, totalExperience: 96314400, experienceToLevelUp: 6717104 },
  { level: 43, totalExperience: 103359104, experienceToLevelUp: 7044704 },
  { level: 44, totalExperience: 110739200, experienceToLevelUp: 7380096 },
  { level: 45, totalExperience: 127575000, experienceToLevelUp: 16835800 },
  { level: 46, totalExperience: 136270400, experienceToLevelUp: 8695400 },
  { level: 47, totalExperience: 145352192, experienceToLevelUp: 9081792 },
  { level: 48, totalExperience: 154828800, experienceToLevelUp: 9476608 },
  { level: 49, totalExperience: 164708608, experienceToLevelUp: 9879808 },
  { level: 50, totalExperience: 175000000, experienceToLevelUp: 10291392 },
  { level: 51, totalExperience: 198976496, experienceToLevelUp: 23976496 },
  { level: 52, totalExperience: 224972800, experienceToLevelUp: 25996304 },
  { level: 53, totalExperience: 253090896, experienceToLevelUp: 28118096 },
  { level: 54, totalExperience: 299181600, experienceToLevelUp: 46090704 },
  { level: 55, totalExperience: 349387488, experienceToLevelUp: 50205888 },
  { level: 56, totalExperience: 403916800, experienceToLevelUp: 54529312 },
  { level: 57, totalExperience: 462982496, experienceToLevelUp: 59065696 },
  { level: 58, totalExperience: 526802400, experienceToLevelUp: 63819904 },
  { level: 59, totalExperience: 616137024, experienceToLevelUp: 89334624 },
  { level: 60, totalExperience: 669600000, experienceToLevelUp: 53462976 },
  { level: 61, totalExperience: 703641088, experienceToLevelUp: 34041088 },
  { level: 62, totalExperience: 738816768, experienceToLevelUp: 35175680 },
  { level: 63, totalExperience: 775145728, experienceToLevelUp: 36328960 },
  { level: 64, totalExperience: 812646400, experienceToLevelUp: 37500672 },
  { level: 65, totalExperience: 851337472, experienceToLevelUp: 38691072 },
  { level: 66, totalExperience: 891237632, experienceToLevelUp: 39900160 },
  { level: 67, totalExperience: 932365312, experienceToLevelUp: 41127680 },
  { level: 68, totalExperience: 974739200, experienceToLevelUp: 42373888 },
  { level: 69, totalExperience: 1018377920, experienceToLevelUp: 43638720 },
  { level: 70, totalExperience: 1063299968, experienceToLevelUp: 44922048 },
  { level: 71, totalExperience: 1109524096, experienceToLevelUp: 46224128 },
  { level: 72, totalExperience: 1157068800, experienceToLevelUp: 47544704 },
  { level: 73, totalExperience: 1205952640, experienceToLevelUp: 48883840 },
  { level: 74, totalExperience: 1256194432, experienceToLevelUp: 50241792 },
  { level: 75, totalExperience: 1307812480, experienceToLevelUp: 51618048 },
  { level: 76, totalExperience: 1360825600, experienceToLevelUp: 53013120 },
  { level: 77, totalExperience: 1415252352, experienceToLevelUp: 54426752 },
  { level: 78, totalExperience: 1471111168, experienceToLevelUp: 55858816 },
  { level: 79, totalExperience: 1528420864, experienceToLevelUp: 57309696 },
  { level: 80, totalExperience: 1587200000, experienceToLevelUp: 58779136 },
  { level: 81, totalExperience: 1647467136, experienceToLevelUp: 60267136 },
  { level: 82, totalExperience: 1709240832, experienceToLevelUp: 61773696 },
  { level: 83, totalExperience: 1772539648, experienceToLevelUp: 63298816 },
  { level: 84, totalExperience: 1837382400, experienceToLevelUp: 64842752 },
  { level: 85, totalExperience: 1903787520, experienceToLevelUp: 66405120 },
  { level: 86, totalExperience: 1971773568, experienceToLevelUp: 67986048 },
  { level: 87, totalExperience: 2041359360, experienceToLevelUp: 69585792 },
  { level: 88, totalExperience: 2112563200, experienceToLevelUp: 71203840 },
  { level: 89, totalExperience: 2185403904, experienceToLevelUp: 72840704 },
  { level: 90, totalExperience: 2259899904, experienceToLevelUp: 74496000 },
  { level: 91, totalExperience: 2336070144, experienceToLevelUp: 76170240 },
  { level: 92, totalExperience: 2413932800, experienceToLevelUp: 77862656 },
  { level: 93, totalExperience: 2493506816, experienceToLevelUp: 79574016 },
  { level: 94, totalExperience: 2574810368, experienceToLevelUp: 81303552 },
  { level: 95, totalExperience: 2657862400, experienceToLevelUp: 83052032 },
  { level: 96, totalExperience: 2742681600, experienceToLevelUp: 84819200 },
  { level: 97, totalExperience: 2829286400, experienceToLevelUp: 86604800 },
  { level: 98, totalExperience: 2917695232, experienceToLevelUp: 88408832 },
  { level: 99, totalExperience: 3007926784, experienceToLevelUp: 90231552 },
  { level: 100, totalExperience: 3100000000, experienceToLevelUp: 92073216 },
];

export function getExperienceLevel(experience: number): Experience {
  // Maximum level cap at 60.999999
  const maxLevel = 60;
  const level61Threshold =
    EXPERIENCE_TABLE.find((exp) => exp.level === 61)?.totalExperience ||
    703641088;

  // If experience is at or above level 61 threshold
  if (experience >= level61Threshold) {
    // Return a modified level 60 entry that shows full XP bar
    return {
      level: maxLevel,
      totalExperience:
        EXPERIENCE_TABLE.find((exp) => exp.level === maxLevel)
          ?.totalExperience || 669600000,
      experienceToLevelUp: level61Threshold - 669600000, // The XP needed to go from 60 to 61
    };
  }

  // Normal behavior for levels 60 and below
  for (let i = EXPERIENCE_TABLE.length - 1; i >= 0; i--) {
    if (experience >= EXPERIENCE_TABLE[i].totalExperience) {
      return EXPERIENCE_TABLE[i];
    }
  }
  return EXPERIENCE_TABLE[0];
}
