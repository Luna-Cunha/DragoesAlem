import { useId, useMemo, useState } from 'react';
import {
  Backpack,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  ScrollText,
  Search,
  Shield,
  Sparkles,
  Swords,
  Wand2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Item5e } from '../../types/5etools';
import type { Character, ComputedCharacter } from '../../types/character';
import {
  classifySourceCategory,
  isSourceAllowed,
  makeEntityKey,
  type SourceCategoryGroup,
} from '../../engine/rules';
import {
  ADD_ITEM_TYPE_FILTERS,
  formatCopperValue,
  getItemSubtitle,
  getItemTypeCategories,
  isItemCommon,
  isItemContainer,
  isItemMagical,
  isItemProficient,
  isLegacySourceCategory,
  type AddItemTypeFilter,
} from '../../services/equipmentHelpers';
import { RichEntries } from '../RichEntries';

const SOURCE_CATEGORY_FILTERS: { id: SourceCategoryGroup; label: string }[] = [
  { id: '5.5e-core', label: '5.5E CORE RULES' },
  { id: '5.5e-supplements', label: '5.5E EXPANDED RULES' },
  { id: '5e-core', label: '5E CORE RULES' },
  { id: '5e-supplements', label: '5E EXPANDED RULES' },
];

export function ItemBadgeIcon({ item, muted = false }: { item: Item5e; muted?: boolean }) {
  const cats = getItemTypeCategories(item);
  const primary = cats[0];
  let Icon = Backpack;
  if (primary === 'WEAPON') Icon = Swords;
  else if (primary === 'ARMOR') Icon = Shield;
  else if (primary === 'POTION') Icon = FlaskConical;
  else if (primary === 'SCROLL') Icon = ScrollText;
  else if (primary === 'STAFF' || primary === 'WAND' || primary === 'ROD') Icon = Wand2;
  else if (primary === 'RING' || primary === 'WONDROUS') Icon = Sparkles;

  return (
    <div
      className={`w-9 h-9 rounded-[2px] border flex items-center justify-center shrink-0 ${
        muted
          ? 'border-white/15 bg-[#1b1e24] text-[#d1d5db]'
          : 'border-[#2f4534] bg-[#1e3324] text-[#7ed38e]'
      }`}
    >
      <Icon className="w-5 h-5" />
    </div>
  );
}

export function AddItemsCatalog({
  character,
  computed,
  onAddItem,
  variant = 'builder',
  listMaxHeightClass = 'max-h-[540px]',
}: {
  character: Character;
  computed: ComputedCharacter;
  onAddItem: (item: Item5e) => void;
  variant?: 'builder' | 'sheet';
  listMaxHeightClass?: string;
}) {
  const { compendium } = useApp();
  const filterInputId = useId();

  const [search, setSearch] = useState('');
  const [typeFilterOpen, setTypeFilterOpen] = useState(true);
  const [sourceFilterOpen, setSourceFilterOpen] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<AddItemTypeFilter[]>([]);
  const [selectedSources, setSelectedSources] = useState<SourceCategoryGroup[]>([]);
  const [onlyProficient, setOnlyProficient] = useState(false);
  const [onlyCommon, setOnlyCommon] = useState(false);
  const [onlyMagical, setOnlyMagical] = useState(false);
  const [onlyContainer, setOnlyContainer] = useState(false);
  const [expandedItemKeys, setExpandedItemKeys] = useState<Record<string, boolean>>({});
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    if (!compendium) return { items: [], totalCount: 0 };
    const q = search.trim().toLowerCase();

    const matched = compendium.items
      .filter((it) => {
        if (
          !isSourceAllowed(
            it.source,
            character.preferences.enabledSources,
            character.preferences.ruleset,
            it.edition,
          )
        ) {
          return false;
        }
        if (q && !it.name.toLowerCase().includes(q)) return false;

        if (selectedTypes.length > 0) {
          const itemCats = getItemTypeCategories(it);
          if (!selectedTypes.some((t) => itemCats.includes(t))) return false;
        }

        if (selectedSources.length > 0) {
          const cat = classifySourceCategory(it, compendium.books);
          if (!selectedSources.includes(cat)) return false;
        }

        if (onlyProficient && !isItemProficient(it, computed)) return false;
        if (onlyCommon && !isItemCommon(it)) return false;
        if (onlyMagical && !isItemMagical(it)) return false;
        if (onlyContainer && !isItemContainer(it)) return false;

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source));

    return {
      items: matched.slice(0, 120),
      totalCount: matched.length,
    };
  }, [
    compendium,
    computed,
    search,
    character.preferences.enabledSources,
    character.preferences.ruleset,
    selectedTypes,
    selectedSources,
    onlyProficient,
    onlyCommon,
    onlyMagical,
    onlyContainer,
  ]);

  if (!compendium) return null;

  const isSheet = variant === 'sheet';
  const activeFilterBtnClass = isSheet
    ? 'border-[#8c3439] bg-[#2a191b] text-white'
    : 'border-[#5dbbf7] bg-[#5dbbf7]/15 text-[#5dbbf7]';
  const inactiveFilterBtnClass = isSheet
    ? 'border-white/20 bg-[#181b21] text-[#e5e7eb] hover:border-white/40'
    : 'border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[#88bcd6]';

  const toggleTypeFilter = (t: AddItemTypeFilter) => {
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const toggleSourceFilter = (id: SourceCategoryGroup) => {
    setSelectedSources((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const triggerAdd = (item: Item5e) => {
    const key = makeEntityKey(item.name, item.source);
    onAddItem(item);
    setJustAddedKey(key);
    window.setTimeout(() => {
      setJustAddedKey((cur) => (cur === key ? null : cur));
    }, 1200);
  };

  return (
    <div className="space-y-3.5">
      {/* Filter Search Input */}
      <div>
        <label
          htmlFor={filterInputId}
          className="block text-xs font-bold text-[var(--text-primary)] mb-1.5"
        >
          Filter
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id={filterInputId}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Weapon, Longsword, Vorpal Longsword, etc."
            className="w-full pl-9 pr-3 py-2 rounded-[2px] bg-[#0e1014] border border-white/20 text-sm text-white placeholder:text-[#7c848e] focus:outline-none focus:border-white/45"
          />
        </div>
      </div>

      {/* Filter By Type */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setTypeFilterOpen((v) => !v)}
          aria-expanded={typeFilterOpen}
          className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-primary)] cursor-pointer"
        >
          <span>Filter By Type</span>
          {typeFilterOpen ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] rotate-180 transition-transform" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
        </button>

        {typeFilterOpen && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {ADD_ITEM_TYPE_FILTERS.map((typeBtn) => {
                const active = selectedTypes.includes(typeBtn);
                return (
                  <button
                    key={typeBtn}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleTypeFilter(typeBtn)}
                    className={`px-1.5 py-1.5 rounded-[2px] border text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition ${
                      active ? activeFilterBtnClass : inactiveFilterBtnClass
                    }`}
                  >
                    {typeBtn}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-primary)]">
              {[
                { id: 'prof', label: 'Proficient', checked: onlyProficient, set: setOnlyProficient },
                { id: 'comm', label: 'Common', checked: onlyCommon, set: setOnlyCommon },
                { id: 'mag', label: 'Magical', checked: onlyMagical, set: setOnlyMagical },
                { id: 'cont', label: 'Container', checked: onlyContainer, set: setOnlyContainer },
              ].map((cb) => (
                <label key={cb.id} className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cb.checked}
                    onChange={(e) => cb.set(e.target.checked)}
                    className={`w-3.5 h-3.5 rounded-[2px] border border-[#6b7280] bg-[#101114] cursor-pointer ${
                      isSheet ? 'accent-[#7f292e]' : 'accent-[#1b9af0]'
                    }`}
                  />
                  <span>{cb.label}</span>
                </label>
              ))}
            </div>
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
          <div className="flex flex-wrap items-center gap-1.5">
            {SOURCE_CATEGORY_FILTERS.map((sc) => {
              const active = selectedSources.includes(sc.id);
              return (
                <button
                  key={sc.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSourceFilter(sc.id)}
                  className={`px-2.5 py-1.5 rounded-[2px] border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition ${
                    active ? activeFilterBtnClass : inactiveFilterBtnClass
                  }`}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filteredCatalog.totalCount > 120 && (
        <div className="text-[11px] text-[var(--text-muted)]">
          Showing first 120 of {filteredCatalog.totalCount} matching items — type a filter to narrow results.
        </div>
      )}

      {/* Results List */}
      <div className={`space-y-2 ${listMaxHeightClass} overflow-y-auto pr-1`}>
        {filteredCatalog.items.length === 0 ? (
          <div className="text-xs text-[var(--text-muted)] py-6 text-center border border-dashed border-white/15 rounded-[2px]">
            No items match the current filters.
          </div>
        ) : (
          filteredCatalog.items.map((item) => {
            const key = makeEntityKey(item.name, item.source);
            const isExpanded = Boolean(expandedItemKeys[key]);
            const isLegacy = isLegacySourceCategory(item, compendium);
            const isJustAdded = justAddedKey === key;

            return (
              <div
                key={key}
                className="rounded-[2px] border border-white/15 bg-[#191b1f] overflow-hidden"
              >
                <div className="px-3 py-2 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <ItemBadgeIcon item={item} muted={isSheet} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-white truncate">
                          {item.name}
                        </span>
                        {isLegacy && (
                          <span className="px-1.5 py-0.5 rounded-[2px] bg-[#2c2f36] text-[#9ca3af] text-[10px] font-semibold">
                            Legacy
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#9ca3af] truncate">
                        {getItemSubtitle(item)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => triggerAdd(item)}
                      aria-label={`Add ${item.name}`}
                      className={`px-2.5 py-1 rounded-[2px] border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition ${
                        isJustAdded
                          ? 'bg-[#1f8b4d] border-[#26a65b] text-white'
                          : isSheet
                            ? 'bg-[#2a191b] hover:bg-[#382124] border-[#8c3439] text-white'
                            : 'bg-[#262930] hover:bg-[#323640] border-[#3a3e47] text-[#e5e7eb]'
                      }`}
                    >
                      {isJustAdded ? 'ADDED' : 'ADD'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedItemKeys((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                      aria-expanded={isExpanded}
                      aria-label={`Toggle details for ${item.name}`}
                      className="p-1 text-[#9ca3af] hover:text-white cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3.5 py-2.5 border-t border-white/10 bg-[#131418] text-xs space-y-2">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#9ca3af]">
                      <span>
                        Source: <strong className="text-white">{item.source}</strong>
                      </span>
                      {item.value !== undefined && item.value > 0 && (
                        <span>
                          Cost: <strong className="text-white">{formatCopperValue(item.value)}</strong>
                        </span>
                      )}
                      {item.weight !== undefined && (
                        <span>
                          Weight: <strong className="text-white">{item.weight} lb</strong>
                        </span>
                      )}
                      {item.ac !== undefined && (
                        <span>
                          AC: <strong className="text-white">{item.ac}</strong>
                        </span>
                      )}
                      {item.dmg1 && (
                        <span>
                          Damage: <strong className="text-white">{item.dmg1} {item.dmgType || ''}</strong>
                        </span>
                      )}
                      {item.rarity && item.rarity !== 'none' && (
                        <span>
                          Rarity: <strong className="text-white capitalize">{item.rarity}</strong>
                        </span>
                      )}
                    </div>

                    {item.entries && item.entries.length > 0 && (
                      <RichEntries entries={item.entries} contextTitle={item.name} />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
