import type { CompiledCompendium, Item5e, StartingEquipmentBlock } from '../types/5etools';
import type { CharacterCurrency, CharacterInventoryItem, ComputedCharacter, RulesetMode } from '../types/character';
import { classifySourceCategory, findItem, isSourceAllowed, makeEntityKey, splitEntityKey } from '../engine/rules';

export type EquipmentTokenObj = {
  item?: string;
  quantity?: number;
  value?: number;
  containsValue?: number;
  displayName?: string;
  equipmentType?: string;
  special?: string;
  worthValue?: number;
};

export type EquipmentToken = string | EquipmentTokenObj;

export interface StartingEquipmentOption {
  key: string; // e.g. 'A', 'B', 'C', 'a', 'b', '_'
  tokens: EquipmentToken[];
  label: string;
}

export interface StartingEquipmentChoiceGroup {
  groupId: string; // e.g. 'class:0', 'bg:0'
  options: StartingEquipmentOption[];
  isFixedInclude: boolean;
}

export interface EquipmentTypeSlot {
  slotKey: string;
  equipmentType: string;
  label: string;
  candidates: Item5e[];
  defaultKey: string;
}

export type AddItemTypeFilter =
  | 'ARMOR'
  | 'POTION'
  | 'RING'
  | 'ROD'
  | 'SCROLL'
  | 'STAFF'
  | 'WAND'
  | 'WEAPON'
  | 'WONDROUS'
  | 'OTHER GEAR';

export const ADD_ITEM_TYPE_FILTERS: AddItemTypeFilter[] = [
  'ARMOR',
  'POTION',
  'RING',
  'ROD',
  'SCROLL',
  'STAFF',
  'WAND',
  'WEAPON',
  'WONDROUS',
  'OTHER GEAR',
];

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  instrumentMusical: 'Musical Instrument of your choice',
  toolArtisan: "Artisan's Tools of your choice",
  setGaming: 'Gaming Set of your choice',
  weaponSimple: 'Simple Weapon',
  weaponMartial: 'Martial Weapon',
  weaponSimpleMelee: 'Simple Melee Weapon',
  weaponMartialMelee: 'Martial Melee Weapon',
  armorLight: 'Light Armor',
  armorMedium: 'Medium Armor',
  armorHeavy: 'Heavy Armor',
  focusSpellcastingArcane: 'Arcane Focus',
  focusSpellcastingDruidic: 'Druidic Focus',
  focusSpellcastingHoly: 'Holy Symbol',
};

const EQUIPMENT_TYPE_SHORT_LABELS: Record<string, string> = {
  instrumentMusical: 'Musical Instrument',
  toolArtisan: "Artisan's Tools",
  setGaming: 'Gaming Set',
  weaponSimple: 'Simple Weapon',
  weaponMartial: 'Martial Weapon',
  weaponSimpleMelee: 'Simple Melee Weapon',
  weaponMartialMelee: 'Martial Melee Weapon',
  armorLight: 'Light Armor',
  armorMedium: 'Medium Armor',
  armorHeavy: 'Heavy Armor',
  focusSpellcastingArcane: 'Arcane Focus',
  focusSpellcastingDruidic: 'Druidic Focus',
  focusSpellcastingHoly: 'Holy Symbol',
};

const TYPE_SUBTITLE_MAP: Record<string, string> = {
  G: 'Gear • Adventuring Gear',
  AT: "Gear • Artisan's Tools",
  INS: 'Gear • Musical Instrument',
  GS: 'Gear • Gaming Set',
  T: 'Gear • Tool',
  SCF: 'Gear • Spellcasting Focus',
  A: 'Gear • Ammunition',
  AF: 'Gear • Futuristic Ammunition',
  FD: 'Gear • Food & Drink',
  MNT: 'Mount • Mounts & Vehicles',
  VEH: 'Vehicle • Waterborne / Land',
  SHP: 'Vehicle • Ship',
  TAH: 'Gear • Tack & Harness',
  TG: 'Trade Good',
  EXP: 'Gear • Explosive',
  LA: 'Armor • Light Armor',
  MA: 'Armor • Medium Armor',
  HA: 'Armor • Heavy Armor',
  S: 'Armor • Shield',
  P: 'Potion',
  RG: 'Ring',
  RD: 'Rod',
  SC: 'Scroll',
  WD: 'Wand',
};

function titleCase(str: string): string {
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function humanizeEquipmentType(eqType: string, short = false): string {
  const table = short ? EQUIPMENT_TYPE_SHORT_LABELS : EQUIPMENT_TYPE_LABELS;
  if (table[eqType]) return table[eqType];
  return eqType
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

export function formatCopperValue(cpTotal: number): string {
  if (cpTotal <= 0) return '0 GP';
  const gp = Math.floor(cpTotal / 100);
  const remAfterGp = cpTotal % 100;
  const sp = Math.floor(remAfterGp / 10);
  const cp = remAfterGp % 10;
  const parts: string[] = [];
  if (gp > 0) parts.push(`${gp} GP`);
  if (sp > 0) parts.push(`${sp} SP`);
  if (cp > 0) parts.push(`${cp} CP`);
  return parts.join(', ');
}

function pluralizeSimple(name: string, qty: number): string {
  if (qty <= 1) return `${qty} ${name}`;
  if (/^\d/.test(name) || /\(\d+/.test(name)) return `${qty}x ${name}`;
  if (name.toLowerCase().endsWith('s') || name.toLowerCase().endsWith('supplies') || name.toLowerCase().endsWith('rations')) {
    return `${qty} ${name}`;
  }
  return `${qty} ${name}s`;
}

function joinWithAnd(parts: string[]): string {
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]}, and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

export function formatEquipmentToken(
  token: EquipmentToken,
  compendium: CompiledCompendium,
): string {
  if (typeof token === 'string') {
    const it = findItem(compendium, token);
    if (it) return it.name;
    const { name } = splitEntityKey(token);
    return titleCase(name || token);
  }
  if (!token || typeof token !== 'object') return '';

  const qty = token.quantity ?? 1;

  if (typeof token.value === 'number') {
    return formatCopperValue(token.value);
  }

  if (token.equipmentType) {
    const base = humanizeEquipmentType(token.equipmentType);
    return qty > 1 ? `${qty}x ${base}` : base;
  }

  if (token.special) {
    const base = qty > 1 ? `${qty} ${token.special}` : token.special;
    return token.containsValue ? `${base} (contains ${formatCopperValue(token.containsValue)})` : base;
  }

  if (token.item) {
    const it = findItem(compendium, token.item);
    const resolvedName = token.displayName || it?.name || titleCase(splitEntityKey(token.item).name);
    let label = qty > 1 ? pluralizeSimple(resolvedName, qty) : resolvedName;
    if (token.containsValue) {
      label += ` (with ${formatCopperValue(token.containsValue)})`;
    }
    return label;
  }

  return '';
}

export function formatOptionTokensSummary(
  tokens: EquipmentToken[],
  compendium: CompiledCompendium,
): string {
  const parts = tokens
    .map((t) => formatEquipmentToken(t, compendium))
    .filter(Boolean);
  return joinWithAnd(parts);
}

export function parseStartingEquipmentBlocks(
  blocks: Record<string, unknown>[] | undefined,
  prefix: string,
  compendium: CompiledCompendium,
): StartingEquipmentChoiceGroup[] {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return [];

  const groups: StartingEquipmentChoiceGroup[] = [];
  blocks.forEach((block, idx) => {
    if (!block || typeof block !== 'object') return;
    const entries = Object.entries(block).filter(([, val]) => Array.isArray(val));
    if (entries.length === 0) return;

    const fixedEntry = entries.find(([k]) => k === '_');
    const choiceEntries = entries.filter(([k]) => k !== '_');

    if (choiceEntries.length > 0) {
      // Combine any inline `_` fixed tokens alongside choice options if in same block
      const extraFixed = (fixedEntry?.[1] as EquipmentToken[] | undefined) || [];
      const sorted = [...choiceEntries].sort(([a], [b]) => a.localeCompare(b));
      groups.push({
        groupId: `${prefix}:${idx}`,
        isFixedInclude: false,
        options: sorted.map(([key, arr]) => {
          const tokens = [...(arr as EquipmentToken[]), ...extraFixed];
          return {
            key,
            tokens,
            label: formatOptionTokensSummary(tokens, compendium),
          };
        }),
      });
    } else if (fixedEntry) {
      const tokens = fixedEntry[1] as EquipmentToken[];
      groups.push({
        groupId: `${prefix}:${idx}`,
        isFixedInclude: true,
        options: [
          {
            key: '_',
            tokens,
            label: formatOptionTokensSummary(tokens, compendium),
          },
        ],
      });
    }
  });

  return groups;
}

export function parseClassStartingEquipment(
  startingEquipment: StartingEquipmentBlock | undefined,
  compendium: CompiledCompendium,
): StartingEquipmentChoiceGroup[] {
  if (!startingEquipment) return [];
  if (startingEquipment.defaultData && startingEquipment.defaultData.length > 0) {
    return parseStartingEquipmentBlocks(startingEquipment.defaultData, 'class', compendium);
  }
  return [];
}

export function getBaseItemTypeCode(item: Item5e): string {
  return (item.type || '').split('|')[0].trim().toUpperCase();
}

export function matchesEquipmentType(item: Item5e, equipmentType: string): boolean {
  const isMundane = !item.rarity || item.rarity === 'none';
  if (!isMundane) return false;
  const code = getBaseItemTypeCode(item);

  switch (equipmentType) {
    case 'instrumentMusical':
      return code === 'INS';
    case 'toolArtisan':
      return code === 'AT';
    case 'setGaming':
      return code === 'GS';
    case 'weaponSimple':
      return Boolean(item.weapon) && item.weaponCategory === 'simple';
    case 'weaponMartial':
      return Boolean(item.weapon) && item.weaponCategory === 'martial';
    case 'weaponSimpleMelee':
      return Boolean(item.weapon) && item.weaponCategory === 'simple' && code === 'M';
    case 'weaponMartialMelee':
      return Boolean(item.weapon) && item.weaponCategory === 'martial' && code === 'M';
    case 'armorLight':
      return Boolean(item.armor) && code === 'LA';
    case 'armorMedium':
      return Boolean(item.armor) && code === 'MA';
    case 'armorHeavy':
      return Boolean(item.armor) && code === 'HA';
    case 'focusSpellcastingArcane':
      return code === 'SCF' && (item.scfType === 'arcane' || /arcane|crystal|orb|rod|staff|wand/i.test(item.name));
    case 'focusSpellcastingDruidic':
      return code === 'SCF' && (item.scfType === 'druidic' || /druidic|sprig|totem|mistletoe|yew/i.test(item.name));
    case 'focusSpellcastingHoly':
      return code === 'SCF' && (item.scfType === 'holy' || /holy|amulet|emblem|reliquary/i.test(item.name));
    default:
      return code === equipmentType.toUpperCase();
  }
}

export function getCandidatesForEquipmentType(
  compendium: CompiledCompendium,
  equipmentType: string,
  enabledSources: string[],
  ruleset: RulesetMode,
): Item5e[] {
  const allMatching = compendium.items.filter((it) => matchesEquipmentType(it, equipmentType));
  const allowed = allMatching.filter((it) =>
    isSourceAllowed(it.source, enabledSources, ruleset, it.edition),
  );
  const pool = allowed.length > 0 ? allowed : allMatching;

  // Deduplicate by lowercase name, preferring enabled/ruleset source (XPHB in 2024, PHB in 2014)
  const preferredSource = ruleset === '2024' ? 'XPHB' : 'PHB';
  const byName = new Map<string, Item5e>();
  for (const it of pool) {
    const k = it.name.toLowerCase();
    const prev = byName.get(k);
    if (!prev || it.source === preferredSource) {
      byName.set(k, it);
    }
  }
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function extractOptionTypeSlots(
  groupId: string,
  optionKey: string,
  tokens: EquipmentToken[],
  compendium: CompiledCompendium,
  enabledSources: string[],
  ruleset: RulesetMode,
): EquipmentTypeSlot[] {
  const slots: EquipmentTypeSlot[] = [];
  tokens.forEach((tok, idx) => {
    if (!tok || typeof tok !== 'object' || !tok.equipmentType) return;
    const qty = tok.quantity ?? 1;
    const candidates = getCandidatesForEquipmentType(compendium, tok.equipmentType, enabledSources, ruleset);
    const defaultCandidate =
      tok.equipmentType === 'instrumentMusical'
        ? candidates.find((c) => c.name.toLowerCase() === 'flute') || candidates[0]
        : candidates[0];
    const defaultKey = defaultCandidate ? makeEntityKey(defaultCandidate.name, defaultCandidate.source) : '';
    const shortLabel = humanizeEquipmentType(tok.equipmentType, true);
    for (let copy = 0; copy < Math.min(qty, 4); copy++) {
      slots.push({
        slotKey: `${groupId}:${optionKey}:${idx}:${copy}`,
        equipmentType: tok.equipmentType,
        label: qty > 1 ? `${shortLabel} ${copy + 1}` : shortLabel,
        candidates,
        defaultKey,
      });
    }
  });
  return slots;
}

export interface PackSummary {
  packName: string;
  sentence: string;
}

export function getOptionPackSummaries(
  tokens: EquipmentToken[],
  compendium: CompiledCompendium,
): PackSummary[] {
  const summaries: PackSummary[] = [];
  for (const tok of tokens) {
    const key = typeof tok === 'string' ? tok : tok?.item;
    if (!key) continue;
    const item = findItem(compendium, key);
    if (!item?.packContents || item.packContents.length === 0) continue;
    // Only show "A {Pack} contains the following items: ..." for Packs (not Arrows (20))
    if (!/pack/i.test(item.name) && item.packContents.length <= 1) continue;

    const itemTexts = item.packContents
      .map((entry) => {
        if (typeof entry === 'string') {
          const found = findItem(compendium, entry);
          return found ? found.name : titleCase(splitEntityKey(entry).name);
        }
        const q = entry.quantity ?? 1;
        if (entry.special) {
          return q > 1 ? `${q} ${entry.special}` : entry.special;
        }
        if (entry.item) {
          const found = findItem(compendium, entry.item);
          const nm = found?.name || titleCase(splitEntityKey(entry.item).name);
          return q > 1 ? pluralizeSimple(nm, q) : nm;
        }
        return '';
      })
      .filter(Boolean);

    if (itemTexts.length > 0) {
      const article = /^[aeiou]/i.test(item.name) ? 'An' : 'A';
      summaries.push({
        packName: item.name,
        sentence: `${article} ${item.name} contains the following items: ${joinWithAnd(itemTexts)}.`,
      });
    }
  }
  return summaries;
}

export function resolveStartingEquipmentAdditions(
  selectedGroups: {
    groupId: string;
    option: StartingEquipmentOption;
  }[],
  subChoices: Record<string, string>,
  compendium: CompiledCompendium,
  enabledSources: string[],
  ruleset: RulesetMode,
): {
  inventoryAdditions: CharacterInventoryItem[];
  currencyDelta: CharacterCurrency;
} {
  const additions: CharacterInventoryItem[] = [];
  let totalCopper = 0;

  const pushCompendiumItem = (it: Item5e, qty: number, customDisplayName?: string) => {
    // Expand adventuring packs cleanly into their contents when defined in the compendium
    if (it.packContents && it.packContents.length > 0) {
      for (const content of it.packContents) {
        if (typeof content === 'string') {
          const sub = findItem(compendium, content);
          if (sub) {
            additions.push({
              instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              itemKey: makeEntityKey(sub.name, sub.source),
              name: sub.name,
              source: sub.source,
              quantity: qty,
              equipped: Boolean(sub.weapon || sub.armor || sub.shield),
              attuned: false,
            });
          }
        } else if (content && typeof content === 'object') {
          const subQty = (content.quantity ?? 1) * qty;
          if (content.item) {
            const sub = findItem(compendium, content.item);
            if (sub) {
              additions.push({
                instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                itemKey: makeEntityKey(sub.name, sub.source),
                name: sub.name,
                source: sub.source,
                quantity: subQty,
                equipped: Boolean(sub.weapon || sub.armor || sub.shield),
                attuned: false,
              });
            } else {
              additions.push({
                instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                itemKey: `custom:${content.item}`,
                name: titleCase(splitEntityKey(content.item).name),
                quantity: subQty,
                equipped: false,
                attuned: false,
                isCustom: true,
              });
            }
          } else if (content.special) {
            additions.push({
              instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              itemKey: `custom:${content.special.toLowerCase()}`,
              name: content.special,
              quantity: subQty,
              equipped: false,
              attuned: false,
              isCustom: true,
            });
          }
        }
      }
      return;
    }

    additions.push({
      instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      itemKey: makeEntityKey(it.name, it.source),
      name: customDisplayName || it.name,
      source: it.source,
      quantity: qty,
      equipped: Boolean(it.weapon || it.armor || it.shield),
      attuned: false,
    });
  };

  for (const { groupId, option } of selectedGroups) {
    const slots = extractOptionTypeSlots(
      groupId,
      option.key,
      option.tokens,
      compendium,
      enabledSources,
      ruleset,
    );
    const slotByTokenIdx = new Map<number, string[]>();
    slots.forEach((slot) => {
      const parts = slot.slotKey.split(':');
      const tokIdx = Number(parts[parts.length - 2]);
      const chosenKey = subChoices[slot.slotKey] || slot.defaultKey;
      const list = slotByTokenIdx.get(tokIdx) || [];
      if (chosenKey) list.push(chosenKey);
      slotByTokenIdx.set(tokIdx, list);
    });

    option.tokens.forEach((tok, idx) => {
      if (typeof tok === 'string') {
        const it = findItem(compendium, tok);
        if (it) {
          pushCompendiumItem(it, 1);
        } else {
          additions.push({
            instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            itemKey: `custom:${tok}`,
            name: titleCase(splitEntityKey(tok).name),
            quantity: 1,
            equipped: false,
            attuned: false,
            isCustom: true,
          });
        }
        return;
      }

      if (!tok || typeof tok !== 'object') return;
      if (typeof tok.value === 'number') totalCopper += tok.value;
      if (typeof tok.containsValue === 'number') totalCopper += tok.containsValue;
      if (typeof tok.worthValue === 'number') totalCopper += tok.worthValue;

      if (tok.equipmentType) {
        const chosenKeys = slotByTokenIdx.get(idx) || [];
        for (const chosenKey of chosenKeys) {
          const it = findItem(compendium, chosenKey);
          if (it) pushCompendiumItem(it, 1);
        }
        return;
      }

      if (tok.item) {
        const it = findItem(compendium, tok.item);
        const qty = tok.quantity ?? 1;
        if (it) {
          pushCompendiumItem(it, qty, tok.displayName);
        } else {
          additions.push({
            instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            itemKey: `custom:${tok.item}`,
            name: tok.displayName || titleCase(splitEntityKey(tok.item).name),
            quantity: qty,
            equipped: false,
            attuned: false,
            isCustom: true,
          });
        }
        return;
      }

      if (tok.special) {
        additions.push({
          instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          itemKey: `custom:${tok.special.toLowerCase()}`,
          name: tok.special,
          quantity: tok.quantity ?? 1,
          equipped: false,
          attuned: false,
          isCustom: true,
        });
      }
    });
  }

  const gp = Math.floor(totalCopper / 100);
  const remAfterGp = totalCopper % 100;
  const sp = Math.floor(remAfterGp / 10);
  const cp = remAfterGp % 10;

  return {
    inventoryAdditions: additions,
    currencyDelta: { pp: 0, gp, ep: 0, sp, cp },
  };
}

export function getItemTypeCategories(item: Item5e): AddItemTypeFilter[] {
  const code = getBaseItemTypeCode(item);
  const cats: AddItemTypeFilter[] = [];

  if (item.armor || item.shield || code === 'LA' || code === 'MA' || code === 'HA' || code === 'S') {
    cats.push('ARMOR');
  }
  if (code === 'P') cats.push('POTION');
  if (code === 'RG') cats.push('RING');
  if (item.rod || code === 'RD') cats.push('ROD');
  if (code === 'SC') cats.push('SCROLL');
  if (item.staff) cats.push('STAFF');
  if (item.wand || code === 'WD') cats.push('WAND');
  if (item.weapon || ((code === 'M' || code === 'R') && !item.staff && !item.wand)) {
    cats.push('WEAPON');
  }
  if (item.wondrous) cats.push('WONDROUS');
  if (cats.length === 0) cats.push('OTHER GEAR');

  return cats;
}

export function getItemSubtitle(item: Item5e): string {
  const code = getBaseItemTypeCode(item);
  if (TYPE_SUBTITLE_MAP[code]) return TYPE_SUBTITLE_MAP[code];
  if (item.weapon) {
    const wc = item.weaponCategory ? `${titleCase(item.weaponCategory)} ` : '';
    const rangeKind = code === 'R' ? 'Ranged Weapon' : 'Melee Weapon';
    return `Weapon • ${wc}${rangeKind}`;
  }
  if (item.armor) return 'Armor';
  if (item.shield) return 'Armor • Shield';
  if (item.wondrous) {
    const r = item.rarity && item.rarity !== 'none' ? ` • ${titleCase(item.rarity)}` : '';
    return `Wondrous Item${r}`;
  }
  if (item.staff) return 'Staff';
  if (item.wand) return 'Wand';
  if (item.rod) return 'Rod';
  if (item.rarity && item.rarity !== 'none') return `Magic Item • ${titleCase(item.rarity)}`;
  return 'Gear';
}

export function isItemMagical(item: Item5e): boolean {
  if (item.rarity && item.rarity !== 'none') return true;
  if (item.wondrous || item.staff || item.wand || item.rod) return true;
  const code = getBaseItemTypeCode(item);
  return code === 'RG' || code === 'RD' || code === 'WD' || code === 'P' || code === 'SC';
}

export function isItemCommon(item: Item5e): boolean {
  return !item.rarity || item.rarity === 'none' || item.rarity.toLowerCase() === 'common';
}

export function isItemContainer(item: Item5e): boolean {
  if (item.containerCapacity) return true;
  if (item.packContents && /pack/i.test(item.name)) return true;
  return /^(backpack|bag of holding|barrel|basket|bucket|chest|crossbow bolt case|flask|glass bottle|handy haversack|iron pot|jug|map or scroll case|portable hole|pouch|quiver|sack|saddlebags|waterskin)/i.test(
    item.name.trim(),
  );
}

export function isItemProficient(item: Item5e, computed: ComputedCharacter): boolean {
  const code = getBaseItemTypeCode(item);

  if (item.shield || code === 'S') {
    return computed.armorProficiencies.some((p) => p.toLowerCase().includes('shield'));
  }

  if (item.armor || code === 'LA' || code === 'MA' || code === 'HA') {
    const lowerProfs = computed.armorProficiencies.map((p) => p.toLowerCase());
    if (code === 'LA') return lowerProfs.some((p) => p.includes('light') || p === 'all');
    if (code === 'MA') return lowerProfs.some((p) => p.includes('medium') || p === 'all');
    if (code === 'HA') return lowerProfs.some((p) => p.includes('heavy') || p === 'all');
    return lowerProfs.length > 0;
  }

  if (item.weapon || code === 'M' || code === 'R') {
    const lowerProfs = computed.weaponProficiencies.map((p) => p.toLowerCase());
    const itemNameLower = item.name.toLowerCase();
    const baseNameLower = item.baseItem ? splitEntityKey(item.baseItem).name.toLowerCase() : '';
    if (item.weaponCategory && lowerProfs.some((p) => p.includes(item.weaponCategory!.toLowerCase()))) {
      return true;
    }
    return lowerProfs.some(
      (p) =>
        p === itemNameLower ||
        itemNameLower.includes(p) ||
        (baseNameLower && (p === baseNameLower || baseNameLower.includes(p))),
    );
  }

  if (code === 'AT' || code === 'INS' || code === 'GS' || code === 'T') {
    const lowerTools = computed.toolProficiencies.map((t) => t.toLowerCase());
    const nameLower = item.name.toLowerCase();
    if (lowerTools.some((t) => t === nameLower || nameLower.includes(t) || t.includes(nameLower))) {
      return true;
    }
    if (code === 'INS' && lowerTools.some((t) => t.includes('musical instrument'))) return true;
    if (code === 'AT' && lowerTools.some((t) => t.includes("artisan's tools"))) return true;
    if (code === 'GS' && lowerTools.some((t) => t.includes('gaming set'))) return true;
    return false;
  }

  return false;
}

export function isLegacySourceCategory(item: Item5e, compendium: CompiledCompendium): boolean {
  const cat = classifySourceCategory(item, compendium.books);
  return cat === '5e-core' || cat === '5e-supplements';
}
