export default interface CharacterClass {
  id: number;
  bitmask: number | null;
  name: string;
  short_name?: string;
  spell_list_id: number | null;
  create_points: number;
  first_title: string;
  second_title: string;
  third_title: string;
}
