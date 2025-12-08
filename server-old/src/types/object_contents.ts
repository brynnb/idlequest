/**
 * Types related to object contents
 * Based on the object_contents table in the database
 */

/**
 * Represents object contents from the database
 */
export interface ObjectContents {
  zoneid: number;
  parentid: number;
  bagidx: number;
  itemid: number;
  charges: number;
  droptime: string;
}

/**
 * Represents a simplified view of object contents
 */
export interface SimpleObjectContent {
  zoneId: number;
  parentId: number;
  bagIndex: number;
  itemId: number;
  charges: number;
  dropTime: string;
}

/**
 * Converts an ObjectContents object to a SimpleObjectContent object
 */
export function toSimpleObjectContent(
  content: ObjectContents
): SimpleObjectContent {
  return {
    zoneId: content.zoneid,
    parentId: content.parentid,
    bagIndex: content.bagidx,
    itemId: content.itemid,
    charges: content.charges,
    dropTime: content.droptime,
  };
}
