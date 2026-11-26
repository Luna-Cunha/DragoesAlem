import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CompiledCompendium, EntryNode } from '../types/5etools';
import type { Character, RollRecord } from '../types/character';
import {
  clearCompendium,
  deleteCharacterById,
  loadAllCharacters,
  loadCompendium,
  saveCharacter,
  saveCompendium,
} from '../services/storage';
import { rollD20Check, rollDiceExpression } from '../engine/dice';
import { formatSpellMetadata } from '../services/spellFormatting';

export interface DrawerData {
  title: string;
  subtitle?: string;
  source?: string;
  page?: number;
  badges?: string[];
  metaRows?: { label: string; value: string }[];
  entries?: EntryNode[];
  entriesHigherLevel?: EntryNode[];
}

interface AppContextValue {
  compendium: CompiledCompendium | null;
  booting: boolean;
  characters: Character[];
  setCompendiumData: (data: CompiledCompendium) => Promise<void>;
  resetCompendium: () => Promise<void>;
  upsertCharacter: (char: Character) => Promise<void>;
  removeCharacter: (id: string) => Promise<void>;
  rollMode: 'normal' | 'advantage' | 'disadvantage';
  setRollMode: (mode: 'normal' | 'advantage' | 'disadvantage') => void;
  rollHistory: RollRecord[];
  activeToast: RollRecord | null;
  dismissToast: () => void;
  clearHistory: () => void;
  rollExpression: (expr: string, label?: string, context?: string, damageType?: string) => RollRecord;
  rollD20: (bonus: number, label: string, context?: string) => RollRecord;
  drawer: DrawerData | null;
  openDrawer: (data: DrawerData) => void;
  openReferenceByTag: (kind: string, name: string, source?: string) => void;
  closeDrawer: () => void;
  siteDarkMode: boolean;
  toggleSiteDarkMode: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [compendium, setCompendium] = useState<CompiledCompendium | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [booting, setBooting] = useState(true);
  const [rollMode, setRollMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [rollHistory, setRollHistory] = useState<RollRecord[]>([]);
  const [activeToast, setActiveToast] = useState<RollRecord | null>(null);
  const [drawer, setDrawer] = useState<DrawerData | null>(null);
  const [siteDarkMode, setSiteDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dragoes_alem_site_dark');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', siteDarkMode ? 'dark' : 'light');
    try {
      localStorage.setItem('dragoes_alem_site_dark', String(siteDarkMode));
    } catch {
      // ignore storage errors
    }
  }, [siteDarkMode]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [comp, chars] = await Promise.all([loadCompendium(), loadAllCharacters()]);
      if (!active) return;
      setCompendium(comp);
      setCharacters(chars);
      setBooting(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setCompendiumData = useCallback(async (data: CompiledCompendium) => {
    await saveCompendium(data);
    setCompendium(data);
  }, []);

  const resetCompendium = useCallback(async () => {
    await clearCompendium();
    setCompendium(null);
  }, []);

  const upsertCharacter = useCallback(async (char: Character) => {
    const stamped: Character = {
      ...char,
      updatedAt: new Date().toISOString(),
    };
    setCharacters((prev) => {
      const idx = prev.findIndex((c) => c.id === stamped.id);
      if (idx === -1) return [stamped, ...prev];
      const next = [...prev];
      next[idx] = stamped;
      return next;
    });
    await saveCharacter(stamped);
  }, []);

  const removeCharacter = useCallback(async (id: string) => {
    await deleteCharacterById(id);
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const recordRoll = useCallback((rec: RollRecord) => {
    setRollHistory((prev) => [rec, ...prev].slice(0, 50));
    setActiveToast(rec);
    return rec;
  }, []);

  const rollExpression = useCallback(
    (expr: string, label?: string, context?: string, damageType?: string) => {
      const rec = rollDiceExpression(expr, { label, context, mode: rollMode, damageType });
      return recordRoll(rec);
    },
    [recordRoll, rollMode],
  );

  const rollD20 = useCallback(
    (bonus: number, label: string, context?: string) => {
      const rec = rollD20Check(bonus, { label, context, mode: rollMode });
      return recordRoll(rec);
    },
    [recordRoll, rollMode],
  );

  const openDrawer = useCallback((data: DrawerData) => {
    setDrawer(data);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer(null);
  }, []);

  const openReferenceByTag = useCallback(
    (kind: string, name: string, source?: string) => {
      if (!compendium) return;
      const nLower = name.toLowerCase();
      const sLower = source?.toLowerCase();
      const matchSrc = <T extends { name: string; source?: string }>(arr: T[]) =>
        (sLower ? arr.find((x) => x.name.toLowerCase() === nLower && x.source?.toLowerCase() === sLower) : undefined) ||
        arr.find((x) => x.name.toLowerCase() === nLower);

      if (kind === 'spell') {
        const sp = matchSrc(compendium.spells);
        if (sp) {
          const meta = formatSpellMetadata(sp, compendium.books);
          openDrawer({
            title: sp.name,
            subtitle: `${sp.level === 0 ? 'Cantrip' : `Level ${sp.level}`} ${meta.schoolName}`,
            source: sp.source,
            page: sp.page,
            badges: [
              ...(meta.isRitual ? ['Ritual'] : []),
              ...(meta.isConcentration ? ['Concentration'] : []),
            ],
            metaRows: [
              { label: 'Casting Time', value: meta.castingTime },
              { label: 'Range', value: meta.range },
              { label: 'Components', value: meta.components },
              { label: 'Duration', value: meta.duration },
            ],
            entries: sp.entries,
            entriesHigherLevel: sp.entriesHigherLevel,
          });
          return;
        }
      }

      if (kind === 'condition' || kind === 'status') {
        const cond = matchSrc(compendium.conditions);
        if (cond) {
          openDrawer({
            title: cond.name,
            subtitle: 'Condition',
            source: cond.source,
            page: cond.page,
            entries: cond.entries,
          });
          return;
        }
      }

      if (kind === 'item') {
        const it = matchSrc(compendium.items);
        if (it) {
          openDrawer({
            title: it.name,
            subtitle: `${it.rarity && it.rarity !== 'none' ? `${it.rarity} ` : ''}Equipment`,
            source: it.source,
            page: it.page,
            metaRows: [
              ...(it.dmg1 ? [{ label: 'Damage', value: `${it.dmg1}${it.dmg2 ? ` / ${it.dmg2}` : ''} ${it.dmgType || ''}` }] : []),
              ...(it.ac ? [{ label: 'Armor Class', value: String(it.ac) }] : []),
              ...(it.weight ? [{ label: 'Weight', value: `${it.weight} lb.` }] : []),
              ...(it.value ? [{ label: 'Cost', value: `${it.value / 100} gp` }] : []),
            ],
            entries: it.entries || [],
          });
          return;
        }
      }

      if (kind === 'feat') {
        const ft = matchSrc(compendium.feats);
        if (ft) {
          openDrawer({
            title: ft.name,
            subtitle: 'Feat',
            source: ft.source,
            page: ft.page,
            entries: ft.entries,
          });
          return;
        }
      }

      if (kind === 'skill') {
        const sk = matchSrc(compendium.skills);
        if (sk) {
          openDrawer({
            title: sk.name,
            subtitle: `Skill (${sk.ability.toUpperCase()})`,
            source: sk.source,
            page: sk.page,
            entries: sk.entries,
          });
          return;
        }
      }

      if (kind === 'sense') {
        const sn = matchSrc(compendium.senses);
        if (sn) {
          openDrawer({
            title: sn.name,
            subtitle: 'Sense',
            source: sn.source,
            page: sn.page,
            entries: sn.entries,
          });
          return;
        }
      }

      if (kind === 'action') {
        const ac = matchSrc(compendium.actions);
        if (ac) {
          openDrawer({
            title: ac.name,
            subtitle: 'Combat Action',
            source: ac.source,
            page: ac.page,
            entries: ac.entries,
          });
          return;
        }
      }

      if (kind === 'variantrule') {
        const vr = matchSrc(compendium.variantRules) || matchSrc(compendium.itemMasteries);
        if (vr) {
          openDrawer({
            title: vr.name,
            subtitle: 'Rule Reference',
            source: vr.source,
            page: vr.page,
            entries: vr.entries,
          });
          return;
        }
      }

      if (kind === 'optfeature') {
        const of = matchSrc(compendium.optionalFeatures);
        if (of) {
          openDrawer({
            title: of.name,
            subtitle: 'Optional Class Feature',
            source: of.source,
            page: of.page,
            entries: of.entries,
          });
        }
      }
    },
    [compendium, openDrawer],
  );

  return (
    <AppContext.Provider
      value={{
        compendium,
        booting,
        characters,
        setCompendiumData,
        resetCompendium,
        upsertCharacter,
        removeCharacter,
        rollMode,
        setRollMode,
        rollHistory,
        activeToast,
        dismissToast: () => setActiveToast(null),
        clearHistory: () => setRollHistory([]),
        rollExpression,
        rollD20,
        drawer,
        openDrawer,
        openReferenceByTag,
        closeDrawer,
        siteDarkMode,
        toggleSiteDarkMode: () => setSiteDarkMode((v) => !v),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
