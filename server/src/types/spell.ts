/**
 * Types related to spells
 */

export interface Spell {
  id: number;
  name: string | null;
  player_1: string | null;
  teleport_zone: string | null;
  you_cast: string | null;
  other_casts: string | null;
  cast_on_you: string | null;
  cast_on_other: string | null;
  spell_fades: string | null;
  range: number;
  aoerange: number;
  pushback: number;
  pushup: number;
  cast_time: number;
  recovery_time: number;
  recast_time: number;
  buffdurationformula: number;
  buffduration: number;
  AEDuration: number;
  mana: number;
  effect_base_value1: number;
  effect_base_value2: number;
  effect_base_value3: number;
  effect_base_value4: number;
  effect_base_value5: number;
  effect_base_value6: number;
  effect_base_value7: number;
  effect_base_value8: number;
  effect_base_value9: number;
  effect_base_value10: number;
  effect_base_value11: number;
  effect_base_value12: number;
  effect_limit_value1: number;
  effect_limit_value2: number;
  effect_limit_value3: number;
  effect_limit_value4: number;
  effect_limit_value5: number;
  effect_limit_value6: number;
  effect_limit_value7: number;
  effect_limit_value8: number;
  effect_limit_value9: number;
  effect_limit_value10: number;
  effect_limit_value11: number;
  effect_limit_value12: number;
  max1: number;
  max2: number;
  max3: number;
  max4: number;
  max5: number;
  max6: number;
  max7: number;
  max8: number;
  max9: number;
  max10: number;
  max11: number;
  max12: number;
  icon: number;
  memicon: number;
  components1: number;
  components2: number;
  components3: number;
  components4: number;
  component_counts1: number;
  component_counts2: number;
  component_counts3: number;
  component_counts4: number;
  NoexpendReagent1: number;
  NoexpendReagent2: number;
  NoexpendReagent3: number;
  NoexpendReagent4: number;
  formula1: number;
  formula2: number;
  formula3: number;
  formula4: number;
  formula5: number;
  formula6: number;
  formula7: number;
  formula8: number;
  formula9: number;
  formula10: number;
  formula11: number;
  formula12: number;
  LightType: number;
  goodEffect: number;
  Activated: number;
  resisttype: number;
  effectid1: number;
  effectid2: number;
  effectid3: number;
  effectid4: number;
  effectid5: number;
  effectid6: number;
  effectid7: number;
  effectid8: number;
  effectid9: number;
  effectid10: number;
  effectid11: number;
  effectid12: number;
  targettype: number;
  basediff: number;
  skill: number;
  zonetype: number;
  EnvironmentType: number;
  TimeOfDay: number;
  classes1: number;
  classes2: number;
  classes3: number;
  classes4: number;
  classes5: number;
  classes6: number;
  classes7: number;
  classes8: number;
  classes9: number;
  classes10: number;
  classes11: number;
  classes12: number;
  classes13: number;
  classes14: number;
  classes15: number;
  classes16: number;
  CastingAnim: number;
  TargetAnim: number;
  TravelType: number;
  SpellAffectIndex: number;
  disallow_sit: number;
  deities0: number;
  deities1: number;
  deities2: number;
  deities3: number;
  deities4: number;
  deities5: number;
  deities6: number;
  deities7: number;
  deities8: number;
  deities9: number;
  deities10: number;
  deities11: number;
  deities12: number;
  deities13: number;
  deities14: number;
  deities15: number;
  deities16: number;
  field142: number;
  field143: number;
  new_icon: number;
  spellanim: number;
  uninterruptable: number;
  ResistDiff: number;
  dot_stacking_exempt: number;
  deleteable: number;
  RecourseLink: number;
  no_partial_resist: number;
  field152: number;
  field153: number;
  short_buff_box: number;
  descnum: number;
  typedescnum: number;
  effectdescnum: number;
  effectdescnum2: number;
  npc_no_los: number;
  field160: number;
  reflectable: number;
  bonushate: number;
  field163: number;
  field164: number;
  ldon_trap: number;
  EndurCost: number;
  EndurTimerIndex: number;
  IsDiscipline: number;
  field169: number;
  field170: number;
  field171: number;
  field172: number;
  HateAdded: number;
  EndurUpkeep: number;
  numhitstype: number;
  numhits: number;
  pvpresistbase: number;
  pvpresistcalc: number;
  pvpresistcap: number;
  spell_category: number;
  field181: number;
  field182: number;
  pcnpc_only_flag: number;
  cast_not_standing: number;
  can_mgb: number;
  nodispell: number;
  npc_category: number;
  npc_usefulness: number;
  MinResist: number;
  MaxResist: number;
  viral_targets: number;
  viral_timer: number;
  nimbuseffect: number;
  ConeStartAngle: number;
  ConeStopAngle: number;
  sneaking: number;
  not_extendable: number;
  field198: number;
  field199: number;
  suspendable: number;
  viral_range: number;
  songcap: number;
  field203: number;
  field204: number;
  no_block: number;
  field206: number;
  spellgroup: number;
  rank: number;
  field209: number;
  field210: number;
  CastRestriction: number;
  allowrest: number;
  InCombat: number;
  OutofCombat: number;
  field215: number;
  field216: number;
  field217: number;
  aemaxtargets: number;
  maxtargets: number;
  field220: number;
  field221: number;
  field222: number;
  field223: number;
  persistdeath: number;
  field225: number;
  field226: number;
  min_dist: number;
  min_dist_mod: number;
  max_dist: number;
  max_dist_mod: number;
  min_range: number;
  field232: number;
  field233: number;
  field234: number;
  field235: number;
  field236: number;
}

export enum SpellTargetType {
  SELF = 1,
  TARGET = 2,
  GROUP_V1 = 3,
  PB_AE = 4,
  SINGLE_IN_GROUP = 5,
  TARGET_AE = 6,
  SELF_V2 = 7,
  TARGET_OF_TARGET = 8,
  LINE_OF_SIGHT = 9,
  BEAM = 10,
  GROUP_V2 = 11,
  TARGETED_AE_CLIENTONLY = 12,
  TARGETED_AE_ALWAYS_HIT = 13,
}

export enum SpellResistType {
  NONE = 0,
  MAGIC = 1,
  FIRE = 2,
  COLD = 3,
  POISON = 4,
  DISEASE = 5,
  CHROMATIC = 6,
  PRISMATIC = 7,
  PHYSICAL = 8,
  CORRUPTION = 9,
}
