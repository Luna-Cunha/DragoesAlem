export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type EntryNode =
  | string
  | {
      type: string;
      name?: string;
      caption?: string;
      entries?: EntryNode[];
      items?: EntryNode[];
      entry?: EntryNode;
      colLabels?: string[];
      colStyles?: string[];
      rows?: (string | number | { type?: string; roll?: { exact?: number; min?: number; max?: number }; entry?: string })[][];
      style?: string;
      count?: number;
      optionalfeature?: string;
      classFeature?: string;
      subclassFeature?: string;
      data?: Record<string, unknown>;
      by?: string;
      [key: string]: unknown;
    };

export interface SourceMeta {
  name: string;
  source: string;
  page?: number;
  edition?: 'one' | 'classic';
  srd?: boolean;
  srd52?: boolean;
  basicRules?: boolean;
  basicRules2024?: boolean;
  reprintedAs?: string[];
}

export interface Book5e {
  name: string;
  id: string;
  source: string;
  group?: string;
  published?: string;
}

export interface AbilityBonusChoice {
  choose?: {
    from?: AbilityKey[];
    count?: number;
    amount?: number;
    weighted?: {
      from: AbilityKey[];
      weights: number[];
    };
  };
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  hidden?: boolean;
}

export interface SkillProficiencyEntry {
  [key: string]:
    | boolean
    | {
        from: string[];
        count?: number;
      }
    | number
    | undefined;
  choose?: {
    from: string[];
    count?: number;
  };
  any?: number;
}

export interface StartingEquipmentBlock {
  additionalFromBackground?: boolean;
  default?: string[];
  goldAlternative?: string;
  defaultData?: Record<string, unknown[]>[];
  entries?: string[];
}

export interface ClassFeatureRef {
  classFeature: string;
  gainSubclassFeature?: boolean;
}

export interface OptionalFeatureProgression {
  name: string;
  featureType: string[];
  progression: number[] | Record<string, number>;
}

export interface FeatProgression {
  name: string;
  category: string[];
  progression: number[] | Record<string, number>;
}

export interface ClassTableGroup {
  title?: string;
  colLabels: string[];
  rows?: (string | number | Record<string, unknown>)[][];
  rowsSpellProgression?: number[][];
}

export interface Class5e extends SourceMeta {
  hd: { number: number; faces: number };
  proficiency: AbilityKey[];
  primaryAbility?: Record<string, boolean>[];
  spellcastingAbility?: AbilityKey;
  casterProgression?: 'full' | '1/2' | '1/3' | 'pact' | 'artificer' | string;
  preparedSpells?: string;
  preparedSpellsProgression?: number[];
  preparedSpellsChange?: string;
  cantripProgression?: number[];
  spellsKnownProgression?: number[];
  spellsKnownProgressionFixed?: number[];
  spellsKnownProgressionFixedAllowLowerLevel?: boolean;
  startingProficiencies?: {
    skills?: SkillProficiencyEntry[];
    weapons?: (string | Record<string, unknown>)[];
    armor?: (string | Record<string, unknown>)[];
    armorProficiencies?: Record<string, boolean>[];
    tools?: string[];
    toolProficiencies?: Record<string, unknown>[];
  };
  startingEquipment?: StartingEquipmentBlock;
  multiclassing?: {
    requirements?: Record<string, unknown>;
    proficienciesGained?: {
      weapons?: string[];
      armor?: string[];
      skills?: SkillProficiencyEntry[];
      tools?: string[];
      toolProficiencies?: Record<string, unknown>[];
    };
  };
  optionalfeatureProgression?: OptionalFeatureProgression[];
  featProgression?: FeatProgression[];
  itemMasteries?: unknown[];
  itemMasteriesProgression?: number[] | Record<string, number>;
  classTableGroups?: ClassTableGroup[];
  classFeatures: (string | ClassFeatureRef)[];
  subclassTitle?: string;
  hasFluff?: boolean;
}

export interface Subclass5e extends SourceMeta {
  shortName: string;
  className: string;
  classSource: string;
  spellcastingAbility?: AbilityKey;
  casterProgression?: string;
  cantripProgression?: number[];
  spellsKnownProgression?: number[];
  preparedSpellsProgression?: number[];
  preparedSpells?: string;
  optionalfeatureProgression?: OptionalFeatureProgression[];
  additionalSpells?: AdditionalSpellsEntry[];
  subclassTableGroups?: ClassTableGroup[];
  subclassFeatures: string[];
}

export interface ClassFeature5e extends SourceMeta {
  className: string;
  classSource: string;
  level: number;
  header?: number;
  entries: EntryNode[];
}

export interface SubclassFeature5e extends SourceMeta {
  className: string;
  classSource: string;
  subclassShortName: string;
  subclassSource: string;
  level: number;
  header?: number;
  entries: EntryNode[];
}

export interface AdditionalSpellsEntry {
  name?: string;
  ability?: AbilityKey | { choose: AbilityKey[] };
  innate?: Record<string, unknown>;
  known?: Record<string, unknown>;
  prepared?: Record<string, unknown>;
  expanded?: Record<string, unknown>;
}

export interface Race5e extends SourceMeta {
  size?: string[];
  speed?: number | { walk?: number; fly?: number | boolean; swim?: number | boolean; climb?: number | boolean; burrow?: number | boolean };
  ability?: AbilityBonusChoice[];
  darkvision?: number;
  blindsight?: number;
  resist?: (string | Record<string, unknown>)[];
  immune?: (string | Record<string, unknown>)[];
  conditionImmune?: string[];
  skillProficiencies?: SkillProficiencyEntry[];
  toolProficiencies?: Record<string, unknown>[];
  languageProficiencies?: Record<string, unknown>[];
  skillToolLanguageProficiencies?: { choose?: { from?: string[]; count?: number }[] }[];
  weaponProficiencies?: Record<string, unknown>[];
  armorProficiencies?: Record<string, unknown>[];
  additionalSpells?: AdditionalSpellsEntry[];
  feats?: Record<string, unknown>[];
  traitTags?: string[];
  creatureTypes?: string[];
  entries?: EntryNode[];
  subraces?: Subrace5e[];
  _copy?: { name: string; source: string; _mod?: Record<string, unknown>; _preserve?: Record<string, boolean> };
  // Normalized fields:
  raceName?: string;
  raceSource?: string;
  baseName?: string;
}

export interface Subrace5e extends Partial<Race5e> {
  name?: string;
  source: string;
  raceName: string;
  raceSource: string;
  overwrite?: Record<string, boolean>;
}

export interface Background5e extends SourceMeta {
  ability?: AbilityBonusChoice[];
  feats?: Record<string, boolean>[];
  skillProficiencies?: SkillProficiencyEntry[];
  toolProficiencies?: Record<string, unknown>[];
  languageProficiencies?: Record<string, unknown>[];
  startingEquipment?: Record<string, unknown[]>[];
  additionalSpells?: AdditionalSpellsEntry[];
  entries?: EntryNode[];
  _copy?: { name: string; source: string; _mod?: Record<string, unknown>; _preserve?: Record<string, boolean> };
}

export interface Feat5e extends SourceMeta {
  category?: string; // O = Origin, G = General, FS = Fighting Style, EB = Epic Boon
  prerequisite?: Record<string, unknown>[];
  repeatable?: boolean;
  ability?: AbilityBonusChoice[];
  skillProficiencies?: SkillProficiencyEntry[];
  toolProficiencies?: Record<string, unknown>[];
  languageProficiencies?: Record<string, unknown>[];
  skillToolLanguageProficiencies?: { choose?: { from?: string[]; count?: number }[] }[];
  weaponProficiencies?: Record<string, unknown>[];
  armorProficiencies?: Record<string, unknown>[];
  savingThrowProficiencies?: Record<string, boolean>[];
  additionalSpells?: AdditionalSpellsEntry[];
  optionalfeatureProgression?: OptionalFeatureProgression[];
  resist?: (string | Record<string, unknown>)[];
  entries: EntryNode[];
  _copy?: { name: string; source: string; _mod?: Record<string, unknown> };
}

export interface Spell5e extends SourceMeta {
  level: number;
  school: string;
  time: { number: number; unit: string; condition?: string }[];
  range: {
    type: string;
    distance?: { type: string; amount?: number };
  };
  components: {
    v?: boolean;
    s?: boolean;
    m?: string | { text: string; cost?: number; consume?: boolean | string };
    r?: boolean;
  };
  duration: {
    type: string;
    duration?: { type: string; amount?: number; upTo?: boolean };
    concentration?: boolean;
    condition?: string;
  }[];
  meta?: { ritual?: boolean };
  entries: EntryNode[];
  entriesHigherLevel?: EntryNode[];
  scalingLevelDice?: { label?: string; scaling: Record<string, string> } | { label?: string; scaling: Record<string, string> }[];
  damageInflict?: string[];
  conditionInflict?: string[];
  miscTags?: string[];
  savingThrow?: string[];
  spellAttack?: string[];
  // Enriched from spells/sources.json:
  classes?: { name: string; source: string }[];
  subclasses?: { className: string; classSource: string; name: string; source: string }[];
}

export interface Item5e extends SourceMeta {
  type?: string;
  rarity?: string;
  weight?: number;
  value?: number; // in copper pieces (cp)
  baseItem?: string;
  weapon?: boolean;
  armor?: boolean;
  shield?: boolean;
  staff?: boolean;
  wand?: boolean;
  rod?: boolean;
  wondrous?: boolean;
  scfType?: string;
  containerCapacity?: unknown;
  weaponCategory?: 'simple' | 'martial' | string;
  property?: string[];
  mastery?: string[];
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;
  range?: string;
  ac?: number;
  strength?: string;
  stealth?: boolean;
  reqAttune?: boolean | string;
  bonusWeapon?: string;
  bonusWeaponAttack?: string;
  bonusWeaponDamage?: string;
  bonusAc?: string;
  bonusSpellAttack?: string;
  bonusSpellSaveDc?: string;
  bonusSavingThrow?: string;
  charges?: number;
  recharge?: string;
  packContents?: (string | { item?: string; special?: string; quantity?: number })[];
  entries?: EntryNode[];
  ability?: Record<string, unknown>;
  _copy?: { name: string; source: string; _mod?: Record<string, unknown> };
}

export interface MagicVariant5e {
  name: string;
  type?: string;
  requires?: Record<string, unknown>[];
  excludes?: Record<string, unknown>;
  inherits: Partial<Item5e> & { namePrefix?: string; nameSuffix?: string };
}

export interface OptionalFeature5e extends SourceMeta {
  featureType: string[];
  prerequisite?: Record<string, unknown>[];
  isClassFeatureVariant?: boolean;
  additionalSpells?: AdditionalSpellsEntry[];
  entries: EntryNode[];
}

export interface CharCreationOption5e extends SourceMeta {
  optionType?: string;
  prerequisite?: Record<string, unknown>[];
  entries: EntryNode[];
}

export interface Skill5e extends SourceMeta {
  ability: AbilityKey;
  entries: EntryNode[];
}

export interface Language5e extends SourceMeta {
  type?: string;
  typicalSpeakers?: string[];
  script?: string;
  entries?: EntryNode[];
}

export interface Sense5e extends SourceMeta {
  entries: EntryNode[];
}

export interface Condition5e extends SourceMeta {
  entries: EntryNode[];
}

export interface Action5e extends SourceMeta {
  time?: { number?: number; unit: string }[];
  entries: EntryNode[];
}

export interface VariantRule5e extends SourceMeta {
  ruleType?: string;
  entries: EntryNode[];
}

export interface ItemMastery5e extends SourceMeta {
  entries: EntryNode[];
}

export interface ItemProperty5e {
  abbreviation: string;
  source?: string;
  name?: string;
  entries?: EntryNode[];
  template?: string;
}

export interface ItemType5e {
  abbreviation: string;
  source?: string;
  name: string;
  entries?: EntryNode[];
}

export interface ClassFluff5e {
  name: string;
  source: string;
  entries?: EntryNode[];
}

export interface CompendiumMeta {
  sourceUrl: string;
  importedAt: string;
  version: number;
  counts: {
    books: number;
    classes: number;
    subclasses: number;
    races: number;
    backgrounds: number;
    feats: number;
    spells: number;
    items: number;
    optionalFeatures: number;
    conditions: number;
    actions: number;
    skills: number;
    languages: number;
  };
}

export interface CompiledCompendium {
  meta: CompendiumMeta;
  books: Book5e[];
  classes: Class5e[];
  classFluff?: ClassFluff5e[];
  subclasses: Subclass5e[];
  classFeatures: ClassFeature5e[];
  subclassFeatures: SubclassFeature5e[];
  races: Race5e[];
  backgrounds: Background5e[];
  feats: Feat5e[];
  spells: Spell5e[];
  items: Item5e[];
  optionalFeatures: OptionalFeature5e[];
  charCreationOptions: CharCreationOption5e[];
  skills: Skill5e[];
  languages: Language5e[];
  senses: Sense5e[];
  conditions: Condition5e[];
  actions: Action5e[];
  variantRules: VariantRule5e[];
  itemMasteries: ItemMastery5e[];
  itemProperties: ItemProperty5e[];
  itemTypes: ItemType5e[];
}
