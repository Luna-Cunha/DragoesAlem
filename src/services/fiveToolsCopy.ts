import type { Race5e, Subrace5e } from '../types/5etools';

interface CopyModOp {
  mode: string;
  replace?: string;
  index?: number;
  items?: unknown;
  names?: string | string[];
  prop?: string;
  value?: unknown;
}

interface CopyMeta {
  name: string;
  source: string;
  _mod?: Record<string, unknown>;
  _preserve?: Record<string, boolean>;
}

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val)) as T;
}

function applyModToArray(arr: unknown[], op: CopyModOp): unknown[] {
  const next = [...arr];
  const itemsArr = Array.isArray(op.items) ? op.items : op.items !== undefined ? [op.items] : [];

  switch (op.mode) {
    case 'replaceArr': {
      const idx = next.findIndex((el) => {
        if (typeof el === 'object' && el !== null && 'name' in el) {
          return String((el as { name?: string }).name).toLowerCase() === String(op.replace || '').toLowerCase();
        }
        return false;
      });
      if (idx !== -1) {
        next.splice(idx, 1, ...itemsArr);
      } else {
        next.push(...itemsArr);
      }
      return next;
    }
    case 'insertArr': {
      const index = typeof op.index === 'number' ? Math.max(0, Math.min(op.index, next.length)) : next.length;
      next.splice(index, 0, ...itemsArr);
      return next;
    }
    case 'appendArr': {
      next.push(...itemsArr);
      return next;
    }
    case 'prependArr': {
      next.unshift(...itemsArr);
      return next;
    }
    case 'removeArr': {
      const targets = new Set(
        (Array.isArray(op.names) ? op.names : op.names ? [op.names] : []).map((s) => s.toLowerCase()),
      );
      return next.filter((el) => {
        if (typeof el === 'object' && el !== null && 'name' in el) {
          return !targets.has(String((el as { name?: string }).name).toLowerCase());
        }
        return true;
      });
    }
    case 'replaceOrAppendArr': {
      const idx = next.findIndex(
        (el) =>
          typeof el === 'object' &&
          el !== null &&
          'name' in el &&
          String((el as { name?: string }).name).toLowerCase() === String(op.replace || '').toLowerCase(),
      );
      if (idx !== -1) next.splice(idx, 1, ...itemsArr);
      else next.push(...itemsArr);
      return next;
    }
    default:
      return next;
  }
}

export function resolveCopyEntries<T extends { name: string; source: string; _copy?: CopyMeta }>(
  rawList: T[],
): T[] {
  const byKey = new Map<string, T>();
  for (const item of rawList) {
    byKey.set(`${item.name.toLowerCase()}|${item.source.toLowerCase()}`, item);
  }

  const resolvedCache = new Map<string, T>();

  const resolveItem = (item: T, depth = 0): T => {
    const key = `${item.name.toLowerCase()}|${item.source.toLowerCase()}`;
    if (resolvedCache.has(key)) return resolvedCache.get(key)!;
    if (!item._copy || depth > 5) {
      const clean = deepClone(item);
      resolvedCache.set(key, clean);
      return clean;
    }

    const parentKey = `${item._copy.name.toLowerCase()}|${item._copy.source.toLowerCase()}`;
    const parentRaw = byKey.get(parentKey);
    if (!parentRaw) {
      const clean = deepClone(item);
      delete clean._copy;
      resolvedCache.set(key, clean);
      return clean;
    }

    const base = deepClone(resolveItem(parentRaw, depth + 1));
    const preserve = item._copy._preserve || {};
    if (!preserve.page) delete (base as Record<string, unknown>).page;
    if (!preserve.reprintedAs) delete (base as Record<string, unknown>).reprintedAs;
    if (!preserve.srd) delete (base as Record<string, unknown>).srd;
    if (!preserve.basicRules) delete (base as Record<string, unknown>).basicRules;

    const merged: Record<string, unknown> = {
      ...base,
      ...deepClone(item),
    };
    delete merged._copy;

    if (item._copy._mod) {
      for (const [prop, modVal] of Object.entries(item._copy._mod)) {
        const ops = (Array.isArray(modVal) ? modVal : [modVal]) as CopyModOp[];
        let current = merged[prop];
        for (const op of ops) {
          if (!op || typeof op !== 'object') continue;
          if (Array.isArray(current)) {
            current = applyModToArray(current, op);
          } else if (op.mode === 'setProp' && op.prop) {
            if (typeof current === 'object' && current !== null) {
              (current as Record<string, unknown>)[op.prop] = op.value;
            }
          }
        }
        merged[prop] = current;
      }
    }

    const result = merged as T;
    resolvedCache.set(key, result);
    return result;
  };

  return rawList.map((item) => resolveItem(item));
}

/**
 * Merges 5etools `race` and `subrace` arrays into playable species/race options.
 * Races with subraces emit each subrace merged with its parent race, while
 * standalone races (or 2024 XPHB races that handle lineages internally) remain as-is.
 */
export function mergeRacesAndSubraces(races: Race5e[], subraces: Subrace5e[]): Race5e[] {
  const resolvedRaces = resolveCopyEntries(races);
  const byKey = new Map<string, Race5e>();
  for (const r of resolvedRaces) {
    byKey.set(`${r.name.toLowerCase()}|${r.source.toLowerCase()}`, r);
  }

  const parentsWithSubraces = new Set<string>();
  const mergedList: Race5e[] = [];

  for (const sr of subraces) {
    if (!sr.raceName || !sr.raceSource) continue;
    const parentKey = `${sr.raceName.toLowerCase()}|${sr.raceSource.toLowerCase()}`;
    const parent = byKey.get(parentKey);
    if (!parent) continue;

    parentsWithSubraces.add(parentKey);
    const base = deepClone(parent);
    const overwrite = sr.overwrite || {};

    const combinedName = sr.name ? `${parent.name} (${sr.name})` : parent.name;

    const merged: Race5e = {
      ...base,
      ...deepClone(sr),
      name: combinedName,
      baseName: parent.name,
      raceName: parent.name,
      raceSource: parent.source,
      source: sr.source || parent.source,
      size: sr.size ?? base.size,
      speed: sr.speed ?? base.speed,
      darkvision: sr.darkvision ?? base.darkvision,
      ability: overwrite.ability
        ? sr.ability
        : [...(base.ability || []), ...(sr.ability || [])],
      skillProficiencies: overwrite.skillProficiencies
        ? sr.skillProficiencies
        : [...(base.skillProficiencies || []), ...(sr.skillProficiencies || [])],
      toolProficiencies: overwrite.toolProficiencies
        ? sr.toolProficiencies
        : [...(base.toolProficiencies || []), ...(sr.toolProficiencies || [])],
      languageProficiencies: overwrite.languageProficiencies
        ? sr.languageProficiencies
        : [...(base.languageProficiencies || []), ...(sr.languageProficiencies || [])],
      weaponProficiencies: [...(base.weaponProficiencies || []), ...(sr.weaponProficiencies || [])],
      armorProficiencies: [...(base.armorProficiencies || []), ...(sr.armorProficiencies || [])],
      resist: [...(base.resist || []), ...(sr.resist || [])],
      additionalSpells: [...(base.additionalSpells || []), ...(sr.additionalSpells || [])],
      entries: [...(base.entries || []), ...(sr.entries || [])],
    };
    delete merged._copy;
    mergedList.push(merged);
  }

  for (const r of resolvedRaces) {
    const parentKey = `${r.name.toLowerCase()}|${r.source.toLowerCase()}`;
    if (!parentsWithSubraces.has(parentKey)) {
      mergedList.push(r);
    } else {
      // Also check if base race has no default subrace name; keep subraces as the concrete picks
      const hasDefaultNamelessSubrace = subraces.some(
        (s) =>
          s.raceName?.toLowerCase() === r.name.toLowerCase() &&
          s.raceSource?.toLowerCase() === r.source.toLowerCase() &&
          !s.name,
      );
      if (!hasDefaultNamelessSubrace) {
        // Keep base race only if it's 2024 XPHB/etc. or has no subraces; subraces already include base traits
      }
    }
  }

  return mergedList;
}
