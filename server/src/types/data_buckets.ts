/**
 * Types related to data storage buckets
 * Based on the data_buckets table in the database
 */

/**
 * Represents a data bucket from the database
 */
export interface DataBuckets {
  id: number;
  key: string | null;
  value: string | null;
  expires: number;
}

/**
 * Represents a simplified view of a data bucket
 */
export interface SimpleDataBucket {
  id: number;
  key: string | null;
  value: string | null;
  expirationTime: number;
}

/**
 * Converts a DataBuckets object to a SimpleDataBucket object
 */
export function toSimpleDataBucket(bucket: DataBuckets): SimpleDataBucket {
  return {
    id: bucket.id,
    key: bucket.key,
    value: bucket.value,
    expirationTime: bucket.expires,
  };
}
