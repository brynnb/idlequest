export const getRaceImageUrl = (raceName: string, gender: "m" | "f") => {
    if (!raceName) return "";

    const formattedRaceName = raceName.toLowerCase().replace(/[\s-]+/g, "");

    // List of races that have female images
    const hasFemale = [
        "dwarf",
        "gnome",
        "halfelf", // Correctly has no dash as per file system
        "halfling",
        "highelf",
        "human",
        "iksar",
        "ogre",
    ].includes(formattedRaceName);

    // If female requested but not available, fallback to male
    // If male requested, use male (assuming all have male based on file list)
    const suffix = gender === "f" && hasFemale ? "f" : "m";

    return `/images/ui/charactercreation/races/${formattedRaceName}_${suffix}.png`;
};
