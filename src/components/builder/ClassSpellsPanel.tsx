import { useId, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Minus, Plus, Search } from 'lucide-react';
import type { Book5e, Spell5e } from '../../types/5etools';
import type { CharacterClassSelection } from '../../types/character';
import { findSpell, makeEntityKey } from '../../engine/rules';
import { isCore2024Spell } from '../../services/spellFormatting';
import { SpellAccordionCard } from './SpellAccordionCard';

type SourceCategory = '5.5e-core' | '5e-expanded';

function renderLevelButtonContent(lvl: number) {
  if (lvl === 0) return <span>- 0 -</span>;
  const suffix = lvl === 1 ? 'ST' : lvl === 2 ? 'ND' : lvl === 3 ? 'RD' : 'TH';
  return (
    <span>
      {lvl}
      <sup className="text-[9px] ml-0.5">{suffix}</sup>
    </span>
  );
}

export function ClassSpellsPanel({
  sel,
  spells,
  allCompendiumSpells,
  books,
  cantripLimit,
  preparedLimit,
  knownLimit,
  maxSpellLevel,
  onUpdateSelection,
}: {
  sel: CharacterClassSelection;
  spells: Spell5e[];
  allCompendiumSpells: Spell5e[];
  books: Book5e[];
  cantripLimit: number;
  preparedLimit: number;
  knownLimit: number;
  maxSpellLevel: number;
  onUpdateSelection: (fn: (c: CharacterClassSelection) => CharacterClassSelection) => void;
}) {
  const filterId = useId();
  const [preparedOpen, setPreparedOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(true);
  const [levelFilterOpen, setLevelFilterOpen] = useState(true);
  const [sourceFilterOpen, setSourceFilterOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedSources, setSelectedSources] = useState<SourceCategory[]>([]);

  const isKnownOnly = knownLimit > 0 && preparedLimit === 0;
  const leveledList = isKnownOnly ? sel.knownSpells : sel.preparedSpells;
  const leveledSectionLabel = isKnownOnly ? 'Known Spells' : 'Prepared Spells';

  const selectedSpellObjects = useMemo(() => {
    const keys = [...sel.cantrips, ...leveledList];
    const items: Spell5e[] = [];
    for (const k of keys) {
      const found =
        spells.find((s) => makeEntityKey(s.name, s.source) === k) ||
        findSpell({ spells: allCompendiumSpells } as Parameters<typeof findSpell>[0], k);
      if (found) items.push(found);
    }
    return items.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [sel.cantrips, leveledList, spells, allCompendiumSpells]);

  const levelChoices = useMemo(() => {
    const levels: number[] = [];
    if (cantripLimit > 0 || spells.some((s) => s.level === 0)) {
      levels.push(0);
    }
    for (let l = 1; l <= maxSpellLevel; l++) {
      levels.push(l);
    }
    return levels;
  }, [cantripLimit, maxSpellLevel, spells]);

  const filteredSpells = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spells
      .filter((sp) => {
        if (q && !sp.name.toLowerCase().includes(q)) return false;
        if (selectedLevels.length > 0 && !selectedLevels.includes(sp.level)) return false;
        if (selectedSources.length > 0) {
          const is55e = isCore2024Spell(sp);
          const matchesCore = selectedSources.includes('5.5e-core') && is55e;
          const matchesExp = selectedSources.includes('5e-expanded') && !is55e;
          if (!matchesCore && !matchesExp) return false;
        }
        return true;
      })
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [spells, search, selectedLevels, selectedSources]);

  const toggleLevelFilter = (lvl: number) => {
    setSelectedLevels((prev) =>
      prev.includes(lvl) ? prev.filter((x) => x !== lvl) : [...prev, lvl],
    );
  };

  const toggleSourceFilter = (cat: SourceCategory) => {
    setSelectedSources((prev) =>
      prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat],
    );
  };

  const toggleSpellSelection = (sp: Spell5e) => {
    const key = makeEntityKey(sp.name, sp.source);
    const isCantrip = sp.level === 0;
    onUpdateSelection((c) => {
      if (isCantrip) {
        const exists = c.cantrips.includes(key);
        if (exists) return { ...c, cantrips: c.cantrips.filter((x) => x !== key) };
        if (cantripLimit > 0 && c.cantrips.length >= cantripLimit) return c;
        return { ...c, cantrips: [...c.cantrips, key] };
      }
      if (isKnownOnly) {
        const exists = c.knownSpells.includes(key);
        if (exists) return { ...c, knownSpells: c.knownSpells.filter((x) => x !== key) };
        if (knownLimit > 0 && c.knownSpells.length >= knownLimit) return c;
        return { ...c, knownSpells: [...c.knownSpells, key] };
      }
      const exists = c.preparedSpells.includes(key);
      if (exists) return { ...c, preparedSpells: c.preparedSpells.filter((x) => x !== key) };
      if (preparedLimit > 0 && c.preparedSpells.length >= preparedLimit) return c;
      return { ...c, preparedSpells: [...c.preparedSpells, key] };
    });
  };

  const getSpellSelectionState = (sp: Spell5e) => {
    const key = makeEntityKey(sp.name, sp.source);
    const isCantrip = sp.level === 0;
    const isSelected = isCantrip
      ? sel.cantrips.includes(key)
      : leveledList.includes(key);

    const actionLabel = isCantrip || isKnownOnly
      ? isSelected
        ? 'FORGET'
        : 'LEARN'
      : isSelected
        ? 'UNPREPARE'
        : 'PREPARE';

    const atCap = isCantrip
      ? cantripLimit > 0 && sel.cantrips.length >= cantripLimit
      : isKnownOnly
        ? knownLimit > 0 && sel.knownSpells.length >= knownLimit
        : preparedLimit > 0 && sel.preparedSpells.length >= preparedLimit;

    return { key, isSelected, actionLabel, disabled: !isSelected && atCap };
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Top Banner 1: Prepared Spells (N) / Known Spells (N) */}
      <div className="rounded-[2px] border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
        <button
          type="button"
          onClick={() => setPreparedOpen((v) => !v)}
          aria-expanded={preparedOpen}
          className="w-full px-4 py-3 flex items-center justify-between text-left bg-[var(--bg-card-alt)] hover:bg-white/[0.025] cursor-pointer transition"
        >
          <span className="font-bold text-[15px] text-[var(--text-primary)]">
            {leveledSectionLabel}{' '}
            <span className="text-xs font-mono-num font-semibold text-[var(--text-muted)]">
              ({selectedSpellObjects.length})
            </span>
          </span>
          {preparedOpen ? (
            <Minus className="w-5 h-5 text-[#78b856] stroke-[2.75]" />
          ) : (
            <Plus className="w-5 h-5 text-[#78b856] stroke-[2.75]" />
          )}
        </button>

        {preparedOpen && (
          <div className="p-3 border-t border-[var(--border-color)] space-y-2">
            {selectedSpellObjects.length === 0 ? (
              <div className="text-xs text-[var(--text-muted)] py-2">
                No spells selected yet. Learn cantrips or prepare spells from Add Spells below.
              </div>
            ) : (
              selectedSpellObjects.map((sp) => {
                const state = getSpellSelectionState(sp);
                return (
                  <SpellAccordionCard
                    key={`sel-${state.key}`}
                    spell={sp}
                    books={books}
                    actionLabel={state.actionLabel}
                    isSelected={state.isSelected}
                    onAction={() => toggleSpellSelection(sp)}
                  />
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Top Banner 2: Add Spells */}
      <div className="rounded-[2px] border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          aria-expanded={addOpen}
          className="w-full px-4 py-3 flex items-center justify-between text-left bg-[var(--bg-card-alt)] hover:bg-white/[0.025] cursor-pointer transition"
        >
          <span className="font-bold text-[15px] text-[var(--text-primary)]">Add Spells</span>
          {addOpen ? (
            <Minus className="w-5 h-5 text-[#78b856] stroke-[2.75]" />
          ) : (
            <Plus className="w-5 h-5 text-[#78b856] stroke-[2.75]" />
          )}
        </button>

        {addOpen && (
          <div className="p-3.5 border-t border-[var(--border-color)] space-y-4">
            {/* Cantrips / Prepared Spells Count Summary */}
            <div className="text-xs font-semibold text-[var(--text-primary)] space-y-0.5 leading-snug">
              {cantripLimit > 0 && (
                <div>
                  Cantrips: <span className="font-mono-num">{sel.cantrips.length}/{cantripLimit}</span>
                </div>
              )}
              {preparedLimit > 0 ? (
                <div>
                  Prepared Spells: <span className="font-mono-num">{sel.preparedSpells.length}/{preparedLimit}</span>
                </div>
              ) : knownLimit > 0 ? (
                <div>
                  Known Spells: <span className="font-mono-num">{sel.knownSpells.length}/{knownLimit}</span>
                </div>
              ) : null}
            </div>

            {/* Filter Input */}
            <div>
              <label
                htmlFor={filterId}
                className="block text-xs font-bold text-[var(--text-primary)] mb-1.5"
              >
                Filter
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id={filterId}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Enter Spell Name"
                  className="w-full pl-9 pr-3 py-2 rounded-[2px] bg-[var(--bg-input)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#5dbbf7]"
                />
              </div>
            </div>

            {/* Filter By Spell Level */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setLevelFilterOpen((v) => !v)}
                aria-expanded={levelFilterOpen}
                className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-primary)] cursor-pointer"
              >
                <span>Filter By Spell Level</span>
                {levelFilterOpen ? (
                  <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] rotate-180 transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                )}
              </button>
              {levelFilterOpen && (
                <div className="flex flex-wrap items-center gap-2">
                  {levelChoices.map((lvl) => {
                    const active = selectedLevels.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => toggleLevelFilter(lvl)}
                        aria-pressed={active}
                        className={`min-w-[44px] h-9 px-3 rounded-[2px] border text-xs font-extrabold uppercase tracking-wider flex items-center justify-center cursor-pointer transition ${
                          active
                            ? 'border-[#5dbbf7] bg-[#5dbbf7]/15 text-[#5dbbf7]'
                            : 'border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[#88bcd6]'
                        }`}
                      >
                        {renderLevelButtonContent(lvl)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter By Source Category */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSourceFilterOpen((v) => !v)}
                aria-expanded={sourceFilterOpen}
                className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-primary)] cursor-pointer"
              >
                <span>Filter By Source Category</span>
                {sourceFilterOpen ? (
                  <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] rotate-180 transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                )}
              </button>
              {sourceFilterOpen && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSourceFilter('5.5e-core')}
                    aria-pressed={selectedSources.includes('5.5e-core')}
                    className={`px-3.5 py-2 rounded-[2px] border text-[11px] font-extrabold uppercase tracking-wider cursor-pointer transition ${
                      selectedSources.includes('5.5e-core')
                        ? 'border-[#5dbbf7] bg-[#5dbbf7]/15 text-[#5dbbf7]'
                        : 'border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[#88bcd6]'
                    }`}
                  >
                    5.5E CORE RULES
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSourceFilter('5e-expanded')}
                    aria-pressed={selectedSources.includes('5e-expanded')}
                    className={`px-3.5 py-2 rounded-[2px] border text-[11px] font-extrabold uppercase tracking-wider cursor-pointer transition ${
                      selectedSources.includes('5e-expanded')
                        ? 'border-[#5dbbf7] bg-[#5dbbf7]/15 text-[#5dbbf7]'
                        : 'border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[#88bcd6]'
                    }`}
                  >
                    5E EXPANDED RULES
                  </button>
                </div>
              )}
            </div>

            {/* Spell List */}
            <div className="space-y-2 pt-1">
              {filteredSpells.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)] py-4 text-center border border-dashed border-[var(--border-color)] rounded">
                  No spells match the current filters.
                </div>
              ) : (
                filteredSpells.map((sp) => {
                  const state = getSpellSelectionState(sp);
                  return (
                    <SpellAccordionCard
                      key={state.key}
                      spell={sp}
                      books={books}
                      actionLabel={state.actionLabel}
                      isSelected={state.isSelected}
                      disabled={state.disabled}
                      onAction={() => toggleSpellSelection(sp)}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
