export default interface Deity {
  id: number;
  name: string;
  bitmask: number;
  spells_id: number | null;
  description: string;
}
