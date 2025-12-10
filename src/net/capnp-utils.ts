import * as $ from "capnp-es";

/**
 * Sets fields on a Cap'n Proto struct from a plain JS object.
 * Handles both scalar values and arrays (lists).
 */
export function setStructFields<T extends $.Struct>(
  struct: T,
  data: Partial<Record<keyof T, unknown>>
): void {
  for (const [rawKey, value] of Object.entries(data)) {
    if (value === undefined) continue;
    const key = rawKey as keyof T;

    // 1) Detect a JS array → list case
    if (Array.isArray(value)) {
      // build the "initArgs" method name
      const initName = `_init${String(key)[0].toUpperCase()}${String(key).slice(
        1
      )}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initFn = (struct as any)[initName] as
        | ((n: number) => unknown)
        | undefined;
      if (typeof initFn === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const listBuilder = initFn.call(struct, value.length) as any;
        for (let i = 0; i < value.length; i++) {
          listBuilder.set(i, value[i]);
        }
        continue;
      }
      // else fall-through: maybe you have a byte-list or something else
    }

    // 2) Fallback: simple scalar/struct assignment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (struct as any)[key] = value;
  }
}

/**
 * Converts a Cap'n Proto struct to a plain JavaScript object.
 * Recursively handles nested structs and lists.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function capnpToPlainObject(obj: any): any {
  // Handle null or non-object types
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Handle arrays/lists
  if (typeof obj?.toArray === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return obj.toArray().map((item: any) => capnpToPlainObject(item));
  }

  // Handle Cap'n Proto structs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plainObj: any = {};
  const proto = Object.getPrototypeOf(obj);
  const properties = Object.getOwnPropertyNames(proto)
    .concat(Object.keys(obj))
    .filter((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      if (key.startsWith("_")) {
        return false;
      }
      if (["byteOffset", "segment"].includes(key)) {
        return false; // Exclude internal Cap'n Proto fields
      }
      if (descriptor?.get) {
        return true;
      }
      // Only include getter properties, exclude methods and internal Cap'n Proto fields
      return typeof obj[key] !== "function" && !key.startsWith("_");
    });

  for (const key of properties) {
    try {
      const value = obj[key];
      // Recursively convert nested objects
      plainObj[key] = capnpToPlainObject(value);
    } catch (e) {
      console.warn(`Failed to access property ${key}:`, e);
      plainObj[key] = null; // Or handle error as needed
    }
  }

  return plainObj;
}
