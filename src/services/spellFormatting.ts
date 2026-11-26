import type { Book5e, Spell5e } from '../types/5etools';

export interface SpellSchoolStyle {
  name: string;
  bg: string;
}

export const SPELL_SCHOOL_STYLES: Record<string, SpellSchoolStyle> = {
  A: { name: 'Abjuration', bg: '#2b6ba8' },
  C: { name: 'Conjuration', bg: '#be8818' },
  D: { name: 'Divination', bg: '#2b8585' },
  E: { name: 'Enchantment', bg: '#a14474' },
  V: { name: 'Evocation', bg: '#9f2c27' },
  I: { name: 'Illusion', bg: '#6d4596' },
  N: { name: 'Necromancy', bg: '#6c8c2b' },
  T: { name: 'Transmutation', bg: '#b6611e' },
};

export interface FormattedSpellMeta {
  schoolName: string;
  schoolBg: string;
  levelOrdinal: string;
  levelHeaderText: string;
  isConcentration: boolean;
  isRitual: boolean;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  sourceBookName: string;
  tags: string[];
}

export function formatSpellOrdinal(lvl: number): string {
  if (lvl <= 0) return 'Cantrip';
  if (lvl === 1) return '1st';
  if (lvl === 2) return '2nd';
  if (lvl === 3) return '3rd';
  return `${lvl}th`;
}

export function isCore2024Spell(sp: Spell5e): boolean {
  return sp.source.toUpperCase() === 'XPHB' || sp.edition === 'one';
}

function formatTimeUnit(unit: string, count: number): string {
  const lower = unit.toLowerCase();
  if (lower === 'bonus') return 'bonus action';
  if (count > 1 && !lower.endsWith('s')) return `${lower}s`;
  return lower;
}

function deriveSpellTags(sp: Spell5e): string[] {
  const tags = new Set<string>();
  if (sp.damageInflict?.length) tags.add('DAMAGE');
  if (sp.conditionInflict?.length) tags.add('DEBUFF');

  for (const tag of sp.miscTags || []) {
    if (tag === 'HL' || tag === 'THP') tags.add('HEALING');
    else if (tag === 'SMN') tags.add('SUMMONING');
    else if (tag === 'TP') tags.add('TELEPORTATION');
    else if (tag === 'OBS' || tag === 'WLT') tags.add('CONTROL');
    else if (tag === 'FMV' || tag === 'DFT') tags.add('MOVEMENT');
    else if (tag === 'ADV' || tag === 'AAD') tags.add('BUFF');
  }

  if (sp.meta?.ritual) tags.add('RITUAL');
  if (tags.size === 0) {
    if (sp.spellAttack?.length || sp.savingThrow?.length) {
      tags.add('COMBAT');
    } else {
      tags.add('UTILITY');
    }
  }
  return [...tags];
}

export function formatSpellMetadata(sp: Spell5e, books?: Book5e[]): FormattedSpellMeta {
  const schoolStyle = SPELL_SCHOOL_STYLES[sp.school] || { name: sp.school || 'Magic', bg: '#4b5563' };
  const isConcentration = Boolean(sp.duration?.some((d) => d.concentration));
  const isRitual = Boolean(sp.meta?.ritual);

  const castingTime =
    sp.time
      ?.map((t) => {
        const base = `${t.number} ${formatTimeUnit(t.unit, t.number)}`;
        return t.condition ? `${base}, ${t.condition}` : base;
      })
      .join(', or ') || '1 action';

  let range = 'Self';
  if (sp.range) {
    const dist = sp.range.distance;
    const distStr = dist?.amount
      ? `${dist.amount} ${dist.type === 'feet' ? 'ft.' : dist.type}`
      : dist?.type
        ? dist.type.replace(/^[a-z]/, (c) => c.toUpperCase())
        : '';

    if (sp.range.type === 'point') {
      range = distStr || 'Self';
    } else if (distStr) {
      range = `Self (${distStr.replace(' ', '-')} ${sp.range.type})`;
    } else {
      range = sp.range.type;
    }
  }

  const comps = [
    sp.components?.v ? 'V' : '',
    sp.components?.s ? 'S' : '',
    sp.components?.m
      ? `M (${typeof sp.components.m === 'string' ? sp.components.m : sp.components.m.text})`
      : '',
  ]
    .filter(Boolean)
    .join(', ');

  const duration =
    sp.duration
      ?.map((d) => {
        if (d.type === 'instant') return 'Instantaneous';
        if (d.type === 'permanent') return 'Until dispelled';
        if (d.type === 'special') return 'Special';
        if (d.type === 'timed' && d.duration) {
          const unit = `${d.duration.type}${d.duration.amount && d.duration.amount > 1 ? 's' : ''}`;
          const prefix = d.concentration ? 'Concentration, up to ' : d.duration.upTo ? 'Up to ' : '';
          return `${prefix}${d.duration.amount} ${unit}`;
        }
        return d.type;
      })
      .join(', ') || 'Instantaneous';

  const matchedBook = books?.find((b) => b.source.toLowerCase() === sp.source.toLowerCase());
  const sourceBookName = (matchedBook?.name || sp.source).replace(/\s*\((?:2014|2024)\)\s*$/i, '');

  const levelOrdinal = formatSpellOrdinal(sp.level);
  const levelHeaderText = sp.level === 0 ? 'Cantrip' : `${levelOrdinal} Level`;

  return {
    schoolName: schoolStyle.name,
    schoolBg: schoolStyle.bg,
    levelOrdinal,
    levelHeaderText,
    isConcentration,
    isRitual,
    castingTime,
    range,
    components: comps || 'None',
    duration,
    sourceBookName,
    tags: deriveSpellTags(sp),
  };
}
