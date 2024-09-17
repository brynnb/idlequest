export enum ItemClass {
  COMMON_ITEM = 0,
  CONTAINER = 1,
  BOOK = 2,
}

export function getItemClassName(itemClass: ItemClass): string {
  const names: Record<ItemClass, string> = {
    [ItemClass.COMMON_ITEM]: "Common item",
    [ItemClass.CONTAINER]: "Container",
    [ItemClass.BOOK]: "Book",
  };

  return names[itemClass] || "Unknown";
}
