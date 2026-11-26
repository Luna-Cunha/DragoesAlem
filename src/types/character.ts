import type { AbilityKey } from './5etools';

export type RulesetMode = '2024' | '2014' | 'all';
export type AdvancementType = 'milestone' | 'xp';
export type HpMode = 'fixed' | 'manual';
export type AbilityGenMode = 'standard' | 'pointBuy' | 'manual';
export type EncumbranceRule = 'standard' | 'variant' | 'none';

export type SheetThemeId = 'crimson' | 'arcane' | 'emerald' | 'amber' | 'violet' | 'obsidian';

export interface OriginFeatChoicesData {
  abilities?: Partial<Record<AbilityKey, number>>;
  skills?: string[];
  tools?: string[];
  languages?: string[];
  spells?: string[];
  spellList?: string;
  spellAbility?: AbilityKey;
  expertiseSkills?: string[];
  resistances?: string[];
}

export interface OptionalFeatureSubChoice {
  featKey?: string;
  featChoices?: OriginFeatChoicesData;
  cantripKey?: string;
  spellKeys?: string[];
}
export type BackdropId = 'tavern' | 'astral' | 'obsidian' | 'feywild' | 'bloodmoon';
export type PortraitFrameId = 'gold-filigree' | 'iron-crest' | 'arcane-ring' | 'crimson-seal' | 'minimal';

export interface CharacterThemeConfig {
  darkMode: boolean; // D&D Beyond "Underdark Mode"
  accentTheme: SheetThemeId;
  backdrop: BackdropId;
  frame: PortraitFrameId;
}

export interface CharacterClassSelection {
  id: string;
  className: string;
  classSource: string;
  level: number;
  isPrimary: boolean;
  subclassName?: string;
  subclassSource?: string;
  hpRolls: Record<number, number>; // level (1..20) -> rolled hp die result (without CON mod)
  chosenSkills: string[];
  chosenTools?: string[];
  expertiseSkills: string[];
  chosenOptionalFeatures: Record<string, string[]>; // e.g. "prog-Eldritch Invocations" -> ["Agonizing Blast|XPHB"]
  chosenOptionalFeatureSubChoices?: Record<string, OptionalFeatureSubChoice>; // key -> slot sub-choices (e.g. "prog-Eldritch Invocations:0")
  chosenFeatProgressions?: Record<string, string[]>; // e.g. "fp-Fighting Style" -> ["Defense|XPHB"]
  chosenFeatProgressionChoices?: Record<string, OriginFeatChoicesData>; // key -> sub-choices (e.g. "fp-Fighting Style:0")
  chosenClassFeatureOptions?: Record<string, string>; // e.g. "Divine Order-1" -> "Protector|Cleric|XPHB|1"
  chosenClassFeatureSkills?: Record<string, string[]>;
  chosenClassFeatureTools?: Record<string, string[]>;
  chosenClassFeatureLanguages?: Record<string, string[]>;
  chosenClassFeatureSpells?: Record<string, string[]>;
  chosenWeaponMasteries: string[];
  asiChoices: Record<
    number, // class level e.g. 4, 8, 12
    {
      mode: 'asi' | 'feat';
      abilities?: Partial<Record<AbilityKey, number>>;
      featKey?: string; // "Alert|XPHB"
      featAbilityChoice?: Partial<Record<AbilityKey, number>>;
      featSkills?: string[];
      featTools?: string[];
      featLanguages?: string[];
      featSpells?: string[];
      featSpellAbility?: AbilityKey;
      featExpertiseSkills?: string[];
      featResistances?: string[];
    }
  >;
  preparedSpells: string[]; // "Name|Source"
  knownSpells: string[]; // "Name|Source"
  cantrips: string[]; // "Name|Source"
  spellbookSpells: string[]; // Wizard spellbook "Name|Source"
}

export interface CharacterInventoryItem {
  instanceId: string;
  itemKey: string; // "Name|Source" or "custom"
  name: string;
  source?: string;
  quantity: number;
  equipped: boolean;
  attuned: boolean;
  notes?: string;
  customWeight?: number;
  customValueCp?: number;
  // Cached overrides for custom items
  isCustom?: boolean;
  customItemData?: {
    type?: string;
    weapon?: boolean;
    armor?: boolean;
    shield?: boolean;
    dmg1?: string;
    dmg2?: string;
    dmgType?: string;
    ac?: number;
    property?: string[];
    mastery?: string[];
    range?: string;
    bonusWeapon?: string;
    bonusAc?: string;
    bonusSpellAttack?: string;
    bonusSpellSaveDc?: string;
    reqAttune?: boolean | string;
    description?: string;
  };
}

export interface CharacterCurrency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface CustomCounter {
  id: string;
  name: string;
  max: number;
  used: number;
  resetOn: 'short' | 'long' | 'none';
}

export interface Character {
  id: string;
  name: string;
  portraitUrl: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    ruleset: RulesetMode;
    enabledSources: string[];
    advancement: AdvancementType;
    hpMode: HpMode;
    useFeats: boolean;
    allowMulticlassing: boolean;
    encumbrance: EncumbranceRule;
    ignoreCoinWeight: boolean;
    abilityGenMode: AbilityGenMode;
    tashaOriginAbilityOverride: boolean;
  };
  theme: CharacterThemeConfig;
  xp: number;
  classes: CharacterClassSelection[];
  race: {
    raceKey?: string; // "Name|Source" (already merged if subrace)
    sizeChoice?: string;
    abilityMode: 'fixed' | 'floating_2_1' | 'floating_1_1_1' | 'none';
    abilityBonuses: Partial<Record<AbilityKey, number>>;
    chosenSkills: string[];
    chosenTools: string[];
    chosenLanguages: string[];
    innateSpellAbility?: AbilityKey;
    lineageChoice?: string; // e.g., "High Elf", "Wood Elf", "Drow", "Red (Fire)"
    chosenInnateCantrip?: string;
    originFeatKey?: string;
    originFeatChoices?: OriginFeatChoicesData;
  };
  background: {
    backgroundKey?: string; // "Name|Source"
    abilityMode: 'weighted_2_1' | 'three_1' | 'none';
    abilityBonuses: Partial<Record<AbilityKey, number>>;
    chosenSkills: string[];
    chosenTools: string[];
    chosenLanguages: string[];
    originFeatKey?: string;
    originFeatChoices?: OriginFeatChoicesData;
    equipmentChoice: 'A' | 'B' | 'gold' | 'none';
  };
  abilities: {
    base: Record<AbilityKey, number>;
    override: Partial<Record<AbilityKey, number>>;
    miscBonus: Partial<Record<AbilityKey, number>>;
  };
  description: {
    alignment: string;
    faith: string;
    lifestyle: string;
    gender: string;
    eyes: string;
    size: string;
    height: string;
    hair: string;
    skin: string;
    age: string;
    weight: string;
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    appearance: string;
    backstory: string;
    allies: string;
    notes: string;
  };
  startingEquipmentChosen: Record<string, string>; // key -> option ("a", "b", "A", "B", "C")
  useStartingGold: boolean;
  otherPossessions?: string;
  inventory: CharacterInventoryItem[];
  currency: CharacterCurrency;
  // Live Play State:
  playState: {
    currentHp: number | null; // null means full max HP
    tempHp: number;
    hitDiceUsed: Record<number, number>; // dieFaces (e.g. 10) -> count used
    deathSaves: { successes: number; failures: number };
    heroicInspiration: boolean;
    activeConditions: { name: string; level?: number }[];
    concentratingOn?: string;
    spellSlotsUsed: Record<number, number>; // level 1..9 -> used count
    pactSlotsUsed: number;
    featureUses: Record<string, number>; // featureId -> used count
    customCounters: CustomCounter[];
    mageArmorActive: boolean;
    customSpeedBonus: number;
    customAcBonus: number;
    customInitBonus: number;
  };
}

export interface ComputedAttackAction {
  id: string;
  name: string;
  category: 'weapon' | 'unarmed' | 'spell';
  attackType: 'Melee Weapon' | 'Ranged Weapon' | 'Melee Spell' | 'Ranged Spell' | 'Unarmed';
  range: string;
  toHit: number | null;
  saveDc?: number;
  saveAbility?: string;
  damageDice: string;
  damageBonus: number;
  damageType: string;
  versatileDamageDice?: string;
  properties: string[];
  mastery?: string[];
  sourceItemId?: string;
  sourceSpellKey?: string;
  notes?: string;
}

export interface ComputedSpellGroup {
  classId: string;
  className: string;
  classSource: string;
  subclassName?: string;
  ability: AbilityKey;
  spellAttackBonus: number;
  spellSaveDc: number;
  casterProgression: string;
  maxSpellLevel: number;
  cantripLimit: number;
  preparedLimit: number;
  knownLimit: number;
  availableSpellKeys: string[];
  alwaysPreparedKeys: string[];
  innateSpells: {
    spellKey: string;
    uses: string;
    minLevel: number;
    ability: AbilityKey;
  }[];
}

export interface ComputedFeatureEntry {
  id: string;
  name: string;
  sourceLabel: string; // e.g. "Fighter 1", "High Elf", "Background", "Alert (Feat)"
  category: 'class' | 'subclass' | 'species' | 'background' | 'feat' | 'optional';
  level?: number;
  source?: string;
  page?: number;
  entries: unknown[];
  actionType?: 'action' | 'bonus' | 'reaction' | 'other';
  parentFeatureName?: string;
  limitedUse?: {
    max: number;
    resetOn: 'short' | 'long';
  };
}

export interface ComputedCharacter {
  totalLevel: number;
  proficiencyBonus: number;
  abilityScores: Record<
    AbilityKey,
    {
      total: number;
      modifier: number;
      base: number;
      speciesBonus: number;
      backgroundBonus: number;
      asiFeatBonus: number;
      miscBonus: number;
      override?: number;
    }
  >;
  savingThrows: Record<
    AbilityKey,
    {
      proficient: boolean;
      bonus: number;
      notes: string[];
    }
  >;
  skills: {
    name: string;
    ability: AbilityKey;
    proficiency: 0 | 0.5 | 1 | 2; // none, half (Jack of All Trades), prof, expertise
    bonus: number;
    passive: number;
  }[];
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
  maxHp: number;
  effectiveCurrentHp: number;
  hitDicePools: { faces: number; total: number; used: number }[];
  ac: {
    value: number;
    breakdown: string;
    equippedArmorName?: string;
    hasShield: boolean;
  };
  initiative: number;
  speeds: {
    walk: number;
    fly?: number;
    swim?: number;
    climb?: number;
  };
  senses: { name: string; range?: number }[];
  resistances: string[];
  immunities: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  languages: string[];
  spellSlots: Record<number, number>; // 1..9
  pactSlots: { count: number; level: number } | null;
  spellGroups: ComputedSpellGroup[];
  attacks: ComputedAttackAction[];
  features: ComputedFeatureEntry[];
  carrying: {
    totalWeight: number;
    capacity: number;
    encumberedAt: number;
    heavilyEncumberedAt: number;
    status: 'normal' | 'encumbered' | 'heavily-encumbered' | 'over-capacity';
  };
  attunement: {
    used: number;
    max: number;
  };
  validationWarnings: string[];
}

export interface DiceRollTerm {
  sides: number;
  rolls: number[];
  kept: number[];
  dropped?: number[];
  isCrit?: boolean;
  isFumble?: boolean;
}

export interface RollRecord {
  id: string;
  timestamp: string;
  label: string;
  context?: string;
  mode: 'normal' | 'advantage' | 'disadvantage';
  expression: string;
  terms: DiceRollTerm[];
  modifier: number;
  total: number;
  damageType?: string;
  isCrit?: boolean;
  isFumble?: boolean;
}
