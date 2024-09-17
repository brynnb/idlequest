export enum ItemSize {
  TINY = 0,
  SMALL = 1,
  MEDIUM = 2,
  LARGE = 3,
  GIANT = 4,
  GIGANTIC = 5,
}

export function getItemSizeName(size: ItemSize): string {
  const names: Record<ItemSize, string> = {
    [ItemSize.TINY]: "TINY",
    [ItemSize.SMALL]: "SMALL",
    [ItemSize.MEDIUM]: "MEDIUM",
    [ItemSize.LARGE]: "LARGE",
    [ItemSize.GIANT]: "GIANT",
    [ItemSize.GIGANTIC]: "GIGANTIC",
  };

  return names[size] || "Unknown";
}
