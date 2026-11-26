import type {
  AbilityKey,
  AdditionalSpellsEntry,
  Background5e,
  Book5e,
  Class5e,
  ClassFeature5e,
  CompiledCompendium,
  EntryNode,
  Feat5e,
  Item5e,
  OptionalFeature5e,
  Race5e,
  Spell5e,
  Subclass5e,
  SubclassFeature5e,
} from '../types/5etools';
import type {
  Character,
  CharacterClassSelection,
  ComputedAttackAction,
  ComputedCharacter,
  ComputedFeatureEntry,
  ComputedSpellGroup,
  OriginFeatChoicesData,
  RulesetMode,
} from '../types/character';

export const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ABILITY_LABELS: Record<AbilityKey, { short: string; full: string }> = {
  str: { short: 'STR', full: 'Strength' },
  dex: { short: 'DEX', full: 'Dexterity' },
  con: { short: 'CON', full: 'Constitution' },
  int: { short: 'INT', full: 'Intelligence' },
  wis: { short: 'WIS', full: 'Wisdom' },
  cha: { short: 'CHA', full: 'Charisma' },
};

export const STANDARD_SKILLS: { name: string; ability: AbilityKey }[] = [
  { name: 'Acrobatics', ability: 'dex' },
  { name: 'Animal Handling', ability: 'wis' },
  { name: 'Arcana', ability: 'int' },
  { name: 'Athletics', ability: 'str' },
  { name: 'Deception', ability: 'cha' },
  { name: 'History', ability: 'int' },
  { name: 'Insight', ability: 'wis' },
  { name: 'Intimidation', ability: 'cha' },
  { name: 'Investigation', ability: 'int' },
  { name: 'Medicine', ability: 'wis' },
  { name: 'Nature', ability: 'int' },
  { name: 'Perception', ability: 'wis' },
  { name: 'Performance', ability: 'cha' },
  { name: 'Persuasion', ability: 'cha' },
  { name: 'Religion', ability: 'int' },
  { name: 'Sleight of Hand', ability: 'dex' },
  { name: 'Stealth', ability: 'dex' },
  { name: 'Survival', ability: 'wis' },
];

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

export const MULTICLASS_SPELL_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // Level 0
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // 20
];

export const PACT_SLOTS_TABLE: { count: number; level: number }[] = [
  { count: 0, level: 0 }, // 0
  { count: 1, level: 1 }, // 1
  { count: 2, level: 1 }, // 2
  { count: 2, level: 2 }, // 3
  { count: 2, level: 2 }, // 4
  { count: 2, level: 3 }, // 5
  { count: 2, level: 3 }, // 6
  { count: 2, level: 4 }, // 7
  { count: 2, level: 4 }, // 8
  { count: 2, level: 5 }, // 9
  { count: 2, level: 5 }, // 10
  { count: 3, level: 5 }, // 11
  { count: 3, level: 5 }, // 12
  { count: 3, level: 5 }, // 13
  { count: 3, level: 5 }, // 14
  { count: 3, level: 5 }, // 15
  { count: 3, level: 5 }, // 16
  { count: 4, level: 5 }, // 17
  { count: 4, level: 5 }, // 18
  { count: 4, level: 5 }, // 19
  { count: 4, level: 5 }, // 20
];

export const DAMAGE_TYPE_LABELS: Record<string, string> = {
  A: 'Acid',
  B: 'Bludgeoning',
  C: 'Cold',
  F: 'Fire',
  O: 'Force',
  L: 'Lightning',
  N: 'Necrotic',
  P: 'Piercing',
  I: 'Poison',
  Y: 'Psychic',
  R: 'Radiant',
  S: 'Slashing',
  T: 'Thunder',
};

export const ITEM_PROPERTY_LABELS: Record<string, string> = {
  '2H': 'Two-Handed',
  A: 'Ammunition',
  F: 'Finesse',
  H: 'Heavy',
  L: 'Light',
  LD: 'Loading',
  R: 'Reach',
  T: 'Thrown',
  V: 'Versatile',
  S: 'Special',
};

export const DEFAULT_SOURCES_BY_RULESET: Record<RulesetMode, string[]> = {
  '2024': ['XPHB', 'XDMG', 'FRHoF', 'FRAiF', 'EFA', 'ABH', 'LFL', 'RHW', 'XGE', 'TCE', 'MPMM', 'FTD', 'VRGR', 'ERLW', 'EGW', 'SCC', 'AAG', 'BMT'],
  '2014': ['PHB', 'DMG', 'XGE', 'TCE', 'SCAG', 'VGM', 'MTF', 'MPMM', 'FTD', 'VRGR', 'ERLW', 'EGW', 'SCC', 'AAG', 'BMT'],
  all: ['XPHB', 'XDMG', 'PHB', 'DMG', 'XGE', 'TCE', 'MPMM', 'FTD', 'VRGR', 'ERLW', 'EGW', 'SCC', 'AAG', 'BMT', 'FRHoF', 'FRAiF', 'EFA', 'ABH', 'LFL', 'RHW', 'SCAG', 'VGM', 'MTF'],
};

export const CORE_SOURCES = new Set(['PHB', 'XPHB', 'DMG', 'XDMG', 'MM', 'XMM']);

const FIVE_FIVE_SOURCES = new Set([
  'XPHB',
  'XDMG',
  'XMM',
  'XSAC',
  'XSCREEN',
  'XSCREENRHW',
  'FRHOF',
  'FRAIF',
  'EFA',
  'ABH',
  'LFL',
  'NF',
  'RHW',
  'AU',
  'PL',
  'HFLOTT',
]);

export type SourceCategoryGroup = '5.5e-core' | '5.5e-supplements' | '5e-core' | '5e-supplements';

export const SOURCE_CATEGORY_GROUPS: { id: SourceCategoryGroup; label: string }[] = [
  { id: '5.5e-core', label: '5.5e Core' },
  { id: '5.5e-supplements', label: '5.5e Supplements' },
  { id: '5e-core', label: '5e Core' },
  { id: '5e-supplements', label: '5e Supplements' },
];

export function isCoreSource(source: string | undefined): boolean {
  return Boolean(source && CORE_SOURCES.has(source.toUpperCase()));
}

export function classifySourceCategory(
  item: { source?: string; edition?: string },
  books?: Book5e[],
): SourceCategoryGroup {
  const src = (item.source || '').toUpperCase();
  const core = isCoreSource(src);
  const book = books?.find((b) => b.source.toUpperCase() === src);
  const is55e =
    item.edition === 'one' ||
    (item.edition !== 'classic' &&
      (FIVE_FIVE_SOURCES.has(src) ||
        Boolean(book?.published && book.published >= '2024-09-17' && src !== 'PAF')));

  if (is55e && core) return '5.5e-core';
  if (is55e) return '5.5e-supplements';
  if (core) return '5e-core';
  return '5e-supplements';
}

export function groupBySourceCategory<T extends { source?: string; edition?: string }>(
  items: T[],
  books?: Book5e[],
): { id: SourceCategoryGroup; label: string; items: T[] }[] {
  const buckets: Record<SourceCategoryGroup, T[]> = {
    '5.5e-core': [],
    '5.5e-supplements': [],
    '5e-core': [],
    '5e-supplements': [],
  };
  for (const item of items) {
    buckets[classifySourceCategory(item, books)].push(item);
  }
  return SOURCE_CATEGORY_GROUPS.map((grp) => ({
    ...grp,
    items: buckets[grp.id],
  })).filter((grp) => grp.items.length > 0);
}

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatSigned(val: number): string {
  return val >= 0 ? `+${val}` : `${val}`;
}

export function getProficiencyBonus(level: number): number {
  const clamped = Math.max(1, Math.min(20, level));
  return Math.ceil(clamped / 4) + 1;
}

export function calculatePointBuySpent(scores: Record<AbilityKey, number>): number {
  return ABILITY_KEYS.reduce((total, key) => {
    const val = scores[key];
    return total + (POINT_BUY_COSTS[val] ?? 0);
  }, 0);
}

export function makeEntityKey(name: string, source: string): string {
  return `${name}|${source}`;
}

export function splitEntityKey(key: string | undefined): { name: string; source: string } {
  if (!key) return { name: '', source: '' };
  const [name, source = ''] = key.split('|');
  return { name: name.trim(), source: source.trim() };
}

export function createBlankCharacter(ruleset: RulesetMode = '2024'): Character {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  return {
    id,
    name: 'Unnamed Adventurer',
    portraitUrl: '',
    createdAt: now,
    updatedAt: now,
    preferences: {
      ruleset,
      enabledSources: [...DEFAULT_SOURCES_BY_RULESET[ruleset]],
      advancement: 'milestone',
      hpMode: 'fixed',
      useFeats: true,
      allowMulticlassing: true,
      encumbrance: 'standard',
      ignoreCoinWeight: false,
      abilityGenMode: 'standard',
      tashaOriginAbilityOverride: false,
    },
    theme: {
      darkMode: true,
      accentTheme: 'crimson',
      backdrop: 'obsidian',
      frame: 'gold-filigree',
    },
    xp: 0,
    classes: [],
    race: {
      abilityMode: ruleset === '2024' ? 'none' : 'fixed',
      abilityBonuses: {},
      chosenSkills: [],
      chosenTools: [],
      chosenLanguages: [],
    },
    background: {
      abilityMode: ruleset === '2024' ? 'weighted_2_1' : 'none',
      abilityBonuses: {},
      chosenSkills: [],
      chosenTools: [],
      chosenLanguages: [],
      equipmentChoice: 'A',
    },
    abilities: {
      base: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      override: {},
      miscBonus: {},
    },
    description: {
      alignment: 'Neutral Good',
      faith: '',
      lifestyle: 'Modest',
      gender: '',
      eyes: '',
      size: 'Medium',
      height: '',
      hair: '',
      skin: '',
      age: '',
      weight: '',
      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      appearance: '',
      backstory: '',
      allies: '',
      notes: '',
    },
    startingEquipmentChosen: {},
    useStartingGold: false,
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    playState: {
      currentHp: null,
      tempHp: 0,
      hitDiceUsed: {},
      deathSaves: { successes: 0, failures: 0 },
      heroicInspiration: false,
      activeConditions: [],
      spellSlotsUsed: {},
      pactSlotsUsed: 0,
      featureUses: {},
      customCounters: [],
      mageArmorActive: false,
      customSpeedBonus: 0,
      customAcBonus: 0,
      customInitBonus: 0,
    },
  };
}

export function shouldHideSpeciesAsi(
  character: Character,
  race: Race5e | undefined,
  background: Background5e | undefined,
): boolean {
  if (character.preferences.ruleset === '2024') return true;
  if (race?.edition === 'one') return true;
  if (character.background.abilityMode !== 'none') {
    const hasBgBonus = ABILITY_KEYS.some((k) => (character.background.abilityBonuses[k] || 0) > 0);
    if (background?.ability?.length || hasBgBonus) return true;
  }
  return false;
}

export function isSourceAllowed(
  source: string | undefined,
  enabledSources: string[],
  ruleset: RulesetMode,
  edition?: string,
): boolean {
  if (!source) return true;
  if (enabledSources.length > 0 && !enabledSources.includes(source)) {
    return false;
  }
  if (ruleset === '2024' && edition === 'classic' && source === 'PHB') return false;
  if (ruleset === '2014' && edition === 'one') return false;
  return true;
}

export function findClass(compendium: CompiledCompendium, name: string, source: string): Class5e | undefined {
  return compendium.classes.find(
    (c) => c.name.toLowerCase() === name.toLowerCase() && c.source.toLowerCase() === source.toLowerCase(),
  );
}

export function findSubclass(
  compendium: CompiledCompendium,
  className: string,
  classSource: string,
  subName: string | undefined,
  subSource: string | undefined,
): Subclass5e | undefined {
  if (!subName) return undefined;
  return compendium.subclasses.find(
    (s) =>
      s.className.toLowerCase() === className.toLowerCase() &&
      s.classSource.toLowerCase() === classSource.toLowerCase() &&
      s.name.toLowerCase() === subName.toLowerCase() &&
      (!subSource || s.source.toLowerCase() === subSource.toLowerCase()),
  );
}

export function findRace(compendium: CompiledCompendium, key: string | undefined): Race5e | undefined {
  if (!key) return undefined;
  const { name, source } = splitEntityKey(key);
  return compendium.races.find(
    (r) => r.name.toLowerCase() === name.toLowerCase() && (!source || r.source.toLowerCase() === source.toLowerCase()),
  );
}

export function findBackground(compendium: CompiledCompendium, key: string | undefined) {
  if (!key) return undefined;
  const { name, source } = splitEntityKey(key);
  return compendium.backgrounds.find(
    (b) => b.name.toLowerCase() === name.toLowerCase() && (!source || b.source.toLowerCase() === source.toLowerCase()),
  );
}

export function findFeat(compendium: CompiledCompendium, key: string | undefined): Feat5e | undefined {
  if (!key) return undefined;
  const { name, source } = splitEntityKey(key);
  return compendium.feats.find(
    (f) => f.name.toLowerCase() === name.toLowerCase() && (!source || f.source.toLowerCase() === source.toLowerCase()),
  );
}

export function findSpell(compendium: CompiledCompendium, key: string): Spell5e | undefined {
  const cleanKey = key.split('#')[0];
  const { name, source } = splitEntityKey(cleanKey);
  if (source) {
    const exact = compendium.spells.find(
      (s) => s.name.toLowerCase() === name.toLowerCase() && s.source.toLowerCase() === source.toLowerCase(),
    );
    if (exact) return exact;
  }
  return compendium.spells.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

export function findItem(compendium: CompiledCompendium, key: string): Item5e | undefined {
  const { name, source } = splitEntityKey(key);
  if (source) {
    const exact = compendium.items.find(
      (i) => i.name.toLowerCase() === name.toLowerCase() && i.source.toLowerCase() === source.toLowerCase(),
    );
    if (exact) return exact;
  }
  return compendium.items.find((i) => i.name.toLowerCase() === name.toLowerCase());
}

export function findOptionalFeature(compendium: CompiledCompendium, key: string): OptionalFeature5e | undefined {
  const { name, source } = splitEntityKey(key);
  if (source) {
    const exact = compendium.optionalFeatures.find(
      (o) => o.name.toLowerCase() === name.toLowerCase() && o.source.toLowerCase() === source.toLowerCase(),
    );
    if (exact) return exact;
  }
  return compendium.optionalFeatures.find((o) => o.name.toLowerCase() === name.toLowerCase());
}

export function isOptionalFeatureRepeatable(opt: OptionalFeature5e): boolean {
  if ((opt as unknown as { repeatable?: boolean }).repeatable) return true;
  const walk = (nodes: unknown[]): boolean => {
    for (const n of nodes) {
      if (!n || typeof n !== 'object') continue;
      const obj = n as Record<string, unknown>;
      if (typeof obj.name === 'string' && obj.name.trim().toLowerCase() === 'repeatable') return true;
      if (Array.isArray(obj.entries) && walk(obj.entries)) return true;
    }
    return false;
  };
  return Array.isArray(opt.entries) && walk(opt.entries);
}

export function isLessonsOfFirstOnes(opt: OptionalFeature5e | undefined): boolean {
  return Boolean(opt && opt.name.trim().toLowerCase() === 'lessons of the first ones');
}

export function isPactOfTheTome2024(opt: OptionalFeature5e | undefined): boolean {
  if (!opt || opt.name.trim().toLowerCase() !== 'pact of the tome') return false;
  return opt.edition === 'one' || opt.source.toUpperCase() === 'XPHB' || /three.*cantrips.*ritual/i.test(JSON.stringify(opt.entries));
}

export type CantripChoiceMode = 'damage' | 'attack' | 'range10';

export function getOptionalFeatureCantripConfig(
  opt: OptionalFeature5e | undefined,
): { mode: CantripChoiceMode; label: string } | null {
  if (!opt) return null;
  const lower = opt.name.trim().toLowerCase();
  const hasChoose =
    opt.edition === 'one' ||
    opt.source.toUpperCase() === 'XPHB' ||
    Boolean(
      opt.prerequisite?.some(
        (p) =>
          Array.isArray((p as Record<string, unknown>).spell) &&
          ((p as Record<string, unknown>).spell as unknown[]).some(
            (s) => typeof s === 'object' && s !== null && 'choose' in s,
          ),
      ),
    ) ||
    /choose one of your known/i.test(JSON.stringify(opt.entries || []));
  if (!hasChoose) return null;
  if (lower === 'agonizing blast') {
    return { mode: 'damage', label: 'Known Warlock Cantrip (Deals Damage)' };
  }
  if (lower === 'repelling blast') {
    return { mode: 'attack', label: 'Known Warlock Cantrip (Attack Roll)' };
  }
  if (lower === 'eldritch spear') {
    return { mode: 'range10', label: 'Known Warlock Cantrip (Deals Damage, Range 10+ ft.)' };
  }
  return null;
}

export function isSpellEligibleForCantripConfig(sp: Spell5e, mode: CantripChoiceMode): boolean {
  if (sp.level !== 0) return false;
  const entryText = JSON.stringify(sp.entries || []);
  const dealsDamage = Boolean(sp.damageInflict?.length) || /\{@damage\b/i.test(entryText);
  const hasAttack =
    Boolean(sp.spellAttack?.length) ||
    /\b(?:melee|ranged)\s+spell\s+attack\b|\bmake (?:a|one) (?:attack|spell attack)/i.test(entryText);
  const hasRange10 = sp.range?.distance?.type === 'feet' && (sp.range.distance.amount || 0) >= 10;

  if (mode === 'attack') return hasAttack;
  if (mode === 'range10') return dealsDamage && hasRange10;
  return dealsDamage;
}

export function isOptionalFeatureEligible(
  opt: OptionalFeature5e,
  cls: Class5e,
  classLevel: number,
  enabledSources: string[],
  ruleset: RulesetMode,
  chosenOtherOptKeys: string[] = [],
): boolean {
  if (!isSourceAllowed(opt.source, enabledSources, ruleset, opt.edition)) return false;
  if (ruleset === '2024' && opt.source === 'PHB') return false;
  if (cls.edition === 'one' && opt.source === 'PHB' && ruleset !== 'all') return false;

  if (!opt.prerequisite || opt.prerequisite.length === 0) return true;

  const chosenNames = new Set(
    chosenOtherOptKeys.map((k) => splitEntityKey(k).name.toLowerCase()).filter(Boolean),
  );

  return opt.prerequisite.some((req) => {
    if ('level' in req && req.level) {
      const lvlObj = req.level as number | { level?: number; class?: { name?: string } };
      const reqLvl = typeof lvlObj === 'number' ? lvlObj : lvlObj.level || 1;
      if (classLevel < reqLvl) return false;
      if (typeof lvlObj === 'object' && lvlObj.class?.name) {
        if (lvlObj.class.name.toLowerCase() !== cls.name.toLowerCase()) return false;
      }
    }
    if ('optionalfeature' in req && Array.isArray(req.optionalfeature)) {
      for (const reqOpt of req.optionalfeature) {
        const reqName = splitEntityKey(String(reqOpt)).name.toLowerCase();
        if (reqName && !chosenNames.has(reqName)) return false;
      }
    }
    if ('pact' in req && typeof req.pact === 'string') {
      const pactName = `pact of the ${req.pact.toLowerCase()}`;
      if (!chosenNames.has(pactName)) return false;
    }
    return true;
  });
}

export interface ExpertiseTierSpec {
  featureName: string;
  unlockLevel: number;
  count: number;
  offset: number;
  pool?: string[];
}

export function getClassExpertiseTiers(cls: Class5e, level: number): ExpertiseTierSpec[] {
  const lower = cls.name.toLowerCase();
  const isOne = cls.edition === 'one';
  const raw: { featureName: string; unlockLevel: number; count: number; pool?: string[] }[] = [];

  if (lower === 'rogue') {
    raw.push({ featureName: 'Expertise', unlockLevel: 1, count: 2 });
    raw.push({ featureName: 'Expertise', unlockLevel: 6, count: 2 });
  } else if (lower === 'bard') {
    raw.push({ featureName: 'Expertise', unlockLevel: isOne ? 2 : 3, count: 2 });
    raw.push({ featureName: 'Expertise', unlockLevel: isOne ? 9 : 10, count: 2 });
  } else if (lower === 'ranger' && isOne) {
    raw.push({ featureName: 'Deft Explorer', unlockLevel: 2, count: 1 });
    raw.push({ featureName: 'Expertise', unlockLevel: 9, count: 2 });
  } else if (lower === 'wizard' && isOne) {
    raw.push({
      featureName: 'Scholar',
      unlockLevel: 2,
      count: 1,
      pool: ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Religion'],
    });
  }

  let offset = 0;
  return raw
    .filter((t) => level >= t.unlockLevel)
    .map((t) => {
      const spec: ExpertiseTierSpec = { ...t, offset };
      offset += t.count;
      return spec;
    });
}

export function getClassFeatureLanguageCount(
  className: string,
  edition: string | undefined,
  featureName: string,
): number {
  const cl = className.toLowerCase();
  const fn = featureName.toLowerCase();
  if (cl === 'rogue' && edition === 'one' && fn === "thieves' cant") return 1;
  if (cl === 'ranger' && edition === 'one' && fn === 'deft explorer') return 2;
  return 0;
}

function parseClassFeatureRef(refStr: string): {
  name: string;
  className: string;
  classSource: string;
  level: number;
} {
  const [name = '', className = '', classSource = 'PHB', levelStr = '1'] = refStr.split('|');
  return {
    name,
    className,
    classSource: classSource || 'PHB',
    level: parseInt(levelStr, 10) || 1,
  };
}

function parseSubclassFeatureRef(refStr: string): {
  name: string;
  className: string;
  classSource: string;
  subclassShortName: string;
  subclassSource: string;
  level: number;
} {
  const [
    name = '',
    className = '',
    classSource = 'PHB',
    subclassShortName = '',
    subclassSource = 'PHB',
    levelStr = '3',
  ] = refStr.split('|');
  return {
    name,
    className,
    classSource: classSource || 'PHB',
    subclassShortName,
    subclassSource: subclassSource || classSource || 'PHB',
    level: parseInt(levelStr, 10) || 3,
  };
}

function getSubclassUnlockLevel(cls: Class5e): number {
  for (const cf of cls.classFeatures) {
    if (typeof cf === 'object' && cf.gainSubclassFeature) {
      return parseClassFeatureRef(cf.classFeature).level;
    }
  }
  return cls.edition === 'one' ? 3 : 3;
}

export function getClassAsiLevels(cls: Class5e): number[] {
  const levels = new Set<number>();
  for (const cf of cls.classFeatures) {
    const ref = typeof cf === 'string' ? cf : cf.classFeature;
    const parsed = parseClassFeatureRef(ref);
    if (
      parsed.name.toLowerCase().includes('ability score improvement') ||
      parsed.name.toLowerCase().includes('epic boon')
    ) {
      levels.add(parsed.level);
    }
  }
  if (cls.featProgression) {
    for (const fp of cls.featProgression) {
      const lower = fp.name.toLowerCase();
      if (!lower.includes('ability') && !lower.includes('epic boon') && !fp.category?.includes('EB')) {
        continue;
      }
      if (typeof fp.progression === 'object' && !Array.isArray(fp.progression)) {
        for (const lvl of Object.keys(fp.progression)) {
          const n = parseInt(lvl, 10);
          if (!Number.isNaN(n)) levels.add(n);
        }
      }
    }
  }
  return [...levels].sort((a, b) => a - b);
}

export const ARTISAN_TOOL_LIST = [
  "Alchemist's Supplies",
  "Brewer's Supplies",
  "Calligrapher's Supplies",
  "Carpenter's Tools",
  "Cartographer's Tools",
  "Cobbler's Tools",
  "Cook's Utensils",
  "Glassblower's Tools",
  "Jeweler's Tools",
  "Leatherworker's Tools",
  "Mason's Tools",
  "Painter's Supplies",
  "Potter's Tools",
  "Smith's Tools",
  "Tinker's Tools",
  "Weaver's Tools",
  "Woodcarver's Tools",
];

export const MUSICAL_INSTRUMENT_LIST = [
  'Bagpipes',
  'Drum',
  'Dulcimer',
  'Flute',
  'Horn',
  'Lute',
  'Lyre',
  'Pan Flute',
  'Shawm',
  'Viol',
];

export const GAMING_SET_LIST = [
  'Dice Set',
  'Dragonchess Set',
  'Playing Card Set',
  'Three-Dragon Ante Set',
];

export const GENERAL_TOOL_LIST = [
  ...ARTISAN_TOOL_LIST,
  "Calligrapher's Supplies",
  'Disguise Kit',
  'Forgery Kit',
  'Herbalism Kit',
  "Navigator's Tools",
  "Poisoner's Kit",
  "Thieves' Tools",
  ...GAMING_SET_LIST,
  ...MUSICAL_INSTRUMENT_LIST,
].filter((v, idx, arr) => arr.indexOf(v) === idx);

export function formatProficiencyLabel(raw: string): string {
  const clean = splitEntityKey(raw).name.trim();
  const skillMatch = STANDARD_SKILLS.find((s) => s.name.toLowerCase() === clean.toLowerCase());
  if (skillMatch) return skillMatch.name;
  const knownTool = GENERAL_TOOL_LIST.find((t) => t.toLowerCase() === clean.toLowerCase());
  if (knownTool) return knownTool;
  return clean.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export function getProgressionCount(
  progression: number[] | Record<string, number> | undefined,
  level: number,
): number {
  if (!progression || level <= 0) return 0;
  if (Array.isArray(progression)) {
    return progression[level - 1] || 0;
  }
  return Object.entries(progression).reduce((best, [lvlStr, cnt]) => {
    const l = parseInt(lvlStr, 10);
    return !Number.isNaN(l) && l <= level ? Math.max(best, cnt) : best;
  }, 0);
}

export interface ProficiencyParseConfig {
  fixed: string[];
  choiceCount: number;
  choicePool: string[];
}

const TOOL_CHOICE_META_KEYS = new Set(['choose', 'any', 'anyArtisansTool', 'anyMusicalInstrument', 'anyGamingSet']);

export function extractProficiencyChoices(
  entries: Record<string, unknown>[] | undefined,
  kind: 'skill' | 'tool',
  textHints?: string[],
): ProficiencyParseConfig {
  if (!entries?.length) return { fixed: [], choiceCount: 0, choicePool: [] };
  const fixed: string[] = [];
  let choiceCount = 0;
  const pool = new Set<string>();

  if (kind === 'skill') {
    const allSkillNames = STANDARD_SKILLS.map((s) => s.name);
    for (const entry of entries) {
      for (const [k, v] of Object.entries(entry)) {
        if (k !== 'choose' && k !== 'any' && v === true) {
          fixed.push(formatProficiencyLabel(k));
        }
      }
      const choose = entry.choose as { from?: string[]; count?: number } | undefined;
      if (choose?.from?.length) {
        choiceCount += choose.count || 1;
        for (const s of choose.from) pool.add(formatProficiencyLabel(s));
      }
      if (typeof entry.any === 'number' && entry.any > 0) {
        choiceCount += entry.any;
        for (const s of allSkillNames) pool.add(s);
      }
    }
    return { fixed, choiceCount, choicePool: [...pool].sort((a, b) => a.localeCompare(b)) };
  }

  for (const entry of entries) {
    for (const [k, v] of Object.entries(entry)) {
      if (!TOOL_CHOICE_META_KEYS.has(k) && v === true) {
        fixed.push(formatProficiencyLabel(k));
      }
    }
    const choose = entry.choose as { from?: string[]; count?: number } | undefined;
    if (choose?.from?.length) {
      choiceCount += choose.count || 1;
      for (const t of choose.from) pool.add(formatProficiencyLabel(t));
    }
    if (typeof entry.any === 'number' && entry.any > 0) {
      choiceCount += entry.any;
      for (const t of GENERAL_TOOL_LIST) pool.add(t);
    }
    if (typeof entry.anyArtisansTool === 'number' && entry.anyArtisansTool > 0) {
      choiceCount += entry.anyArtisansTool;
      for (const t of ARTISAN_TOOL_LIST) pool.add(t);
    }
    if (typeof entry.anyMusicalInstrument === 'number' && entry.anyMusicalInstrument > 0) {
      choiceCount += entry.anyMusicalInstrument;
      for (const t of MUSICAL_INSTRUMENT_LIST) pool.add(t);
    }
    if (typeof entry.anyGamingSet === 'number' && entry.anyGamingSet > 0) {
      choiceCount += entry.anyGamingSet;
      for (const t of GAMING_SET_LIST) pool.add(t);
    }
  }

  // Handle exclusive "Artisan's Tools OR Musical Instrument" (e.g. Monk) encoded as two separate 1-choice blocks
  if (
    entries.length > 1 &&
    choiceCount === 2 &&
    textHints?.some((h) => /\bor\b/i.test(h)) &&
    entries.every((e) => e.anyArtisansTool === 1 || e.anyMusicalInstrument === 1)
  ) {
    choiceCount = 1;
  }

  return { fixed, choiceCount, choicePool: [...pool] };
}

export function extractClassSkillConfig(cls: Class5e, isPrimary: boolean): ProficiencyParseConfig {
  const entries = isPrimary
    ? cls.startingProficiencies?.skills
    : cls.multiclassing?.proficienciesGained?.skills;
  return extractProficiencyChoices(entries, 'skill');
}

export function extractClassToolConfig(cls: Class5e, isPrimary: boolean): ProficiencyParseConfig {
  const block = isPrimary
    ? cls.startingProficiencies?.toolProficiencies
    : cls.multiclassing?.proficienciesGained?.toolProficiencies;
  const hints = (isPrimary
    ? cls.startingProficiencies?.tools
    : cls.multiclassing?.proficienciesGained?.tools) as string[] | undefined;
  return extractProficiencyChoices(block, 'tool', hints);
}

export interface BackgroundProficiencySlot {
  kind: 'choice' | 'replacement';
  replacedName?: string;
  pool: string[];
}

export interface ResolvedBackgroundProficiencies {
  fixedBgSkills: string[];
  keptFixedSkills: string[];
  overlappedSkills: string[];
  skillSlots: BackgroundProficiencySlot[];
  fixedBgTools: string[];
  keptFixedTools: string[];
  overlappedTools: string[];
  toolSlots: BackgroundProficiencySlot[];
  nonBgSkillSources: Map<string, string>;
  nonBgToolSources: Map<string, string>;
}

export function resolveBackgroundProficiencyState(
  character: Character,
  compendium: CompiledCompendium,
): ResolvedBackgroundProficiencies {
  const nonBgSkillSources = new Map<string, string>();
  const nonBgToolSources = new Map<string, string>();

  const recordNonBg = (map: Map<string, string>, raw: string, source: string) => {
    const label = formatProficiencyLabel(raw);
    const key = label.toLowerCase();
    if (!map.has(key)) map.set(key, source);
  };

  const race = findRace(compendium, character.race.raceKey);
  if (race) {
    for (const s of extractFixedSkills(race.skillProficiencies)) recordNonBg(nonBgSkillSources, s, race.name);
    for (const s of character.race.chosenSkills || []) recordNonBg(nonBgSkillSources, s, race.name);
    for (const t of extractFixedTools(race.toolProficiencies)) recordNonBg(nonBgToolSources, t, race.name);
    for (const t of character.race.chosenTools || []) recordNonBg(nonBgToolSources, t, race.name);
  }
  for (const s of character.race.originFeatChoices?.skills || []) {
    recordNonBg(nonBgSkillSources, s, race?.name || 'Species Feat');
  }
  for (const t of character.race.originFeatChoices?.tools || []) {
    recordNonBg(nonBgToolSources, t, race?.name || 'Species Feat');
  }
  for (const s of character.background.originFeatChoices?.skills || []) {
    recordNonBg(nonBgSkillSources, s, 'Origin Feat');
  }
  for (const t of character.background.originFeatChoices?.tools || []) {
    recordNonBg(nonBgToolSources, t, 'Origin Feat');
  }

  for (const sel of character.classes) {
    const cls = findClass(compendium, sel.className, sel.classSource);
    const label = sel.className;
    if (cls) {
      for (const s of extractClassSkillConfig(cls, sel.isPrimary).fixed) recordNonBg(nonBgSkillSources, s, label);
      for (const t of extractClassToolConfig(cls, sel.isPrimary).fixed) recordNonBg(nonBgToolSources, t, label);
    }
    for (const s of sel.chosenSkills || []) recordNonBg(nonBgSkillSources, s, label);
    for (const t of sel.chosenTools || []) recordNonBg(nonBgToolSources, t, label);
    for (const arr of Object.values(sel.chosenClassFeatureSkills || {})) {
      for (const s of arr) recordNonBg(nonBgSkillSources, s, label);
    }
    for (const arr of Object.values(sel.chosenClassFeatureTools || {})) {
      for (const t of arr) recordNonBg(nonBgToolSources, t, label);
    }
    for (const sub of Object.values(sel.chosenOptionalFeatureSubChoices || {})) {
      if (sub.featKey) {
        const ft = findFeat(compendium, sub.featKey);
        if (ft) {
          for (const s of extractFixedSkills(ft.skillProficiencies)) recordNonBg(nonBgSkillSources, s, `${label} Feat`);
          for (const t of extractFixedTools(ft.toolProficiencies)) recordNonBg(nonBgToolSources, t, `${label} Feat`);
        }
      }
      for (const s of sub.featChoices?.skills || []) recordNonBg(nonBgSkillSources, s, `${label} Feat`);
      for (const t of sub.featChoices?.tools || []) recordNonBg(nonBgToolSources, t, `${label} Feat`);
    }
  }

  const background = findBackground(compendium, character.background.backgroundKey);
  const bgSkillCfg = extractProficiencyChoices(background?.skillProficiencies, 'skill');
  const bgToolCfg = extractProficiencyChoices(background?.toolProficiencies, 'tool');

  const keptFixedSkills: string[] = [];
  const overlappedSkills: string[] = [];
  for (const sk of bgSkillCfg.fixed) {
    if (nonBgSkillSources.has(sk.toLowerCase())) overlappedSkills.push(sk);
    else keptFixedSkills.push(sk);
  }

  const allSkillNames = STANDARD_SKILLS.map((s) => s.name);
  const skillSlots: BackgroundProficiencySlot[] = [
    ...Array.from({ length: bgSkillCfg.choiceCount }, () => ({
      kind: 'choice' as const,
      pool: bgSkillCfg.choicePool.length > 0 ? bgSkillCfg.choicePool : allSkillNames,
    })),
    ...overlappedSkills.map((name) => ({
      kind: 'replacement' as const,
      replacedName: name,
      pool: allSkillNames,
    })),
  ];

  const keptFixedTools: string[] = [];
  const overlappedTools: string[] = [];
  for (const tl of bgToolCfg.fixed) {
    if (nonBgToolSources.has(tl.toLowerCase())) overlappedTools.push(tl);
    else keptFixedTools.push(tl);
  }

  const toolSlots: BackgroundProficiencySlot[] = [
    ...Array.from({ length: bgToolCfg.choiceCount }, () => ({
      kind: 'choice' as const,
      pool: bgToolCfg.choicePool.length > 0 ? bgToolCfg.choicePool : GENERAL_TOOL_LIST,
    })),
    ...overlappedTools.map((name) => ({
      kind: 'replacement' as const,
      replacedName: name,
      pool: GENERAL_TOOL_LIST,
    })),
  ];

  return {
    fixedBgSkills: bgSkillCfg.fixed,
    keptFixedSkills,
    overlappedSkills,
    skillSlots,
    fixedBgTools: bgToolCfg.fixed,
    keptFixedTools,
    overlappedTools,
    toolSlots,
    nonBgSkillSources,
    nonBgToolSources,
  };
}

export interface FeatProficiencyConfig {
  fixedSkills: string[];
  skillCount: number;
  skillPool: string[];
  fixedTools: string[];
  toolCount: number;
  toolPool: string[];
  fixedLanguages: string[];
  languageCount: number;
  languagePool: string[];
  mixedCount: number;
  mixedSkillsPool: string[];
  mixedToolsPool: string[];
}

export function extractFeatProficiencyConfig(
  feat: Feat5e | undefined,
  languageNames: string[] = [],
): FeatProficiencyConfig {
  if (!feat) {
    return {
      fixedSkills: [],
      skillCount: 0,
      skillPool: [],
      fixedTools: [],
      toolCount: 0,
      toolPool: [],
      fixedLanguages: [],
      languageCount: 0,
      languagePool: [],
      mixedCount: 0,
      mixedSkillsPool: [],
      mixedToolsPool: [],
    };
  }
  const sk = extractProficiencyChoices(feat.skillProficiencies, 'skill');
  const tl = extractProficiencyChoices(feat.toolProficiencies, 'tool');

  const fixedLanguages = extractFixedLanguages(feat.languageProficiencies);
  let languageCount = 0;
  const langPool = new Set<string>();
  for (const entry of feat.languageProficiencies || []) {
    const choose = entry.choose as { from?: string[]; count?: number } | undefined;
    if (choose?.from?.length) {
      languageCount += choose.count || 1;
      for (const l of choose.from) langPool.add(formatProficiencyLabel(l));
    }
    const anyCount =
      (typeof entry.anyStandard === 'number' ? entry.anyStandard : 0) +
      (typeof entry.any === 'number' ? entry.any : 0);
    if (anyCount > 0) {
      languageCount += anyCount;
      for (const l of languageNames) langPool.add(l);
    }
  }

  let mixedCount = 0;
  let wantsSkills = false;
  let wantsTools = false;
  for (const entry of feat.skillToolLanguageProficiencies || []) {
    for (const ch of entry.choose || []) {
      mixedCount += ch.count || 1;
      const from = ch.from || [];
      if (from.some((x) => x === 'anySkill')) wantsSkills = true;
      if (from.some((x) => x === 'anyTool')) wantsTools = true;
    }
  }

  return {
    fixedSkills: sk.fixed,
    skillCount: sk.choiceCount,
    skillPool: sk.choicePool,
    fixedTools: tl.fixed,
    toolCount: tl.choiceCount,
    toolPool: tl.choicePool,
    fixedLanguages,
    languageCount,
    languagePool: [...langPool].sort((a, b) => a.localeCompare(b)),
    mixedCount,
    mixedSkillsPool: wantsSkills ? STANDARD_SKILLS.map((s) => s.name) : [],
    mixedToolsPool: wantsTools ? GENERAL_TOOL_LIST : [],
  };
}

export type FeatSlotIdentifier =
  | 'background-feat'
  | 'species-feat'
  | { classId: string; level: number }
  | { classId: string; optSubKey: string }
  | { classId: string; fpSubKey: string };

export function getCharacterKnownProficiencies(
  character: Character,
  compendium: CompiledCompendium,
  options?: {
    excludeRaceChoices?: boolean;
    excludeFeatSlot?: FeatSlotIdentifier;
  },
): { skills: Set<string>; tools: Set<string>; languages: Set<string> } {
  const skills = new Set<string>();
  const tools = new Set<string>();
  const languages = new Set<string>(['common']);

  const addSkill = (s: string) => {
    const clean = formatProficiencyLabel(s).toLowerCase();
    if (clean) skills.add(clean);
  };
  const addTool = (t: string) => {
    const clean = formatProficiencyLabel(t).toLowerCase();
    if (clean) tools.add(clean);
  };
  const addLang = (l: string) => {
    const clean = formatProficiencyLabel(l).toLowerCase();
    if (clean) languages.add(clean);
  };

  for (const sel of character.classes) {
    const cls = findClass(compendium, sel.className, sel.classSource);
    if (cls) {
      for (const s of extractClassSkillConfig(cls, sel.isPrimary).fixed) addSkill(s);
      for (const t of extractClassToolConfig(cls, sel.isPrimary).fixed) addTool(t);
    }
    for (const s of sel.chosenSkills || []) addSkill(s);
    for (const t of sel.chosenTools || []) addTool(t);
    for (const arr of Object.values(sel.chosenClassFeatureSkills || {})) {
      for (const s of arr) addSkill(s);
    }
    for (const arr of Object.values(sel.chosenClassFeatureTools || {})) {
      for (const t of arr) addTool(t);
    }
    for (const arr of Object.values(sel.chosenClassFeatureLanguages || {})) {
      for (const l of arr) addLang(l);
    }
    if (sel.className.toLowerCase() === 'druid') addLang('Druidic');
    if (sel.className.toLowerCase() === 'rogue') addLang("Thieves' Cant");

    for (const [lvlStr, asi] of Object.entries(sel.asiChoices || {})) {
      const lvl = parseInt(lvlStr, 10);
      if (lvl > sel.level || asi.mode !== 'feat' || !asi.featKey) continue;
      const isExcluded =
        typeof options?.excludeFeatSlot === 'object' &&
        'level' in options.excludeFeatSlot &&
        options.excludeFeatSlot.classId === sel.id &&
        options.excludeFeatSlot.level === lvl;
      const featObj = findFeat(compendium, asi.featKey);
      if (featObj) {
        for (const s of extractFixedSkills(featObj.skillProficiencies)) addSkill(s);
        for (const t of extractFixedTools(featObj.toolProficiencies)) addTool(t);
        for (const l of extractFixedLanguages(featObj.languageProficiencies)) addLang(l);
      }
      if (!isExcluded) {
        for (const s of asi.featSkills || []) addSkill(s);
        for (const t of asi.featTools || []) addTool(t);
        for (const l of asi.featLanguages || []) addLang(l);
      }
    }

    for (const [subKey, sub] of Object.entries(sel.chosenOptionalFeatureSubChoices || {})) {
      if (!sub.featKey) continue;
      const isExcluded =
        typeof options?.excludeFeatSlot === 'object' &&
        'optSubKey' in options.excludeFeatSlot &&
        options.excludeFeatSlot.classId === sel.id &&
        options.excludeFeatSlot.optSubKey === subKey;
      const featObj = findFeat(compendium, sub.featKey);
      if (featObj) {
        for (const s of extractFixedSkills(featObj.skillProficiencies)) addSkill(s);
        for (const t of extractFixedTools(featObj.toolProficiencies)) addTool(t);
        for (const l of extractFixedLanguages(featObj.languageProficiencies)) addLang(l);
      }
      if (!isExcluded) {
        for (const s of sub.featChoices?.skills || []) addSkill(s);
        for (const t of sub.featChoices?.tools || []) addTool(t);
        for (const l of sub.featChoices?.languages || []) addLang(l);
      }
    }

    for (const [fpKey, fKeys] of Object.entries(sel.chosenFeatProgressions || {})) {
      fKeys.forEach((fKey, idx) => {
        const fpSubKey = `${fpKey}:${idx}`;
        const isExcluded =
          typeof options?.excludeFeatSlot === 'object' &&
          'fpSubKey' in options.excludeFeatSlot &&
          options.excludeFeatSlot.classId === sel.id &&
          options.excludeFeatSlot.fpSubKey === fpSubKey;
        const featObj = findFeat(compendium, fKey);
        if (featObj) {
          for (const s of extractFixedSkills(featObj.skillProficiencies)) addSkill(s);
          for (const t of extractFixedTools(featObj.toolProficiencies)) addTool(t);
          for (const l of extractFixedLanguages(featObj.languageProficiencies)) addLang(l);
        }
        const ch = sel.chosenFeatProgressionChoices?.[fpSubKey];
        if (!isExcluded && ch) {
          for (const s of ch.skills || []) addSkill(s);
          for (const t of ch.tools || []) addTool(t);
          for (const l of ch.languages || []) addLang(l);
        }
      });
    }
  }

  const bg = findBackground(compendium, character.background.backgroundKey);
  if (bg) {
    for (const s of extractFixedSkills(bg.skillProficiencies)) addSkill(s);
    for (const t of extractFixedTools(bg.toolProficiencies)) addTool(t);
    for (const l of extractFixedLanguages(bg.languageProficiencies)) addLang(l);
  }
  for (const s of character.background.chosenSkills || []) addSkill(s);
  for (const t of character.background.chosenTools || []) addTool(t);
  for (const l of character.background.chosenLanguages || []) addLang(l);

  const bgFeat = findFeat(compendium, character.background.originFeatKey);
  if (bgFeat) {
    for (const s of extractFixedSkills(bgFeat.skillProficiencies)) addSkill(s);
    for (const t of extractFixedTools(bgFeat.toolProficiencies)) addTool(t);
    for (const l of extractFixedLanguages(bgFeat.languageProficiencies)) addLang(l);
  }
  if (options?.excludeFeatSlot !== 'background-feat') {
    for (const s of character.background.originFeatChoices?.skills || []) addSkill(s);
    for (const t of character.background.originFeatChoices?.tools || []) addTool(t);
    for (const l of character.background.originFeatChoices?.languages || []) addLang(l);
  }

  const race = findRace(compendium, character.race.raceKey);
  if (race) {
    for (const s of extractFixedSkills(race.skillProficiencies)) addSkill(s);
    for (const t of extractFixedTools(race.toolProficiencies)) addTool(t);
    for (const l of extractFixedLanguages(race.languageProficiencies)) addLang(l);
  }
  if (!options?.excludeRaceChoices) {
    for (const s of character.race.chosenSkills || []) addSkill(s);
    for (const t of character.race.chosenTools || []) addTool(t);
    for (const l of character.race.chosenLanguages || []) addLang(l);
  }

  const raceFeat = findFeat(compendium, character.race.originFeatKey);
  if (raceFeat) {
    for (const s of extractFixedSkills(raceFeat.skillProficiencies)) addSkill(s);
    for (const t of extractFixedTools(raceFeat.toolProficiencies)) addTool(t);
    for (const l of extractFixedLanguages(raceFeat.languageProficiencies)) addLang(l);
  }
  if (!options?.excludeRaceChoices && options?.excludeFeatSlot !== 'species-feat') {
    for (const s of character.race.originFeatChoices?.skills || []) addSkill(s);
    for (const t of character.race.originFeatChoices?.tools || []) addTool(t);
    for (const l of character.race.originFeatChoices?.languages || []) addLang(l);
  }

  return { skills, tools, languages };
}

export function getExistingProficienciesExcludingRaceChoices(
  character: Character,
  compendium: CompiledCompendium,
): { skills: Set<string>; tools: Set<string>; languages: Set<string> } {
  return getCharacterKnownProficiencies(character, compendium, { excludeRaceChoices: true });
}

function extractFixedSkills(entries: Record<string, unknown>[] | undefined): string[] {
  if (!entries) return [];
  const skills: string[] = [];
  for (const entry of entries) {
    for (const [k, v] of Object.entries(entry)) {
      if (k !== 'choose' && k !== 'any' && v === true) {
        const match = STANDARD_SKILLS.find((s) => s.name.toLowerCase() === k.toLowerCase());
        if (match) skills.push(match.name);
      }
    }
  }
  return skills;
}

function extractFixedTools(entries: Record<string, unknown>[] | undefined): string[] {
  if (!entries) return [];
  const tools: string[] = [];
  for (const entry of entries) {
    for (const [k, v] of Object.entries(entry)) {
      if (!TOOL_CHOICE_META_KEYS.has(k) && v === true) {
        tools.push(formatProficiencyLabel(k));
      }
    }
  }
  return tools;
}

function extractFixedLanguages(entries: Record<string, unknown>[] | undefined): string[] {
  if (!entries) return [];
  const langs: string[] = [];
  for (const entry of entries) {
    for (const [k, v] of Object.entries(entry)) {
      if (
        k !== 'choose' &&
        k !== 'anyStandard' &&
        k !== 'any' &&
        k !== 'other' &&
        v === true
      ) {
        langs.push(k.charAt(0).toUpperCase() + k.slice(1));
      }
    }
  }
  return langs;
}

function parseSpellRefString(raw: string): string {
  return raw.split('#')[0];
}

function collectAdditionalSpells(
  list: AdditionalSpellsEntry[] | undefined,
  charLevel: number,
  defaultAbility: AbilityKey,
  lineageFilter?: string,
): {
  prepared: string[];
  innate: { spellKey: string; uses: string; minLevel: number; ability: AbilityKey }[];
} {
  const prepared: string[] = [];
  const innate: { spellKey: string; uses: string; minLevel: number; ability: AbilityKey }[] = [];
  if (!list) return { prepared, innate };

  for (const block of list) {
    if (block.name && lineageFilter && block.name.toLowerCase() !== lineageFilter.toLowerCase()) {
      continue;
    }
    const ability: AbilityKey =
      typeof block.ability === 'string'
        ? block.ability
        : block.ability?.choose?.[0] || defaultAbility;

    const readSpellBucket = (bucket: unknown, isInnate: boolean) => {
      if (!bucket || typeof bucket !== 'object') return;
      for (const [lvlKey, val] of Object.entries(bucket as Record<string, unknown>)) {
        const minLvl = lvlKey === '_' ? 1 : parseInt(lvlKey, 10) || 1;
        if (minLvl > charLevel) continue;

        if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === 'string') {
              const sk = parseSpellRefString(item);
              if (isInnate) innate.push({ spellKey: sk, uses: 'At Will', minLevel: minLvl, ability });
              else prepared.push(sk);
            }
          }
        } else if (typeof val === 'object' && val !== null) {
          for (const [freqKey, freqVal] of Object.entries(val as Record<string, unknown>)) {
            if (Array.isArray(freqVal)) {
              for (const item of freqVal) {
                if (typeof item === 'string') {
                  innate.push({ spellKey: parseSpellRefString(item), uses: freqKey, minLevel: minLvl, ability });
                }
              }
            } else if (typeof freqVal === 'object' && freqVal !== null) {
              for (const [countKey, spellsArr] of Object.entries(freqVal as Record<string, unknown>)) {
                if (Array.isArray(spellsArr)) {
                  for (const item of spellsArr) {
                    if (typeof item === 'string') {
                      const label = freqKey === 'daily' ? `${countKey}/Long Rest` : `${countKey}/${freqKey}`;
                      innate.push({ spellKey: parseSpellRefString(item), uses: label, minLevel: minLvl, ability });
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    readSpellBucket(block.prepared, false);
    readSpellBucket(block.known, isInnateOnly(block));
    readSpellBucket(block.innate, true);
  }

  return { prepared, innate };
}

function isInnateOnly(block: AdditionalSpellsEntry): boolean {
  return Boolean(block.innate && !block.prepared);
}

function isPassiveMetaFeature(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return (
    /^core .* traits$/.test(lower) ||
    lower === 'spellcasting' ||
    lower === 'pact magic' ||
    lower === 'eldritch invocations' ||
    lower === 'eldritch invocation options' ||
    lower === 'ability score improvement' ||
    lower === 'creature type' ||
    lower === 'size' ||
    lower === 'speed' ||
    lower === 'languages' ||
    lower === 'darkvision' ||
    lower === 'superior darkvision' ||
    lower === 'keen senses' ||
    lower === 'fey ancestry' ||
    lower === 'skillful' ||
    lower === 'versatile' ||
    lower === 'resourceful' ||
    lower === 'trance' ||
    lower === 'astral trance'
  );
}

function isOptionCatalogClassFeature(name: string, entries: unknown[]): boolean {
  const lower = name.trim().toLowerCase();
  if (lower.endsWith(' options') && /(invocation|fighting style|metamagic|maneuver|infusion|plan|rune)/i.test(lower)) {
    return true;
  }
  return Array.isArray(entries) && entries.some((e) => typeof e === 'object' && e !== null && (e as { type?: string }).type === 'options');
}

function inferOptionalParentFeature(featureTypeList: string[] | undefined, groupKey: string): string | undefined {
  const fTypes = (featureTypeList || []).map((t) => t.toUpperCase());
  const gk = groupKey.toLowerCase();
  if (fTypes.includes('EI') || gk.includes('eldritch invocation')) return 'Eldritch Invocations';
  if (fTypes.some((t) => t.startsWith('FS')) || gk.includes('fighting style')) return 'Fighting Style';
  if (fTypes.includes('MM') || gk.includes('metamagic')) return 'Metamagic';
  if (fTypes.some((t) => t.startsWith('MV')) || gk.includes('maneuver')) return 'Combat Superiority';
  if (fTypes.includes('AI') || gk.includes('infusion')) return 'Infuse Item';
  if (fTypes.includes('ED') || gk.includes('elemental discipline')) return 'Elemental Disciplines';
  if (fTypes.includes('PB') || gk.includes('pact boon')) return 'Pact Boon';
  if (fTypes.includes('RN') || gk.includes('rune')) return 'Rune Carver';
  return undefined;
}

function flattenEntriesPlainText(entries: unknown[]): string {
  const chunks: string[] = [];
  const walk = (node: unknown) => {
    if (!node) return;
    if (typeof node === 'string') {
      chunks.push(node.replace(/\{@\w+\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1'));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      if (obj.entry) walk(obj.entry);
      if (obj.entries) walk(obj.entries);
      if (obj.items) walk(obj.items);
    }
  };
  walk(entries);
  return chunks.join(' ');
}

function classifyFeatureActionType(
  name: string,
  entries: unknown[],
  hasLimitedUse: boolean,
): 'action' | 'bonus' | 'reaction' | 'other' | undefined {
  if (isPassiveMetaFeature(name)) return undefined;
  const text = flattenEntriesPlainText(entries).toLowerCase();
  if (!text && !hasLimitedUse) return undefined;

  if (
    /as a bonus action|using a bonus action|with a bonus action|take a bonus action|requires a bonus action|uses? (?:a|your) bonus action|this feature's bonus action/.test(
      text,
    )
  ) {
    return 'bonus';
  }
  if (/as a reaction|using a reaction|take a reaction|requires a reaction|uses? your reaction/.test(text)) {
    return 'reaction';
  }
  if (
    /as an action|as a magic action|use your action|requires an action|when you take the attack action|take the (?:attack|magic|hide|dash|disengage|dodge|help|search|study|utilize) action|can take one additional action/.test(
      text,
    )
  ) {
    return 'action';
  }
  if (hasLimitedUse || /when you (?:are reduced|hit a target|miss|fail|finish)|on your turn/.test(text)) {
    return 'other';
  }
  return undefined;
}

function estimateLimitedUses(
  name: string,
  classLevel: number,
  profBonus: number,
  abilities: Record<AbilityKey, { modifier: number }>,
  entries: unknown[] = [],
): { max: number; resetOn: 'short' | 'long' } | undefined {
  const lower = name.toLowerCase();
  if (lower === 'second wind') {
    if (classLevel >= 10) return { max: 4, resetOn: 'short' };
    if (classLevel >= 4) return { max: 3, resetOn: 'short' };
    return { max: 2, resetOn: 'short' };
  }
  if (lower === 'action surge') {
    return { max: classLevel >= 17 ? 2 : 1, resetOn: 'short' };
  }
  if (lower === 'indomitable') {
    if (classLevel >= 17) return { max: 3, resetOn: 'long' };
    if (classLevel >= 13) return { max: 2, resetOn: 'long' };
    return { max: 1, resetOn: 'long' };
  }
  if (lower === 'rage') {
    if (classLevel >= 17) return { max: 6, resetOn: 'long' };
    if (classLevel >= 12) return { max: 5, resetOn: 'long' };
    if (classLevel >= 6) return { max: 4, resetOn: 'long' };
    if (classLevel >= 3) return { max: 3, resetOn: 'long' };
    return { max: 2, resetOn: 'long' };
  }
  if (lower === 'bardic inspiration') {
    return {
      max: Math.max(1, abilities.cha.modifier),
      resetOn: classLevel >= 5 ? 'short' : 'long',
    };
  }
  if (lower === 'channel divinity') {
    if (classLevel >= 18) return { max: 3, resetOn: 'short' };
    if (classLevel >= 6) return { max: 2, resetOn: 'short' };
    return { max: 1, resetOn: 'short' };
  }
  if (lower === 'wild shape') {
    return { max: classLevel >= 6 ? 3 : 2, resetOn: 'short' };
  }
  if (lower === 'lay on hands') {
    return { max: classLevel * 5, resetOn: 'long' };
  }
  if (lower === 'ki' || lower === "monk's focus" || lower === 'focus points') {
    return { max: classLevel, resetOn: 'short' };
  }
  if (lower === 'font of magic' || lower === 'sorcery points') {
    return { max: classLevel, resetOn: 'long' };
  }
  if (lower === 'lucky') {
    return { max: profBonus, resetOn: 'long' };
  }
  if (lower === 'arcane recovery' || lower === 'magical cunning') {
    return { max: 1, resetOn: 'long' };
  }
  if (lower === 'relentless endurance' || lower === 'fey step' || lower === 'breath weapon' || lower === 'starlight step') {
    return {
      max: lower === 'breath weapon' || lower === 'starlight step' ? profBonus : 1,
      resetOn: 'long',
    };
  }

  if (isPassiveMetaFeature(name) || entries.length === 0) return undefined;

  const text = flattenEntriesPlainText(entries).toLowerCase();
  const hasLimitedSignal =
    /can't use this .* again until|can't do so again until|regain(?: all| one)? expended use|number of times equal to|once per (?:short|long) rest|twice per (?:short|long) rest|uses per (?:short|long) rest/.test(
      text,
    );
  if (!hasLimitedSignal) return undefined;

  let resetOn: 'short' | 'long' = 'long';
  if (/short or (?:a )?long rest|finish a short rest/.test(text) && !/regain one expended use when you finish a short rest/.test(text)) {
    resetOn = 'short';
  }

  if (/twice your proficiency bonus/.test(text)) return { max: profBonus * 2, resetOn };
  if (/proficiency bonus/.test(text)) return { max: profBonus, resetOn };

  const modMatch = text.match(/equal to your (strength|dexterity|constitution|intelligence|wisdom|charisma) modifier/);
  if (modMatch) {
    const map: Record<string, AbilityKey> = {
      strength: 'str',
      dexterity: 'dex',
      constitution: 'con',
      intelligence: 'int',
      wisdom: 'wis',
      charisma: 'cha',
    };
    const key = map[modMatch[1]];
    if (key) return { max: Math.max(1, abilities[key].modifier), resetOn };
  }

  if (/twice|two times|2 uses/.test(text)) return { max: 2, resetOn };
  if (/three times|3 uses/.test(text)) return { max: 3, resetOn };
  return { max: 1, resetOn };
}

function parseBonusNum(str: string | undefined): number {
  if (!str) return 0;
  const n = parseInt(str, 10);
  return Number.isNaN(n) ? 0 : n;
}

export function getFixedRacialBonuses(race: Race5e | undefined): Partial<Record<AbilityKey, number>> {
  const bonuses: Partial<Record<AbilityKey, number>> = {};
  if (!race?.ability) return bonuses;
  for (const block of race.ability) {
    for (const k of ABILITY_KEYS) {
      if (typeof block[k] === 'number') {
        bonuses[k] = (bonuses[k] || 0) + (block[k] as number);
      }
    }
  }
  return bonuses;
}

export function getFixedFeatBonuses(feat: Feat5e | undefined): Partial<Record<AbilityKey, number>> {
  const bonuses: Partial<Record<AbilityKey, number>> = {};
  if (!feat?.ability) return bonuses;
  for (const block of feat.ability) {
    for (const k of ABILITY_KEYS) {
      if (typeof block[k] === 'number') {
        bonuses[k] = (bonuses[k] || 0) + (block[k] as number);
      }
    }
  }
  return bonuses;
}

export function getClassPreparedSpellLimit(
  cls: Class5e,
  sub: Subclass5e | undefined,
  classLevel: number,
  spellMod: number,
): number {
  const progLimit =
    (sub?.preparedSpellsProgression || cls.preparedSpellsProgression)?.[classLevel - 1] ?? 0;
  if (progLimit > 0) return progLimit;
  const formula = sub?.preparedSpells || cls.preparedSpells;
  if (!formula) return 0;
  if (formula.includes('/2')) {
    return Math.max(1, Math.floor(classLevel / 2) + spellMod);
  }
  return Math.max(1, classLevel + spellMod);
}

export function getAvailableSpellsForClass(
  compendium: CompiledCompendium,
  className: string,
  classSource: string,
  subclassName?: string,
  subclassSource?: string,
  maxSpellLevel = 9,
  enabledSources: string[] = [],
  ruleset: RulesetMode = '2024',
  extraClassNames: string[] = [],
): Spell5e[] {
  const preferredEdition = ruleset === '2024' ? 'one' : ruleset === '2014' ? 'classic' : undefined;
  const extraSet = new Set(extraClassNames.map((n) => n.toLowerCase()));
  const matches = compendium.spells.filter((sp) => {
    if (sp.level > maxSpellLevel) return false;
    if (enabledSources.length > 0 && !enabledSources.includes(sp.source)) return false;

    const inClass = sp.classes?.some(
      (c) =>
        c.name.toLowerCase() === className.toLowerCase() &&
        (c.source.toLowerCase() === classSource.toLowerCase() ||
          !classSource ||
          (classSource.toUpperCase() === 'XPHB' && !isCoreSource(sp.source) && c.source.toUpperCase() === 'PHB')),
    );
    const inExtraClass =
      extraSet.size > 0 &&
      sp.level >= 1 &&
      sp.classes?.some((c) => extraSet.has(c.name.toLowerCase()));
    const inSubclass =
      subclassName &&
      sp.subclasses?.some(
        (sc) =>
          sc.className.toLowerCase() === className.toLowerCase() &&
          sc.name.toLowerCase() === subclassName.toLowerCase() &&
          (!subclassSource || sc.source.toLowerCase() === subclassSource.toLowerCase()),
      );

    // Fallback for Eldritch Knight / Arcane Trickster -> Wizard spell list if lookup lacked subclass
    const isEkOrAt =
      (subclassName?.toLowerCase() === 'eldritch knight' ||
        subclassName?.toLowerCase() === 'arcane trickster') &&
      sp.classes?.some((c) => c.name.toLowerCase() === 'wizard');

    return Boolean(inClass || inExtraClass || inSubclass || isEkOrAt);
  });

  // Deduplicate by spell name preferring active ruleset/source
  const byName = new Map<string, Spell5e>();
  for (const sp of matches) {
    const key = sp.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, sp);
    } else if (preferredEdition && sp.source === 'XPHB' && existing.source !== 'XPHB') {
      byName.set(key, sp);
    }
  }

  return [...byName.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

export function computeCharacter(character: Character, compendium: CompiledCompendium): ComputedCharacter {
  const totalLevel = Math.max(
    1,
    character.classes.reduce((sum, c) => sum + Math.max(0, c.level), 0) || 1,
  );
  const proficiencyBonus = getProficiencyBonus(totalLevel);

  const race = findRace(compendium, character.race.raceKey);
  const background = findBackground(compendium, character.background.backgroundKey);

  // 1. Collect all ASIs & Feats across class selections + origin feat
  const speciesBonus: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  const backgroundBonus: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  const asiFeatBonus: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

  const hideSpeciesAsi = shouldHideSpeciesAsi(character, race, background);
  if (!hideSpeciesAsi) {
    if (character.race.abilityMode === 'fixed' && race) {
      const fixed = getFixedRacialBonuses(race);
      for (const k of ABILITY_KEYS) speciesBonus[k] += fixed[k] || 0;
    } else if (character.race.abilityMode !== 'none') {
      for (const k of ABILITY_KEYS) speciesBonus[k] += character.race.abilityBonuses[k] || 0;
    }
  }

  if (character.background.abilityMode !== 'none') {
    for (const k of ABILITY_KEYS) backgroundBonus[k] += character.background.abilityBonuses[k] || 0;
  }

  const activeFeats: { feat: Feat5e; sourceLabel: string; choices?: OriginFeatChoicesData }[] = [];

  if (character.background.originFeatKey) {
    const f = findFeat(compendium, character.background.originFeatKey);
    if (f) {
      activeFeats.push({
        feat: f,
        sourceLabel: `${background?.name || 'Background'} Origin Feat`,
        choices: character.background.originFeatChoices,
      });
    }
  }

  if (character.race.originFeatKey) {
    const rf = findFeat(compendium, character.race.originFeatKey);
    if (rf) {
      activeFeats.push({
        feat: rf,
        sourceLabel: `${race?.name || 'Species'} Feat`,
        choices: character.race.originFeatChoices,
      });
    }
  }

  for (const clsSel of character.classes) {
    for (const [lvlStr, asi] of Object.entries(clsSel.asiChoices || {})) {
      const lvl = parseInt(lvlStr, 10);
      if (lvl > clsSel.level) continue;
      if (asi.mode === 'asi' && asi.abilities) {
        for (const k of ABILITY_KEYS) {
          asiFeatBonus[k] += asi.abilities[k] || 0;
        }
      } else if (asi.mode === 'feat' && asi.featKey) {
        const f = findFeat(compendium, asi.featKey);
        if (f) {
          activeFeats.push({
            feat: f,
            sourceLabel: `${clsSel.className} ${lvl} Feat`,
            choices: {
              abilities: asi.featAbilityChoice,
              skills: asi.featSkills,
              tools: asi.featTools,
              languages: asi.featLanguages,
              spells: asi.featSpells,
              spellAbility: asi.featSpellAbility,
              expertiseSkills: asi.featExpertiseSkills,
              resistances: asi.featResistances,
            },
          });
        }
      }
    }
    for (const [fpKey, fpKeys] of Object.entries(clsSel.chosenFeatProgressions || {})) {
      fpKeys.forEach((fKey, slotIdx) => {
        const f = findFeat(compendium, fKey);
        if (f) {
          activeFeats.push({
            feat: f,
            sourceLabel: `${clsSel.className} Feature`,
            choices: clsSel.chosenFeatProgressionChoices?.[`${fpKey}:${slotIdx}`],
          });
        }
      });
    }
    for (const [optGroupKey, optKeys] of Object.entries(clsSel.chosenOptionalFeatures || {})) {
      optKeys.forEach((optKey, slotIdx) => {
        const sub = clsSel.chosenOptionalFeatureSubChoices?.[`${optGroupKey}:${slotIdx}`];
        if (sub?.featKey) {
          const f = findFeat(compendium, sub.featKey);
          if (f) {
            const optName = splitEntityKey(optKey).name || clsSel.className;
            activeFeats.push({
              feat: f,
              sourceLabel: `${optName} (${clsSel.className})`,
              choices: sub.featChoices,
            });
          }
        }
      });
    }
  }

  for (const af of activeFeats) {
    const fixed = getFixedFeatBonuses(af.feat);
    for (const k of ABILITY_KEYS) {
      asiFeatBonus[k] += (fixed[k] || 0) + (af.choices?.abilities?.[k] || 0);
    }
  }

  // Compute Final Ability Scores
  const abilityScores = {} as ComputedCharacter['abilityScores'];
  for (const k of ABILITY_KEYS) {
    const base = character.abilities.base[k] ?? 10;
    const miscBonus = character.abilities.miscBonus[k] || 0;
    const override = character.abilities.override[k];
    const computedSum = base + speciesBonus[k] + backgroundBonus[k] + asiFeatBonus[k] + miscBonus;
    const total = override !== undefined && override > 0 ? override : computedSum;
    abilityScores[k] = {
      total,
      modifier: getAbilityModifier(total),
      base,
      speciesBonus: speciesBonus[k],
      backgroundBonus: backgroundBonus[k],
      asiFeatBonus: asiFeatBonus[k],
      miscBonus,
      override,
    };
  }

  // 2. Proficiencies, Saving Throws, Resistances, Languages
  const saveProfs = new Set<AbilityKey>();
  const skillProfs = new Set<string>();
  const skillExpertise = new Set<string>();
  const armorProfs = new Set<string>();
  const weaponProfs = new Set<string>();
  const toolProfs = new Set<string>();
  const languages = new Set<string>();
  const resistances = new Set<string>();
  const immunities = new Set<string>();
  const sensesMap = new Map<string, number | undefined>();

  // Race grants
  if (race) {
    for (const s of extractFixedSkills(race.skillProficiencies)) skillProfs.add(s);
    for (const s of character.race.chosenSkills) skillProfs.add(s);
    for (const t of extractFixedTools(race.toolProficiencies)) toolProfs.add(t);
    for (const t of character.race.chosenTools) toolProfs.add(t);
    for (const l of extractFixedLanguages(race.languageProficiencies)) languages.add(l);
    for (const l of character.race.chosenLanguages) languages.add(l);
    if (race.darkvision) sensesMap.set('Darkvision', Math.max(sensesMap.get('Darkvision') || 0, race.darkvision));
    if (race.blindsight) sensesMap.set('Blindsight', Math.max(sensesMap.get('Blindsight') || 0, race.blindsight));
    for (const r of race.resist || []) {
      if (typeof r === 'string') resistances.add(r);
    }
    if (character.race.lineageChoice) {
      const dmgMatch = character.race.lineageChoice.match(/\((Acid|Cold|Fire|Lightning|Poison|Necrotic|Radiant|Psychic|Force|Thunder)\)/i);
      if (dmgMatch) {
        resistances.add(dmgMatch[1].toLowerCase());
      }
    }
    for (const im of race.immune || []) {
      if (typeof im === 'string') immunities.add(im);
    }
    for (const wp of race.weaponProficiencies || []) {
      for (const [k, v] of Object.entries(wp)) {
        if (v === true) weaponProfs.add(splitEntityKey(k).name);
      }
    }
    for (const ap of race.armorProficiencies || []) {
      for (const [k, v] of Object.entries(ap)) {
        if (v === true) armorProfs.add(k);
      }
    }
  }

  // Background grants (automatic replacement of overlaps with Class/Species)
  const bgProfState = resolveBackgroundProficiencyState(character, compendium);
  if (background) {
    for (const s of bgProfState.keptFixedSkills) skillProfs.add(s);
    for (const s of character.background.chosenSkills || []) skillProfs.add(s);
    for (const t of bgProfState.keptFixedTools) toolProfs.add(t);
    for (const t of character.background.chosenTools || []) toolProfs.add(t);
    for (const l of extractFixedLanguages(background.languageProficiencies)) languages.add(l);
  }
  for (const l of character.background.chosenLanguages || []) languages.add(l);
  if (!languages.has('Common')) languages.add('Common');

  // Feats grants
  for (const af of activeFeats) {
    for (const s of extractFixedSkills(af.feat.skillProficiencies)) skillProfs.add(s);
    for (const s of af.choices?.skills || []) skillProfs.add(s);
    for (const s of af.choices?.expertiseSkills || []) {
      skillProfs.add(s);
      skillExpertise.add(s);
    }
    for (const t of extractFixedTools(af.feat.toolProficiencies)) toolProfs.add(t);
    for (const t of af.choices?.tools || []) toolProfs.add(t);
    for (const l of extractFixedLanguages(af.feat.languageProficiencies)) languages.add(l);
    for (const l of af.choices?.languages || []) languages.add(l);
    for (const ap of af.feat.armorProficiencies || []) {
      for (const [k, v] of Object.entries(ap)) {
        if (v === true) armorProfs.add(k);
      }
    }
    for (const wp of af.feat.weaponProficiencies || []) {
      for (const [k, v] of Object.entries(wp)) {
        if (k !== 'choose' && v === true) weaponProfs.add(splitEntityKey(k).name);
      }
    }
    for (const sv of af.feat.savingThrowProficiencies || []) {
      for (const [k, v] of Object.entries(sv)) {
        if (v === true && ABILITY_KEYS.includes(k as AbilityKey)) saveProfs.add(k as AbilityKey);
      }
    }
    if (af.feat.name.toLowerCase() === 'resilient' && af.choices?.abilities) {
      for (const k of ABILITY_KEYS) {
        if ((af.choices.abilities[k] || 0) > 0) saveProfs.add(k);
      }
    }
    for (const r of af.feat.resist || []) {
      if (typeof r === 'string') resistances.add(r);
    }
    for (const r of af.choices?.resistances || []) {
      if (r) resistances.add(r.toLowerCase());
    }
  }

  // Classes grants
  const classEntities: { sel: CharacterClassSelection; cls: Class5e; sub?: Subclass5e }[] = [];
  let hasJackOfAllTrades = false;
  let hasDefenseStyle = false;
  let hasArcheryStyle = false;
  let hasDuelingStyle = false;
  let hasUnarmoredBarb = false;
  let hasUnarmoredMonk = false;
  let hasDraconicAc = false;
  let hasWildHeartPanther = false;
  let hasWildHeartSalmon = false;
  let hasThaumaturgeBonus = false;
  let hasMagicianBonus = false;
  const hasToughFeat = activeFeats.some((f) => f.feat.name.toLowerCase() === 'tough');
  const hasAlertFeat = activeFeats.some((f) => f.feat.name.toLowerCase() === 'alert');
  const hasMediumArmorMaster = activeFeats.some((f) => f.feat.name.toLowerCase() === 'medium armor master');
  const hasBoonOfFortitude = activeFeats.some((f) => f.feat.name.toLowerCase() === 'boon of fortitude');
  const hasBoonOfSpeed = activeFeats.some((f) => f.feat.name.toLowerCase() === 'boon of speed');
  const hasBoonOfTruesight = activeFeats.some((f) => f.feat.name.toLowerCase() === 'boon of truesight');
  const hasBlindFighting = activeFeats.some((f) => f.feat.name.toLowerCase() === 'blind fighting');
  if (hasBlindFighting) {
    sensesMap.set('Blindsight', Math.max(sensesMap.get('Blindsight') || 0, 10));
  }
  if (hasBoonOfTruesight) {
    sensesMap.set('Truesight', Math.max(sensesMap.get('Truesight') || 0, 60));
  }
  const hasDwarvenToughness = race?.name.toLowerCase().includes('dwarf') && race.entries?.some((e) => typeof e === 'object' && e.name === 'Dwarven Toughness');

  for (const sel of character.classes) {
    const cls = findClass(compendium, sel.className, sel.classSource);
    if (!cls) continue;
    const sub = findSubclass(compendium, sel.className, sel.classSource, sel.subclassName, sel.subclassSource);
    classEntities.push({ sel, cls, sub });

    if (sel.isPrimary) {
      for (const p of cls.proficiency || []) saveProfs.add(p);
      for (const w of cls.startingProficiencies?.weapons || []) {
        if (typeof w === 'string') weaponProfs.add(w);
      }
      for (const a of cls.startingProficiencies?.armor || []) {
        if (typeof a === 'string') armorProfs.add(a);
      }
      for (const t of extractClassToolConfig(cls, true).fixed) toolProfs.add(t);
    } else if (cls.multiclassing?.proficienciesGained) {
      for (const w of cls.multiclassing.proficienciesGained.weapons || []) weaponProfs.add(w);
      for (const a of cls.multiclassing.proficienciesGained.armor || []) armorProfs.add(a);
      for (const t of extractClassToolConfig(cls, false).fixed) toolProfs.add(t);
    }

    for (const s of sel.chosenSkills) skillProfs.add(s);
    for (const t of sel.chosenTools || []) toolProfs.add(t);
    for (const e of sel.expertiseSkills) {
      skillProfs.add(e);
      skillExpertise.add(e);
    }
    for (const [cfKey, cfSkills] of Object.entries(sel.chosenClassFeatureSkills || {})) {
      for (const s of cfSkills) {
        skillProfs.add(s);
        if (cfKey.toLowerCase().includes('blessings of knowledge')) skillExpertise.add(s);
      }
    }
    for (const cfTools of Object.values(sel.chosenClassFeatureTools || {})) {
      for (const t of cfTools) toolProfs.add(t);
    }
    for (const cfLangs of Object.values(sel.chosenClassFeatureLanguages || {})) {
      for (const l of cfLangs) languages.add(l);
    }
    if (sel.className.toLowerCase() === 'druid' || (sub?.name.toLowerCase().includes('moon') && sel.level >= 3)) {
      languages.add('Druidic');
    }
    if (sel.className.toLowerCase() === 'rogue') {
      languages.add("Thieves' Cant");
    }

    for (const [optKey, cfChoiceRef] of Object.entries(sel.chosenClassFeatureOptions || {})) {
      const cfName = cfChoiceRef.split('|')[0]?.toLowerCase() || '';
      if (cfName === 'protector') {
        armorProfs.add('heavy');
        weaponProfs.add('martial');
      } else if (cfName === 'warden') {
        armorProfs.add('medium');
        weaponProfs.add('martial');
      } else if (cfName === 'thaumaturge') {
        hasThaumaturgeBonus = true;
      } else if (cfName === 'magician') {
        hasMagicianBonus = true;
      } else if (optKey.toLowerCase().startsWith('elemental affinity') && cfChoiceRef) {
        resistances.add(cfChoiceRef.toLowerCase());
      } else if (optKey.toLowerCase().startsWith('aspect of the wilds')) {
        if (cfName === 'owl') {
          const prevDv = sensesMap.get('Darkvision') || 0;
          sensesMap.set('Darkvision', prevDv + 60);
        } else if (cfName === 'panther') {
          hasWildHeartPanther = true;
        } else if (cfName === 'salmon') {
          hasWildHeartSalmon = true;
        }
      } else if (optKey.toLowerCase().startsWith('dread allegiance')) {
        if (cfName === 'bane') resistances.add('psychic');
        else if (cfName === 'bhaal') resistances.add('poison');
        else if (cfName === 'myrkul') resistances.add('necrotic');
      }
    }

    for (const fpKeys of Object.values(sel.chosenFeatProgressions || {})) {
      for (const fKey of fpKeys) {
        const lower = fKey.toLowerCase();
        if (lower.startsWith('defense|') || lower === 'defense') hasDefenseStyle = true;
        if (lower.startsWith('archery|') || lower === 'archery') hasArcheryStyle = true;
        if (lower.startsWith('dueling|') || lower === 'dueling') hasDuelingStyle = true;
      }
    }

    const clName = cls.name.toLowerCase();
    if (clName === 'bard' && sel.level >= 2) hasJackOfAllTrades = true;
    if (clName === 'barbarian') hasUnarmoredBarb = true;
    if (clName === 'monk') {
      hasUnarmoredMonk = true;
      if (sel.level >= 14) {
        for (const k of ABILITY_KEYS) saveProfs.add(k);
      }
    }
    if (clName === 'sorcerer' && sub?.name.toLowerCase().includes('draconic')) {
      hasDraconicAc = true;
    }

    for (const opts of Object.values(sel.chosenOptionalFeatures || {})) {
      for (const optKey of opts) {
        const lower = optKey.toLowerCase();
        if (lower.startsWith('defense|') || lower === 'defense') hasDefenseStyle = true;
        if (lower.startsWith('archery|') || lower === 'archery') hasArcheryStyle = true;
        if (lower.startsWith('dueling|') || lower === 'dueling') hasDuelingStyle = true;
        if (lower.startsWith("devil's sight")) {
          sensesMap.set("Darkvision (Devil's Sight)", 120);
        } else if (lower.startsWith('witch sight')) {
          sensesMap.set('Truesight', Math.max(sensesMap.get('Truesight') || 0, 30));
        }
      }
    }
  }

  // 3. Features Aggregation
  const features: ComputedFeatureEntry[] = [];
  const seenFeatureIds = new Set<string>();
  const pushFeature = (entry: Omit<ComputedFeatureEntry, 'actionType'> & { entries: unknown[] }) => {
    const uniq = `${entry.category}:${entry.name.toLowerCase()}:${entry.sourceLabel.toLowerCase()}`;
    if (seenFeatureIds.has(uniq)) return;
    seenFeatureIds.add(uniq);
    features.push({
      ...entry,
      actionType: classifyFeatureActionType(entry.name, entry.entries, Boolean(entry.limitedUse)),
    });
  };

  for (const { sel, cls, sub } of classEntities) {
    for (const cfRef of cls.classFeatures) {
      const refStr = typeof cfRef === 'string' ? cfRef : cfRef.classFeature;
      const parsed = parseClassFeatureRef(refStr);
      if (parsed.level > sel.level) continue;
      const featObj: ClassFeature5e | undefined = compendium.classFeatures.find(
        (cf) =>
          cf.name.toLowerCase() === parsed.name.toLowerCase() &&
          cf.className.toLowerCase() === parsed.className.toLowerCase() &&
          cf.classSource.toLowerCase() === parsed.classSource.toLowerCase() &&
          cf.level === parsed.level,
      );
      if (featObj) {
        if (isOptionCatalogClassFeature(featObj.name, featObj.entries)) continue;
        pushFeature({
          id: `cf-${cls.name}-${cls.source}-${featObj.level}-${featObj.name}`,
          name: featObj.name,
          sourceLabel: `${cls.name} ${featObj.level}`,
          category: 'class',
          level: featObj.level,
          source: featObj.source,
          page: featObj.page,
          entries: featObj.entries,
          limitedUse: estimateLimitedUses(
            featObj.name,
            sel.level,
            proficiencyBonus,
            abilityScores,
            featObj.entries,
          ),
        });
      }
    }

    if (sub) {
      for (const sfRef of sub.subclassFeatures || []) {
        const parsed = parseSubclassFeatureRef(sfRef);
        if (parsed.level > sel.level) continue;
        const sfObj: SubclassFeature5e | undefined = compendium.subclassFeatures.find(
          (sf) =>
            sf.name.toLowerCase() === parsed.name.toLowerCase() &&
            sf.className.toLowerCase() === parsed.className.toLowerCase() &&
            sf.subclassShortName.toLowerCase() === parsed.subclassShortName.toLowerCase() &&
            sf.level === parsed.level,
        );
        if (sfObj) {
          if (isOptionCatalogClassFeature(sfObj.name, sfObj.entries)) continue;
          pushFeature({
            id: `sf-${sub.shortName}-${sfObj.level}-${sfObj.name}`,
            name: sfObj.name,
            sourceLabel: `${sub.shortName} ${sfObj.level}`,
            category: 'subclass',
            level: sfObj.level,
            source: sfObj.source,
            page: sfObj.page,
            entries: sfObj.entries,
            limitedUse: estimateLimitedUses(
              sfObj.name,
              sel.level,
              proficiencyBonus,
              abilityScores,
              sfObj.entries,
            ),
          });
        }
      }
    }

    for (const [fType, keys] of Object.entries(sel.chosenOptionalFeatures || {})) {
      for (const optKey of keys) {
        const opt = findOptionalFeature(compendium, optKey);
        if (opt) {
          pushFeature({
            id: `opt-${cls.name}-${fType}-${opt.name}-${opt.source}`,
            name: opt.name,
            sourceLabel: `${cls.name} Option`,
            category: 'optional',
            source: opt.source,
            page: opt.page,
            entries: opt.entries,
            parentFeatureName: inferOptionalParentFeature(opt.featureType, fType),
            limitedUse: estimateLimitedUses(
              opt.name,
              sel.level,
              proficiencyBonus,
              abilityScores,
              opt.entries,
            ),
          });
        }
      }
    }
  }

  if (race?.entries) {
    for (const entry of race.entries) {
      if (typeof entry === 'object' && entry !== null && entry.name) {
        const raceEntries = (entry.entries || (entry.entry ? [entry.entry] : [])) as EntryNode[];
        pushFeature({
          id: `race-${race.name}-${entry.name}`,
          name: entry.name,
          sourceLabel: race.name,
          category: 'species',
          source: race.source,
          page: race.page,
          entries: raceEntries,
          limitedUse: estimateLimitedUses(
            entry.name,
            totalLevel,
            proficiencyBonus,
            abilityScores,
            raceEntries,
          ),
        });
      }
    }
  }

  if (background?.entries) {
    for (const entry of background.entries) {
      if (typeof entry === 'object' && entry !== null && entry.name && entry.name !== 'Suggested Characteristics') {
        const bgEntries = (entry.entries || []) as EntryNode[];
        pushFeature({
          id: `bg-${background.name}-${entry.name}`,
          name: entry.name,
          sourceLabel: background.name,
          category: 'background',
          source: background.source,
          page: background.page,
          entries: bgEntries,
          limitedUse: estimateLimitedUses(
            entry.name,
            totalLevel,
            proficiencyBonus,
            abilityScores,
            bgEntries,
          ),
        });
      }
    }
  }

  for (const af of activeFeats) {
    pushFeature({
      id: `feat-${af.feat.name}-${af.feat.source}`,
      name: af.feat.name,
      sourceLabel: af.sourceLabel,
      category: 'feat',
      source: af.feat.source,
      page: af.feat.page,
      entries: af.feat.entries,
      limitedUse: estimateLimitedUses(
        af.feat.name,
        totalLevel,
        proficiencyBonus,
        abilityScores,
        af.feat.entries,
      ),
    });
  }

  // 4. Hit Points & Hit Dice
  let maxHp = 0;
  const hitDiceByFaces = new Map<number, number>();
  for (const { sel, cls } of classEntities) {
    const faces = cls.hd?.faces || 8;
    hitDiceByFaces.set(faces, (hitDiceByFaces.get(faces) || 0) + sel.level);
    const fixedPerLvl = Math.floor(faces / 2) + 1;

    for (let lvl = 1; lvl <= sel.level; lvl++) {
      let baseDie = 0;
      if (sel.isPrimary && lvl === 1) {
        baseDie = faces;
      } else if (character.preferences.hpMode === 'manual' && sel.hpRolls[lvl] !== undefined) {
        baseDie = sel.hpRolls[lvl];
      } else {
        baseDie = fixedPerLvl;
      }
      maxHp += Math.max(1, baseDie + abilityScores.con.modifier);
    }
  }

  if (classEntities.length === 0) {
    maxHp = Math.max(1, 8 + abilityScores.con.modifier);
  }
  if (hasToughFeat) maxHp += totalLevel * 2;
  if (hasBoonOfFortitude) maxHp += 40;
  if (hasDwarvenToughness) maxHp += totalLevel;
  if (classEntities.some((c) => c.cls.name.toLowerCase() === 'sorcerer' && c.sub?.name.toLowerCase().includes('draconic'))) {
    maxHp += totalLevel;
  }

  const effectiveCurrentHp =
    character.playState.currentHp === null ? maxHp : Math.min(maxHp, Math.max(0, character.playState.currentHp));

  const hitDicePools = [...hitDiceByFaces.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([faces, total]) => ({
      faces,
      total,
      used: Math.min(total, character.playState.hitDiceUsed[faces] || 0),
    }));

  // 5. Saving Throws & Skills
  const magicSaveBonus = character.inventory.reduce((acc, inv) => {
    if (!inv.equipped) return acc;
    const item = findItem(compendium, inv.itemKey);
    if (item?.reqAttune && !inv.attuned) return acc;
    return acc + parseBonusNum(item?.bonusSavingThrow);
  }, 0);

  const paladinClass = classEntities.find((c) => c.cls.name.toLowerCase() === 'paladin' && c.sel.level >= 6);
  const auraOfProtection = paladinClass ? Math.max(1, abilityScores.cha.modifier) : 0;

  const savingThrows = {} as ComputedCharacter['savingThrows'];
  for (const k of ABILITY_KEYS) {
    const proficient = saveProfs.has(k);
    const bonus = abilityScores[k].modifier + (proficient ? proficiencyBonus : 0) + magicSaveBonus + auraOfProtection;
    const notes: string[] = [];
    if (auraOfProtection > 0) notes.push(`+${auraOfProtection} Aura`);
    if (race?.name.toLowerCase().includes('elf') && (k === 'wis' || k === 'cha')) notes.push('Adv vs Charmed');
    if (race?.name.toLowerCase().includes('dwarf') && k === 'con') notes.push('Adv vs Poison');
    savingThrows[k] = { proficient, bonus, notes };
  }

  const wisOrderBonus = Math.max(1, abilityScores.wis.modifier);
  const skills = STANDARD_SKILLS.map((sk) => {
    let profLevel: 0 | 0.5 | 1 | 2 = 0;
    if (skillExpertise.has(sk.name)) profLevel = 2;
    else if (skillProfs.has(sk.name)) profLevel = 1;
    else if (hasJackOfAllTrades) profLevel = 0.5;

    const profMult = profLevel === 2 ? 2 : profLevel === 1 ? 1 : profLevel === 0.5 ? 0.5 : 0;
    let extraSkillBonus = 0;
    if (hasThaumaturgeBonus && (sk.name === 'Arcana' || sk.name === 'Religion')) {
      extraSkillBonus += wisOrderBonus;
    }
    if (hasMagicianBonus && (sk.name === 'Arcana' || sk.name === 'Nature')) {
      extraSkillBonus += wisOrderBonus;
    }
    const bonus = abilityScores[sk.ability].modifier + Math.floor(proficiencyBonus * profMult) + extraSkillBonus;
    return {
      name: sk.name,
      ability: sk.ability,
      proficiency: profLevel,
      bonus,
      passive: 10 + bonus,
    };
  });

  const passivePerception = skills.find((s) => s.name === 'Perception')?.passive ?? 10;
  const passiveInvestigation = skills.find((s) => s.name === 'Investigation')?.passive ?? 10;
  const passiveInsight = skills.find((s) => s.name === 'Insight')?.passive ?? 10;

  // 6. Armor Class (AC) & Speed & Initiative
  let equippedArmor: Item5e | undefined;
  let equippedShield: Item5e | undefined;
  let itemAcBonus = 0;
  let itemWeaponBonus = 0;
  let itemSpellAttackBonus = 0;
  let itemSpellDcBonus = 0;
  let attunementUsed = 0;

  for (const inv of character.inventory) {
    if (inv.attuned) attunementUsed++;
    if (!inv.equipped) continue;
    const item = inv.isCustom ? (inv.customItemData as Item5e) : findItem(compendium, inv.itemKey);
    if (!item) continue;

    const needsAttune = Boolean(item.reqAttune);
    const activeMagic = !needsAttune || inv.attuned;
    const typeCode = item.type?.split('|')[0];

    if (item.shield || typeCode === 'S') {
      equippedShield = item;
    } else if (item.armor || typeCode === 'LA' || typeCode === 'MA' || typeCode === 'HA') {
      equippedArmor = item;
    } else if (activeMagic) {
      itemAcBonus += parseBonusNum(item.bonusAc);
    }

    if (activeMagic) {
      if (item.bonusWeapon) itemWeaponBonus = Math.max(itemWeaponBonus, parseBonusNum(item.bonusWeapon));
      itemSpellAttackBonus += parseBonusNum(item.bonusSpellAttack);
      itemSpellDcBonus += parseBonusNum(item.bonusSpellSaveDc);
    }
  }

  let baseAc = 10 + abilityScores.dex.modifier;
  let acDesc = `10 + ${abilityScores.dex.modifier} (DEX)`;
  if (equippedArmor && equippedArmor.ac) {
    const typeCode = equippedArmor.type?.split('|')[0];
    const magicArmorBonus = parseBonusNum(equippedArmor.bonusAc);
    if (typeCode === 'LA') {
      baseAc = equippedArmor.ac + abilityScores.dex.modifier + magicArmorBonus;
      acDesc = `${equippedArmor.ac} (${equippedArmor.name}) + ${abilityScores.dex.modifier} (DEX)${magicArmorBonus ? ` + ${magicArmorBonus}` : ''}`;
    } else if (typeCode === 'MA') {
      const cap = hasMediumArmorMaster ? 3 : 2;
      const dexPart = Math.min(abilityScores.dex.modifier, cap);
      baseAc = equippedArmor.ac + dexPart + magicArmorBonus;
      acDesc = `${equippedArmor.ac} (${equippedArmor.name}) + ${dexPart} (DEX cap ${cap})${magicArmorBonus ? ` + ${magicArmorBonus}` : ''}`;
    } else {
      baseAc = equippedArmor.ac + magicArmorBonus;
      acDesc = `${equippedArmor.ac} (${equippedArmor.name})${magicArmorBonus ? ` + ${magicArmorBonus}` : ''}`;
    }
    if (hasDefenseStyle) {
      baseAc += 1;
      acDesc += ' + 1 (Defense)';
    }
  } else {
    const candidates: { val: number; label: string }[] = [{ val: baseAc, label: acDesc }];
    if (character.playState.mageArmorActive) {
      const v = 13 + abilityScores.dex.modifier;
      candidates.push({ val: v, label: `13 (Mage Armor) + ${abilityScores.dex.modifier} (DEX)` });
    }
    if (hasUnarmoredBarb) {
      const v = 10 + abilityScores.dex.modifier + abilityScores.con.modifier;
      candidates.push({ val: v, label: `10 + ${abilityScores.dex.modifier} (DEX) + ${abilityScores.con.modifier} (CON)` });
    }
    if (hasUnarmoredMonk && !equippedShield) {
      const v = 10 + abilityScores.dex.modifier + abilityScores.wis.modifier;
      candidates.push({ val: v, label: `10 + ${abilityScores.dex.modifier} (DEX) + ${abilityScores.wis.modifier} (WIS)` });
    }
    if (hasDraconicAc) {
      const draconicVal =
        classEntities.some((c) => c.cls.edition === 'one')
          ? 10 + abilityScores.dex.modifier + abilityScores.cha.modifier
          : 13 + abilityScores.dex.modifier;
      candidates.push({ val: draconicVal, label: `Draconic Resilience (${draconicVal})` });
    }
    const best = candidates.sort((a, b) => b.val - a.val)[0];
    baseAc = best.val;
    acDesc = best.label;
  }

  let shieldAc = 0;
  if (equippedShield) {
    shieldAc = (equippedShield.ac || 2) + parseBonusNum(equippedShield.bonusAc);
    acDesc += ` + ${shieldAc} (${equippedShield.name})`;
  }
  if (itemAcBonus) {
    acDesc += ` + ${itemAcBonus} (Gear)`;
  }
  if (character.playState.customAcBonus) {
    acDesc += ` ${formatSigned(character.playState.customAcBonus)} (Misc)`;
  }
  const totalAc = baseAc + shieldAc + itemAcBonus + (character.playState.customAcBonus || 0);

  // Speed
  let baseWalk = 30;
  let flySpeed: number | undefined;
  let swimSpeed: number | undefined;
  let climbSpeed: number | undefined;
  if (race?.speed) {
    if (typeof race.speed === 'number') {
      baseWalk = race.speed;
    } else {
      baseWalk = race.speed.walk ?? 30;
      if (typeof race.speed.fly === 'number') flySpeed = race.speed.fly;
      else if (race.speed.fly === true) flySpeed = baseWalk;
      if (typeof race.speed.swim === 'number') swimSpeed = race.speed.swim;
      else if (race.speed.swim === true) swimSpeed = baseWalk;
      if (typeof race.speed.climb === 'number') climbSpeed = race.speed.climb;
      else if (race.speed.climb === true) climbSpeed = baseWalk;
    }
  }
  const monkSel = classEntities.find((c) => c.cls.name.toLowerCase() === 'monk');
  if (monkSel && monkSel.sel.level >= 2 && !equippedArmor && !equippedShield) {
    const monkSpeedBonus = monkSel.sel.level >= 18 ? 30 : monkSel.sel.level >= 14 ? 25 : monkSel.sel.level >= 10 ? 20 : monkSel.sel.level >= 6 ? 15 : 10;
    baseWalk += monkSpeedBonus;
  }
  const barbSel = classEntities.find((c) => c.cls.name.toLowerCase() === 'barbarian');
  if (barbSel && barbSel.sel.level >= 5 && equippedArmor?.type?.split('|')[0] !== 'HA') {
    baseWalk += 10;
  }
  if (hasBoonOfSpeed) baseWalk += 30;
  if (hasWildHeartPanther) climbSpeed = Math.max(climbSpeed || 0, baseWalk);
  if (hasWildHeartSalmon) swimSpeed = Math.max(swimSpeed || 0, baseWalk);
  baseWalk += character.playState.customSpeedBonus || 0;

  // Initiative
  let initiative = abilityScores.dex.modifier + (character.playState.customInitBonus || 0);
  if (hasAlertFeat) {
    initiative += character.preferences.ruleset === '2024' ? proficiencyBonus : 5;
  }
  if (hasJackOfAllTrades) {
    initiative += Math.floor(proficiencyBonus / 2);
  }
  const swashbuckler = classEntities.find((c) => c.sub?.name.toLowerCase().includes('swashbuckler') && c.sel.level >= 3);
  if (swashbuckler) initiative += abilityScores.cha.modifier;

  // 7. Spellcasting & Spell Slots
  let casterLevelsSum = 0;
  let singleCasterProgression: string | null = null;
  let casterCount = 0;
  let pactSlots: { count: number; level: number } | null = null;
  const spellGroups: ComputedSpellGroup[] = [];

  for (const { sel, cls, sub } of classEntities) {
    const progression = sub?.casterProgression || cls.casterProgression;
    const ability = (sub?.spellcastingAbility || cls.spellcastingAbility) as AbilityKey | undefined;
    if (!progression || !ability) continue;

    if (progression === 'pact') {
      pactSlots = PACT_SLOTS_TABLE[Math.min(20, sel.level)] || null;
    } else {
      casterCount++;
      singleCasterProgression = progression;
      const isOne = (sub?.edition || cls.edition) === 'one';
      if (progression === 'full') casterLevelsSum += sel.level;
      else if (progression === '1/2' || progression === 'artificer') {
        casterLevelsSum += isOne ? Math.ceil(sel.level / 2) : Math.floor(sel.level / 2);
      } else if (progression === '1/3') {
        casterLevelsSum += isOne ? Math.ceil(sel.level / 3) : Math.floor(sel.level / 3);
      }
    }

    const spellMod = abilityScores[ability].modifier;
    const spellAttackBonus = proficiencyBonus + spellMod + itemSpellAttackBonus;
    const spellSaveDc = 8 + proficiencyBonus + spellMod + itemSpellDcBonus;

    // Max spell level
    let maxSpellLevel = 0;
    if (progression === 'pact') {
      maxSpellLevel = PACT_SLOTS_TABLE[sel.level]?.level || 1;
    } else if (progression === 'full') {
      maxSpellLevel = Math.min(9, Math.ceil(sel.level / 2));
    } else if (progression === '1/2' || progression === 'artificer') {
      maxSpellLevel = sel.level >= 17 ? 5 : sel.level >= 13 ? 4 : sel.level >= 9 ? 3 : sel.level >= 5 ? 2 : sel.level >= 2 || cls.edition === 'one' ? 1 : 0;
    } else if (progression === '1/3') {
      maxSpellLevel = sel.level >= 19 ? 4 : sel.level >= 13 ? 3 : sel.level >= 7 ? 2 : sel.level >= 3 ? 1 : 0;
    }

    const cantripBonusFromOrder = Object.values(sel.chosenClassFeatureOptions || {}).some((v) => {
      const low = v.split('|')[0]?.toLowerCase();
      return low === 'thaumaturge' || low === 'magician';
    })
      ? 1
      : 0;
    const cantripLimit =
      ((sub?.cantripProgression || cls.cantripProgression)?.[sel.level - 1] ?? 0) + cantripBonusFromOrder;
    const knownLimit =
      (sub?.spellsKnownProgression || cls.spellsKnownProgression)?.[sel.level - 1] ?? 0;

    const preparedLimit = getClassPreparedSpellLimit(cls, sub, sel.level, spellMod);
    const magicalSecretsClasses =
      cls.name.toLowerCase() === 'bard' && cls.edition === 'one' && sel.level >= 10
        ? ['Cleric', 'Druid', 'Wizard']
        : [];

    const availableSpells = getAvailableSpellsForClass(
      compendium,
      cls.name,
      cls.source,
      sub?.name,
      sub?.source,
      maxSpellLevel,
      character.preferences.enabledSources,
      character.preferences.ruleset,
      magicalSecretsClasses,
    );

    const subAdd = collectAdditionalSpells(sub?.additionalSpells, sel.level, ability);
    const featurePrepared: string[] = [...subAdd.prepared];
    const featureInnate = [...subAdd.innate];

    for (const [cfSpellKey, spKeys] of Object.entries(sel.chosenClassFeatureSpells || {})) {
      const lowKey = cfSpellKey.toLowerCase();
      for (const spKey of spKeys) {
        if (!spKey) continue;
        if (lowKey.startsWith('mystic arcanum')) {
          featureInnate.push({ spellKey: spKey, uses: '1/Long Rest', minLevel: 11, ability });
        } else if (lowKey.startsWith('spell mastery')) {
          featureInnate.push({ spellKey: spKey, uses: 'At Will', minLevel: 18, ability });
        } else if (lowKey.startsWith('signature spells')) {
          featureInnate.push({ spellKey: spKey, uses: '1/Short or Long Rest', minLevel: 20, ability });
        } else {
          featurePrepared.push(spKey);
        }
      }
    }

    // Optional feature chosen spells (e.g. Pact of the Tome cantrips & L1 ritual spells)
    for (const [optGroupKey, optKeys] of Object.entries(sel.chosenOptionalFeatures || {})) {
      optKeys.forEach((optKey, slotIdx) => {
        const subChoice = sel.chosenOptionalFeatureSubChoices?.[`${optGroupKey}:${slotIdx}`];
        for (const spKey of subChoice?.spellKeys || []) {
          if (!spKey) continue;
          const spObj = findSpell(compendium, spKey);
          if (spObj?.level === 0) {
            featureInnate.push({ spellKey: spKey, uses: `${splitEntityKey(optKey).name}`, minLevel: 1, ability });
          } else {
            featurePrepared.push(spKey);
          }
        }
      });
    }

    // Fighting Style feat spells (e.g. Blessed Warrior Cleric cantrips, Druidic Warrior Druid cantrips)
    for (const [fpKey, fpKeys] of Object.entries(sel.chosenFeatProgressions || {})) {
      fpKeys.forEach((fKey, slotIdx) => {
        const ch = sel.chosenFeatProgressionChoices?.[`${fpKey}:${slotIdx}`];
        const fName = splitEntityKey(fKey).name;
        for (const spKey of ch?.spells || []) {
          if (!spKey) continue;
          featureInnate.push({ spellKey: spKey, uses: fName || 'Feature', minLevel: 1, ability });
        }
      });
    }

    // Circle of the Land terrain table spells
    const chosenLand = sel.chosenClassFeatureOptions?.['Circle of the Land Spells-3'];
    if (chosenLand && sub && sel.level >= 3) {
      const landSf = compendium.subclassFeatures.find(
        (sf) =>
          sf.name.toLowerCase() === 'circle of the land spells' &&
          sf.className.toLowerCase() === cls.name.toLowerCase() &&
          sf.subclassShortName.toLowerCase() === sub.shortName.toLowerCase(),
      );
      if (landSf?.entries) {
        const tableNode = landSf.entries.find(
          (e) =>
            typeof e === 'object' &&
            e !== null &&
            e.type === 'table' &&
            String(e.caption || '').toLowerCase() === chosenLand.toLowerCase(),
        );
        if (tableNode && typeof tableNode === 'object' && Array.isArray(tableNode.rows)) {
          for (const row of tableNode.rows) {
            const reqLvl = parseInt(String(row[0] || '99'), 10);
            if (!Number.isNaN(reqLvl) && reqLvl <= sel.level && typeof row[1] === 'string') {
              for (const m of row[1].matchAll(/\{@spell\s+([^}]+)\}/gi)) {
                const rawSpell = m[1].split('|').slice(0, 2).join('|');
                if (rawSpell) featurePrepared.push(rawSpell);
              }
            }
          }
        }
      }
    }

    spellGroups.push({
      classId: sel.id,
      className: cls.name,
      classSource: cls.source,
      subclassName: sub?.name,
      ability,
      spellAttackBonus,
      spellSaveDc,
      casterProgression: progression,
      maxSpellLevel,
      cantripLimit,
      preparedLimit,
      knownLimit,
      availableSpellKeys: availableSpells.map((s) => makeEntityKey(s.name, s.source)),
      alwaysPreparedKeys: featurePrepared,
      innateSpells: featureInnate,
    });
  }

  // Species & Feat Innate/Additional Spells
  const extraInnate: { spellKey: string; uses: string; minLevel: number; ability: AbilityKey }[] = [];
  if (race?.additionalSpells) {
    const raceSpells = collectAdditionalSpells(
      race.additionalSpells,
      totalLevel,
      character.race.innateSpellAbility || 'cha',
      character.race.lineageChoice,
    );
    extraInnate.push(...raceSpells.innate);
  }
  if (character.race.chosenInnateCantrip) {
    extraInnate.push({
      spellKey: character.race.chosenInnateCantrip,
      uses: 'At Will',
      minLevel: 1,
      ability: character.race.innateSpellAbility || 'cha',
    });
  }
  for (const af of activeFeats) {
    const fLow = af.feat.name.toLowerCase();
    const handledOnClass = fLow === 'blessed warrior' || fLow === 'druidic warrior';
    if (af.feat.additionalSpells) {
      const fSp = collectAdditionalSpells(
        af.feat.additionalSpells,
        totalLevel,
        af.choices?.spellAbility || 'int',
      );
      extraInnate.push(...fSp.innate);
    }
    if (!handledOnClass) {
      for (const spKey of af.choices?.spells || []) {
        extraInnate.push({
          spellKey: spKey,
          uses: 'Feat',
          minLevel: 1,
          ability: af.choices?.spellAbility || 'int',
        });
      }
    }
  }
  if (extraInnate.length > 0) {
    const ab = extraInnate[0].ability;
    spellGroups.push({
      classId: 'innate-origin',
      className: 'Species & Feats',
      classSource: '',
      ability: ab,
      spellAttackBonus: proficiencyBonus + abilityScores[ab].modifier + itemSpellAttackBonus,
      spellSaveDc: 8 + proficiencyBonus + abilityScores[ab].modifier + itemSpellDcBonus,
      casterProgression: 'innate',
      maxSpellLevel: 9,
      cantripLimit: 0,
      preparedLimit: 0,
      knownLimit: 0,
      availableSpellKeys: [],
      alwaysPreparedKeys: [],
      innateSpells: extraInnate,
    });
  }

  const spellSlots: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  if (casterCount > 0) {
    // If single class half/third caster at level 1/2/etc., MULTICLASS_SPELL_SLOTS with casterLevelsSum works cleanly!
    const effectiveLvl =
      casterCount === 1 && singleCasterProgression === '1/2' && classEntities[0]?.cls.edition === 'classic' && classEntities[0].sel.level < 2
        ? 0
        : Math.min(20, casterLevelsSum);
    const row = MULTICLASS_SPELL_SLOTS[effectiveLvl] || MULTICLASS_SPELL_SLOTS[0];
    for (let i = 0; i < 9; i++) {
      spellSlots[i + 1] = row[i];
    }
  }

  // 8. Attacks (Equipped Weapons + Unarmed Strike + Damage Cantrips)
  const attacks: ComputedAttackAction[] = [];
  for (const inv of character.inventory) {
    if (!inv.equipped) continue;
    const item = inv.isCustom ? (inv.customItemData as Item5e) : findItem(compendium, inv.itemKey);
    if (!item || (!item.weapon && !item.dmg1)) continue;

    const props = (item.property || []).map((p) =>
      splitEntityKey(typeof p === 'string' ? p : (p as { uid?: string })?.uid || '').name,
    );
    const isFinesse = props.includes('F');
    const isRanged = item.type?.split('|')[0] === 'R';
    const isThrown = props.includes('T');

    let mod = abilityScores.str.modifier;
    if (isRanged) mod = abilityScores.dex.modifier;
    else if (isFinesse) mod = Math.max(abilityScores.str.modifier, abilityScores.dex.modifier);

    const isProf =
      weaponProfs.has('simple') && item.weaponCategory === 'simple'
        ? true
        : weaponProfs.has('martial') && item.weaponCategory === 'martial'
          ? true
          : weaponProfs.has(item.name);

    const magicBonus = parseBonusNum(item.bonusWeapon) || parseBonusNum(item.bonusWeaponAttack);
    const magicDmgBonus = parseBonusNum(item.bonusWeapon) || parseBonusNum(item.bonusWeaponDamage);
    const archeryBonus = isRanged && hasArcheryStyle ? 2 : 0;
    const duelingBonus = !isRanged && !props.includes('2H') && hasDuelingStyle ? 2 : 0;

    attacks.push({
      id: `atk-${inv.instanceId}`,
      name: inv.name,
      category: 'weapon',
      attackType: isRanged ? 'Ranged Weapon' : 'Melee Weapon',
      range: item.range ? `${item.range} ft.` : props.includes('R') ? '10 ft.' : isThrown ? '20/60 ft.' : '5 ft.',
      toHit: mod + (isProf ? proficiencyBonus : 0) + magicBonus + archeryBonus,
      damageDice: item.dmg1 || '1d4',
      damageBonus: mod + magicDmgBonus + duelingBonus,
      damageType: DAMAGE_TYPE_LABELS[item.dmgType || 'B'] || item.dmgType || 'Bludgeoning',
      versatileDamageDice: item.dmg2,
      properties: props.map((p) => ITEM_PROPERTY_LABELS[p] || p),
      mastery: item.mastery?.map((m) => splitEntityKey(m).name),
      sourceItemId: inv.instanceId,
    });
  }

  // Unarmed Strike
  const monkMod = hasUnarmoredMonk
    ? Math.max(abilityScores.str.modifier, abilityScores.dex.modifier)
    : abilityScores.str.modifier;
  const monkLevel = monkSel?.sel.level || 0;
  const monkDie = monkLevel >= 17 ? '1d12' : monkLevel >= 11 ? '1d10' : monkLevel >= 5 ? '1d8' : monkLevel >= 1 ? '1d6' : '';
  attacks.push({
    id: 'atk-unarmed',
    name: 'Unarmed Strike',
    category: 'unarmed',
    attackType: 'Unarmed',
    range: '5 ft.',
    toHit: monkMod + proficiencyBonus,
    damageDice: monkDie || '1',
    damageBonus: monkDie ? monkMod : monkMod,
    damageType: 'Bludgeoning',
    properties: monkLevel >= 1 ? ['Martial Arts'] : [],
  });

  // Cantrips / Attack Spells
  for (const grp of spellGroups) {
    const clsSel = character.classes.find((c) => c.id === grp.classId);
    const agonizingSpells = new Set<string>();
    const repellingSpells = new Set<string>();
    const spearSpells = new Map<string, number>();

    if (clsSel) {
      for (const [optGroupKey, optKeys] of Object.entries(clsSel.chosenOptionalFeatures || {})) {
        optKeys.forEach((optKey, slotIdx) => {
          const lowOpt = optKey.toLowerCase();
          const subChoice = clsSel.chosenOptionalFeatureSubChoices?.[`${optGroupKey}:${slotIdx}`];
          const chosenCantripName = subChoice?.cantripKey
            ? splitEntityKey(subChoice.cantripKey).name.toLowerCase()
            : '';

          if (lowOpt.startsWith('agonizing blast')) {
            agonizingSpells.add(chosenCantripName || 'eldritch blast');
          } else if (lowOpt.startsWith('repelling blast')) {
            repellingSpells.add(chosenCantripName || 'eldritch blast');
          } else if (lowOpt.startsWith('eldritch spear')) {
            spearSpells.set(chosenCantripName || 'eldritch blast', clsSel.level);
          }
        });
      }
    }

    const spellKeys = new Set([
      ...(clsSel?.cantrips || []),
      ...(clsSel?.preparedSpells || []),
      ...(clsSel?.knownSpells || []),
      ...grp.alwaysPreparedKeys,
      ...grp.innateSpells.map((i) => i.spellKey),
    ]);
    for (const sk of spellKeys) {
      const sp = findSpell(compendium, sk);
      if (!sp || sp.level > 0) continue;
      if (!sp.damageInflict?.length && !sp.spellAttack?.length) continue;

      let scaledDmg = '';
      const scaleBlock = Array.isArray(sp.scalingLevelDice) ? sp.scalingLevelDice[0] : sp.scalingLevelDice;
      if (scaleBlock?.scaling) {
        const thresholds = Object.keys(scaleBlock.scaling)
          .map((n) => parseInt(n, 10))
          .filter((n) => !Number.isNaN(n) && n <= totalLevel)
          .sort((a, b) => b - a);
        if (thresholds.length > 0) {
          scaledDmg = scaleBlock.scaling[String(thresholds[0])];
        }
      }
      if (!scaledDmg) {
        const txt = JSON.stringify(sp.entries);
        const m = txt.match(/\{@damage ([^}|]+)/);
        if (m) scaledDmg = m[1];
      }

      const spLower = sp.name.toLowerCase();
      const agonizing = agonizingSpells.has(spLower);
      const repelling = repellingSpells.has(spLower);
      const spearWarlockLvl = spearSpells.get(spLower);
      const isSave = Boolean(sp.savingThrow?.length && !sp.spellAttack?.length);

      let rangeStr = sp.range?.distance?.amount ? `${sp.range.distance.amount} ft.` : sp.range?.type || 'Self';
      if (spearWarlockLvl && sp.range?.distance?.type === 'feet' && sp.range.distance.amount) {
        const hasXphbSpear = clsSel && Object.values(clsSel.chosenOptionalFeatures || {}).flat().some((k) => k.toLowerCase() === 'eldritch spear|xphb');
        const boosted = hasXphbSpear ? sp.range.distance.amount + 30 * spearWarlockLvl : Math.max(300, sp.range.distance.amount);
        rangeStr = `${boosted} ft.`;
      }

      const props = [sp.level === 0 ? 'Cantrip' : `Level ${sp.level}`];
      if (repelling) props.push('Push 10 ft.');

      attacks.push({
        id: `atk-sp-${grp.classId}-${sp.name}`,
        name: sp.name,
        category: 'spell',
        attackType: sp.range?.type === 'point' && (sp.range.distance?.amount || 0) <= 5 ? 'Melee Spell' : 'Ranged Spell',
        range: rangeStr,
        toHit: isSave ? null : grp.spellAttackBonus,
        saveDc: isSave ? grp.spellSaveDc : undefined,
        saveAbility: isSave ? sp.savingThrow?.[0]?.slice(0, 3).toUpperCase() : undefined,
        damageDice: scaledDmg || '—',
        damageBonus: agonizing ? abilityScores.cha.modifier : 0,
        damageType: sp.damageInflict?.[0] ? sp.damageInflict[0].charAt(0).toUpperCase() + sp.damageInflict[0].slice(1) : 'Force',
        properties: props,
        sourceSpellKey: makeEntityKey(sp.name, sp.source),
      });
    }
  }

  // 9. Carrying Capacity
  let totalWeight = 0;
  for (const inv of character.inventory) {
    const item = inv.isCustom ? undefined : findItem(compendium, inv.itemKey);
    const unitWeight = inv.customWeight ?? item?.weight ?? 0;
    totalWeight += unitWeight * (inv.quantity || 1);
  }
  if (!character.preferences.ignoreCoinWeight) {
    const coins =
      (character.currency.cp || 0) +
      (character.currency.sp || 0) +
      (character.currency.ep || 0) +
      (character.currency.gp || 0) +
      (character.currency.pp || 0);
    totalWeight += coins / 50;
  }
  const strScore = abilityScores.str.total;
  const capacity = strScore * 15;
  const encumberedAt = strScore * 5;
  const heavilyEncumberedAt = strScore * 10;
  let carryStatus: ComputedCharacter['carrying']['status'] = 'normal';
  if (totalWeight > capacity) carryStatus = 'over-capacity';
  else if (character.preferences.encumbrance === 'variant') {
    if (totalWeight > heavilyEncumberedAt) carryStatus = 'heavily-encumbered';
    else if (totalWeight > encumberedAt) carryStatus = 'encumbered';
  }

  // 10. Validation warnings
  const validationWarnings: string[] = [];
  if (character.classes.length === 0) {
    validationWarnings.push('Select at least one Class in the Class step.');
  }
  if (!race) {
    validationWarnings.push('Select a Species / Race.');
  }
  if (!background) {
    validationWarnings.push('Select a Background.');
  }
  for (const { sel, cls, sub } of classEntities) {
    const subLvl = getSubclassUnlockLevel(cls);
    if (sel.level >= subLvl && !sub) {
      validationWarnings.push(`${cls.name} unlocks a ${cls.subclassTitle || 'Subclass'} at level ${subLvl}.`);
    }
    const reqSkills = cls.startingProficiencies?.skills?.[0]?.choose?.count || 0;
    if (sel.isPrimary && sel.chosenSkills.length < reqSkills) {
      validationWarnings.push(`${cls.name}: Choose ${reqSkills - sel.chosenSkills.length} more class skill(s).`);
    }
  }

  return {
    totalLevel,
    proficiencyBonus,
    abilityScores,
    savingThrows,
    skills,
    passivePerception,
    passiveInvestigation,
    passiveInsight,
    maxHp,
    effectiveCurrentHp,
    hitDicePools,
    ac: {
      value: totalAc,
      breakdown: acDesc,
      equippedArmorName: equippedArmor?.name,
      hasShield: Boolean(equippedShield),
    },
    initiative,
    speeds: {
      walk: baseWalk,
      fly: flySpeed,
      swim: swimSpeed,
      climb: climbSpeed,
    },
    senses: [...sensesMap.entries()].map(([name, range]) => ({ name, range })),
    resistances: [...resistances],
    immunities: [...immunities],
    armorProficiencies: [...armorProfs],
    weaponProficiencies: [...weaponProfs],
    toolProficiencies: [...toolProfs],
    languages: [...languages],
    spellSlots,
    pactSlots,
    spellGroups,
    attacks,
    features,
    carrying: {
      totalWeight: Math.round(totalWeight * 10) / 10,
      capacity,
      encumberedAt,
      heavilyEncumberedAt,
      status: carryStatus,
    },
    attunement: {
      used: attunementUsed,
      max: 3,
    },
    validationWarnings,
  };
}
