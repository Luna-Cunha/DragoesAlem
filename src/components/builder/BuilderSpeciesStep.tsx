import { useMemo, useState } from 'react';
import { RefreshCw, Search, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AbilityKey, Race5e } from '../../types/5etools';
import type { Character } from '../../types/character';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  ARTISAN_TOOL_LIST,
  GENERAL_TOOL_LIST,
  MUSICAL_INSTRUMENT_LIST,
  STANDARD_SKILLS,
  findBackground,
  findFeat,
  findRace,
  getAvailableSpellsForClass,
  getExistingProficienciesExcludingRaceChoices,
  getFixedRacialBonuses,
  groupBySourceCategory,
  isSourceAllowed,
  makeEntityKey,
  shouldHideSpeciesAsi,
} from '../../engine/rules';
import type { EntryNode, Spell5e } from '../../types/5etools';
import { ExpandableEntries, RichEntries } from '../RichEntries';
import { CollapsibleBox } from '../CollapsibleBox';
import { OriginFeatSelector } from './OriginFeatSelector';

const SIZE_LABELS: Record<string, string> = {
  T: 'Tiny',
  S: 'Small',
  M: 'Medium',
  L: 'Large',
};

const FALLBACK_STANDARD_LANGUAGES = [
  'Abyssal',
  'Celestial',
  'Deep Speech',
  'Draconic',
  'Dwarvish',
  'Elvish',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Infernal',
  'Orc',
  'Primordial',
  'Sylvan',
  'Undercommon',
];

function formatTitleCase(raw: string): string {
  return raw.replace(/\b\w/g, (l) => l.toUpperCase());
}

function extractEntryAncestries(entries: EntryNode[] | undefined): { title: string; options: string[] } | null {
  if (!entries) return null;
  for (const node of entries) {
    if (!node || typeof node !== 'object' || !Array.isArray(node.entries)) continue;
    const nodeName = node.name || '';
    const lowerName = nodeName.toLowerCase();
    if (!lowerName.includes('ancestry') && !lowerName.includes('lineage') && !lowerName.includes('legacy')) {
      continue;
    }
    for (const child of node.entries) {
      if (child && typeof child === 'object' && child.type === 'table' && Array.isArray(child.rows)) {
        const opts = child.rows
          .map((row) => {
            const first = typeof row[0] === 'string' ? row[0].trim() : '';
            const second = typeof row[1] === 'string' ? row[1].trim() : '';
            if (!first) return '';
            return second && !second.includes(' ') ? `${first} (${second})` : first;
          })
          .filter(Boolean);
        if (opts.length > 1) return { title: nodeName, options: opts };
      }
      if (child && typeof child === 'object' && child.type === 'list' && Array.isArray(child.items)) {
        const opts = child.items
          .map((item) => (typeof item === 'object' && item && item.name ? item.name.replace(/\.$/, '').trim() : ''))
          .filter(Boolean);
        if (opts.length > 1) return { title: nodeName, options: opts };
      }
    }
  }
  return null;
}

function parseSpeciesSkillConfig(race: Race5e | undefined): { count: number; from: string[] } | null {
  if (!race?.skillProficiencies?.length) return null;
  let count = 0;
  const fromSet = new Set<string>();
  const allNames = STANDARD_SKILLS.map((s) => s.name);

  for (const entry of race.skillProficiencies) {
    if (entry.choose?.from?.length) {
      count += entry.choose.count || 1;
      for (const s of entry.choose.from) fromSet.add(formatTitleCase(s));
    }
    if (typeof entry.any === 'number' && entry.any > 0) {
      count += entry.any;
      for (const s of allNames) fromSet.add(s);
    }
  }
  if (count === 0 || fromSet.size === 0) return null;
  return { count, from: [...fromSet].sort((a, b) => a.localeCompare(b)) };
}

function parseSpeciesToolConfig(race: Race5e | undefined): { count: number; from: string[] } | null {
  if (!race?.toolProficiencies?.length) return null;
  let count = 0;
  const fromSet = new Set<string>();

  for (const entry of race.toolProficiencies) {
    const choose = entry.choose as { from?: string[]; count?: number } | undefined;
    if (choose?.from?.length) {
      count += choose.count || 1;
      for (const t of choose.from) fromSet.add(formatTitleCase(t));
    }
    if (typeof entry.any === 'number' && entry.any > 0) {
      count += entry.any;
      for (const t of GENERAL_TOOL_LIST) fromSet.add(t);
    }
    if (typeof entry.anyArtisansTool === 'number' && entry.anyArtisansTool > 0) {
      count += entry.anyArtisansTool;
      for (const t of ARTISAN_TOOL_LIST) fromSet.add(t);
    }
    if (typeof entry.anyMusicalInstrument === 'number' && entry.anyMusicalInstrument > 0) {
      count += entry.anyMusicalInstrument;
      for (const t of MUSICAL_INSTRUMENT_LIST) fromSet.add(t);
    }
  }
  if (count === 0 || fromSet.size === 0) return null;
  return { count, from: [...fromSet] };
}

function parseSpeciesLangConfig(race: Race5e | undefined, languageNames: string[]): { count: number; from: string[] } | null {
  if (!race?.languageProficiencies?.length) return null;
  let count = 0;
  const fromSet = new Set<string>();

  for (const entry of race.languageProficiencies) {
    const choose = entry.choose as { from?: string[]; count?: number } | undefined;
    if (choose?.from?.length) {
      count += choose.count || 1;
      for (const l of choose.from) fromSet.add(formatTitleCase(l));
    }
    const anyCount =
      (typeof entry.anyStandard === 'number' ? entry.anyStandard : 0) +
      (typeof entry.any === 'number' ? entry.any : 0);
    if (anyCount > 0) {
      count += anyCount;
      for (const l of languageNames) fromSet.add(l);
    }
  }
  if (count === 0 || fromSet.size === 0) return null;
  return { count, from: [...fromSet].sort((a, b) => a.localeCompare(b)) };
}

function extractCantripChoiceFilter(race: Race5e | undefined, lineageChoice: string | undefined): string[] | null {
  if (!race?.additionalSpells?.length) return null;
  const activeBlock =
    (lineageChoice && race.additionalSpells.find((s) => s.name?.toLowerCase() === lineageChoice.toLowerCase())) ||
    race.additionalSpells[0];
  if (!activeBlock) return null;
  const rawJson = JSON.stringify(activeBlock.known || activeBlock.prepared || {});
  const m = rawJson.match(/level=0\|class=([^"\\}]+)/i);
  if (!m) return null;
  return m[1]
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

function SpeciesMultiChoiceBox({
  title,
  count,
  selected,
  options,
  excludedSet,
  labelPrefix,
  placeholder,
  onUpdate,
}: {
  title: string;
  count: number;
  selected: string[];
  options: string[];
  excludedSet?: Set<string>;
  labelPrefix: string;
  placeholder: string;
  onUpdate: (next: string[]) => void;
}) {
  return (
    <CollapsibleBox
      title={title}
      subtitle={`Choose ${count} (${selected.length}/${count})`}
      badge={`${selected.length}/${count}`}
      alertDot={selected.length < count}
      accent="blue"
      defaultOpen
    >
      <div className="space-y-2">
        {Array.from({ length: count }, (_, idx) => {
          const currentVal = selected[idx] || '';
          const usedElsewhere = new Set(selected.filter((_, i) => i !== idx));
          return (
            <select
              key={idx}
              aria-label={`${labelPrefix} ${idx + 1}`}
              value={currentVal}
              onChange={(e) => {
                const next = [...selected];
                next[idx] = e.target.value;
                onUpdate(next.filter(Boolean));
              }}
              className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
            >
              <option value="">{placeholder}</option>
              {options
                .filter((opt) => {
                  if (opt === currentVal) return true;
                  return !usedElsewhere.has(opt) && !excludedSet?.has(opt.toLowerCase());
                })
                .map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
            </select>
          );
        })}
      </div>
    </CollapsibleBox>
  );
}

export function BuilderSpeciesStep({
  character,
  onChange,
}: {
  character: Character;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const { compendium } = useApp();
  const [search, setSearch] = useState('');
  const [changingSpecies, setChangingSpecies] = useState(false);
  const [previewSpecies, setPreviewSpecies] = useState<Race5e | null>(null);

  const races = useMemo(() => {
    if (!compendium) return [];
    const q = search.trim().toLowerCase();
    return compendium.races
      .filter((r) => {
        if (!isSourceAllowed(r.source, character.preferences.enabledSources, character.preferences.ruleset, r.edition)) {
          return false;
        }
        return !q || r.name.toLowerCase().includes(q) || r.source.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [compendium, search, character.preferences]);

  const groupedRaces = useMemo(() => {
    if (!compendium) return [];
    const groups = groupBySourceCategory(races, compendium.books);
    return groups.map((grp) => {
      const isSupplement = grp.id === '5.5e-supplements' || grp.id === '5e-supplements';
      const byBookMap = new Map<string, Race5e[]>();
      if (isSupplement) {
        for (const r of grp.items) {
          const arr = byBookMap.get(r.source) || [];
          arr.push(r);
          byBookMap.set(r.source, arr);
        }
      }
      const byBook = [...byBookMap.entries()]
        .map(([src, items]) => {
          const book = compendium.books.find((b) => b.source === src);
          return { bookName: book?.name || src, source: src, items };
        })
        .sort((a, b) => a.bookName.localeCompare(b.bookName));
      return { ...grp, isSupplement, byBook };
    });
  }, [races, compendium]);

  const existingProfs = useMemo(
    () => (compendium ? getExistingProficienciesExcludingRaceChoices(character, compendium) : null),
    [character, compendium],
  );

  if (!compendium || !existingProfs) return null;

  const excludedSpeciesSkills = new Set([
    ...existingProfs.skills,
    ...(character.race.originFeatChoices?.skills || []).map((s) => s.toLowerCase()),
  ]);
  const excludedSpeciesTools = new Set([
    ...existingProfs.tools,
    ...(character.race.originFeatChoices?.tools || []).map((t) => t.toLowerCase()),
  ]);
  const excludedSpeciesLanguages = new Set([
    ...existingProfs.languages,
    ...(character.race.originFeatChoices?.languages || []).map((l) => l.toLowerCase()),
  ]);
  const excludedRaceFeatSkills = new Set([
    ...existingProfs.skills,
    ...character.race.chosenSkills.map((s) => s.toLowerCase()),
  ]);

  const selectedRace = findRace(compendium, character.race.raceKey);
  const selectedBg = findBackground(compendium, character.background.backgroundKey);
  const hideSpeciesAsi = shouldHideSpeciesAsi(character, selectedRace, selectedBg);

  const fixedBonuses = getFixedRacialBonuses(selectedRace);
  const hasFixedAsi = Object.keys(fixedBonuses).length > 0;
  const spellLineages = (selectedRace?.additionalSpells || []).filter((s) => Boolean(s.name)).map((s) => s.name!);
  const entryAncestry = spellLineages.length === 0 ? extractEntryAncestries(selectedRace?.entries) : null;
  const lineageOptions = spellLineages.length > 0 ? spellLineages : entryAncestry?.options || [];
  const lineageBoxTitle = spellLineages.length > 0 ? 'Lineage / Heritage Option' : entryAncestry?.title || 'Ancestry Option';

  const skillConfig = parseSpeciesSkillConfig(selectedRace);
  const toolConfig = parseSpeciesToolConfig(selectedRace);
  const languageNames = useMemo(() => {
    const allowed = compendium.languages
      .filter((l) => isSourceAllowed(l.source, character.preferences.enabledSources, character.preferences.ruleset))
      .map((l) => l.name);
    const merged = new Set<string>(allowed);
    if (allowed.length <= 2) {
      for (const fallbackLang of FALLBACK_STANDARD_LANGUAGES) merged.add(fallbackLang);
    }
    return [...merged].sort((a, b) => a.localeCompare(b));
  }, [compendium.languages, character.preferences]);

  const parsedLangConfig = parseSpeciesLangConfig(selectedRace, languageNames);
  const is2024SpeciesLanguages =
    Boolean(selectedRace) &&
    (character.preferences.ruleset === '2024' || selectedRace?.edition === 'one');
  const langConfig =
    parsedLangConfig || is2024SpeciesLanguages
      ? {
          count: is2024SpeciesLanguages
            ? Math.max(2, parsedLangConfig?.count || 0)
            : parsedLangConfig?.count || 0,
          from:
            parsedLangConfig && parsedLangConfig.from.length > 0 && !is2024SpeciesLanguages
              ? parsedLangConfig.from
              : [...new Set([...(parsedLangConfig?.from || []), ...languageNames])].sort((a, b) =>
                  a.localeCompare(b),
                ),
        }
      : null;

  const raceFeatSpec = selectedRace?.feats?.[0] as
    | { any?: number; anyFromCategory?: { category?: string[]; count?: number } }
    | undefined;
  const hasSpeciesFeatChoice = Boolean(raceFeatSpec && (raceFeatSpec.any || raceFeatSpec.anyFromCategory));
  const speciesFeatAllowAny = Boolean(raceFeatSpec?.any && !raceFeatSpec?.anyFromCategory);
  const activeSpeciesFeat = character.race.originFeatKey
    ? findFeat(compendium, character.race.originFeatKey)
    : undefined;

  const cantripClasses = extractCantripChoiceFilter(selectedRace, character.race.lineageChoice);
  const innateCantripPool: Spell5e[] = useMemo(() => {
    if (!cantripClasses?.length) return [];
    const byName = new Map<string, Spell5e>();
    for (const clsName of cantripClasses) {
      const list = getAvailableSpellsForClass(
        compendium,
        clsName,
        character.preferences.ruleset === '2014' ? 'PHB' : 'XPHB',
        undefined,
        undefined,
        0,
        character.preferences.enabledSources,
        character.preferences.ruleset,
      );
      for (const sp of list) {
        if (sp.level === 0 && !byName.has(sp.name.toLowerCase())) {
          byName.set(sp.name.toLowerCase(), sp);
        }
      }
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [cantripClasses, compendium, character.preferences]);

  const confirmChooseSpecies = (race: Race5e) => {
    const key = makeEntityKey(race.name, race.source);
    const defaultSize = race.size && race.size.length === 1 ? SIZE_LABELS[race.size[0]] || race.size[0] : undefined;
    const hideAsiForRace = shouldHideSpeciesAsi(character, race, selectedBg);
    onChange((p) => ({
      ...p,
      race: {
        ...p.race,
        raceKey: key,
        sizeChoice: defaultSize,
        chosenSkills: [],
        chosenTools: [],
        chosenLanguages: [],
        chosenInnateCantrip: undefined,
        originFeatKey: undefined,
        originFeatChoices: {},
        abilityBonuses: {},
        abilityMode: hideAsiForRace
          ? 'none'
          : race.ability?.length
            ? 'fixed'
            : 'floating_2_1',
        lineageChoice: race.additionalSpells?.find((s) => s.name)?.name,
      },
    }));
    setPreviewSpecies(null);
    setChangingSpecies(false);
  };

  const showSelectionList = !selectedRace || changingSpecies;

  return (
    <div className="space-y-6">
      {/* Selected Species View (after choosing) */}
      {selectedRace && !showSelectionList && (
        <div className="ddb-card ddb-card-accent p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-extrabold">{selectedRace.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
                  {selectedRace.source}
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                Size: <strong>{(selectedRace.size || ['M']).join(' or ')}</strong> · Speed:{' '}
                <strong>
                  {typeof selectedRace.speed === 'number' ? `${selectedRace.speed} ft.` : `${selectedRace.speed?.walk || 30} ft.`}
                </strong>
                {selectedRace.darkvision ? ` · Darkvision ${selectedRace.darkvision} ft.` : ''}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setChangingSpecies(true)}
              className="px-4 py-2 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-[#1b9af0] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Change Species
            </button>
          </div>

          {/* Species Options in Collapsible Boxes */}
          <div className="space-y-3">
            {selectedRace.size && selectedRace.size.length > 1 && (
              <CollapsibleBox
                title="Size Option"
                subtitle={character.race.sizeChoice || 'Choose a size'}
                badge="Choice"
                alertDot={!character.race.sizeChoice}
                accent="blue"
                defaultOpen
              >
                <div className="flex flex-wrap gap-2">
                  {selectedRace.size.map((szCode) => {
                    const label = SIZE_LABELS[szCode] || szCode;
                    const active = character.race.sizeChoice === label;
                    return (
                      <button
                        key={szCode}
                        type="button"
                        onClick={() =>
                          onChange((p) => ({ ...p, race: { ...p.race, sizeChoice: label } }))
                        }
                        className={`px-3 py-1.5 rounded text-xs font-bold border cursor-pointer ${
                          active
                            ? 'bg-[#1b9af0] text-white border-[#1b9af0]'
                            : 'bg-[var(--bg-card-alt)] border-[var(--border-color)]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </CollapsibleBox>
            )}

            {lineageOptions.length > 0 && (
              <CollapsibleBox
                title={lineageBoxTitle}
                subtitle={character.race.lineageChoice || 'Choose an option'}
                badge="Choice"
                alertDot={!character.race.lineageChoice}
                accent="blue"
                defaultOpen
              >
                <div className="flex flex-wrap gap-2">
                  {lineageOptions.map((lin) => (
                    <button
                      key={lin}
                      type="button"
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          race: { ...p.race, lineageChoice: lin, chosenInnateCantrip: undefined },
                        }))
                      }
                      className={`px-3 py-1.5 rounded text-xs font-bold border cursor-pointer ${
                        character.race.lineageChoice === lin
                          ? 'bg-[#1b9af0] text-white border-[#1b9af0]'
                          : 'bg-[var(--bg-card-alt)] border-[var(--border-color)]'
                      }`}
                    >
                      {lin}
                    </button>
                  ))}
                </div>
              </CollapsibleBox>
            )}

            {skillConfig && (
              <SpeciesMultiChoiceBox
                title="Species Skill Proficiency"
                count={skillConfig.count}
                selected={character.race.chosenSkills}
                options={skillConfig.from}
                excludedSet={excludedSpeciesSkills}
                labelPrefix="Species Skill Proficiency"
                placeholder="- Choose a Skill Proficiency -"
                onUpdate={(next) => onChange((p) => ({ ...p, race: { ...p.race, chosenSkills: next } }))}
              />
            )}

            {hasSpeciesFeatChoice && (
              <CollapsibleBox
                title={speciesFeatAllowAny ? 'Species Bonus Feat' : 'Species Origin Feat'}
                subtitle={
                  activeSpeciesFeat
                    ? `${activeSpeciesFeat.name} (${activeSpeciesFeat.source})`
                    : speciesFeatAllowAny
                      ? 'Choose a feat'
                      : 'Choose an Origin Feat'
                }
                badge="Feat"
                alertDot={!character.race.originFeatKey}
                accent="blue"
                defaultOpen
              >
                <OriginFeatSelector
                  compendium={compendium}
                  character={character}
                  featKey={character.race.originFeatKey}
                  featChoices={character.race.originFeatChoices}
                  allowAnyCategory={speciesFeatAllowAny}
                  featSlot="species-feat"
                  excludedSkills={excludedRaceFeatSkills}
                  selectAriaLabel="Species Origin Feat"
                  placeholder={speciesFeatAllowAny ? '-- Select Feat --' : '-- Select Origin Feat --'}
                  onChangeFeatKey={(nextKey) =>
                    onChange((p) => ({
                      ...p,
                      race: {
                        ...p.race,
                        originFeatKey: nextKey,
                        originFeatChoices: {},
                      },
                    }))
                  }
                  onChangeFeatChoices={(nextChoices) =>
                    onChange((p) => ({
                      ...p,
                      race: {
                        ...p.race,
                        originFeatChoices: nextChoices,
                      },
                    }))
                  }
                />
              </CollapsibleBox>
            )}

            {toolConfig && (
              <SpeciesMultiChoiceBox
                title="Species Tool Proficiency"
                count={toolConfig.count}
                selected={character.race.chosenTools}
                options={toolConfig.from}
                excludedSet={excludedSpeciesTools}
                labelPrefix="Species Tool Proficiency"
                placeholder="- Choose a Tool Proficiency -"
                onUpdate={(next) => onChange((p) => ({ ...p, race: { ...p.race, chosenTools: next } }))}
              />
            )}

            {langConfig && langConfig.count > 0 && (
              <SpeciesMultiChoiceBox
                title={is2024SpeciesLanguages ? 'Species Languages (Common + 2 Additional)' : 'Species Languages'}
                count={langConfig.count}
                selected={character.race.chosenLanguages}
                options={langConfig.from}
                excludedSet={excludedSpeciesLanguages}
                labelPrefix="Species Language"
                placeholder="- Choose an Additional Language -"
                onUpdate={(next) => onChange((p) => ({ ...p, race: { ...p.race, chosenLanguages: next } }))}
              />
            )}

            {innateCantripPool.length > 0 && (
              <CollapsibleBox
                title="Innate Cantrip Choice"
                subtitle={character.race.chosenInnateCantrip || 'Choose 1 cantrip'}
                badge="Choice"
                alertDot={!character.race.chosenInnateCantrip}
                accent="blue"
                defaultOpen
              >
                <select
                  aria-label="Species Innate Cantrip"
                  value={character.race.chosenInnateCantrip || ''}
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      race: { ...p.race, chosenInnateCantrip: e.target.value || undefined },
                    }))
                  }
                  className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                >
                  <option value="">- Choose a Cantrip -</option>
                  {innateCantripPool.map((sp) => {
                    const k = makeEntityKey(sp.name, sp.source);
                    return (
                      <option key={k} value={k}>
                        {sp.name} ({sp.source})
                      </option>
                    );
                  })}
                </select>
              </CollapsibleBox>
            )}

            {!hideSpeciesAsi && (hasFixedAsi || character.preferences.ruleset !== '2024') && (
              <CollapsibleBox
                title="Ability Score Increases"
                subtitle={`Mode: ${character.race.abilityMode}`}
                badge="Options"
                accent="blue"
                defaultOpen
              >
                <div className="space-y-3">
                  <select
                    value={character.race.abilityMode}
                    onChange={(e) =>
                      onChange((p) => ({
                        ...p,
                        race: {
                          ...p.race,
                          abilityMode: e.target.value as Character['race']['abilityMode'],
                          abilityBonuses: {},
                        },
                      }))
                    }
                    className="px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs font-semibold"
                  >
                    {hasFixedAsi && <option value="fixed">Classic Fixed Species Bonuses</option>}
                    <option value="floating_2_1">Flexible (+2 / +1)</option>
                    <option value="floating_1_1_1">Flexible (+1 / +1 / +1)</option>
                    <option value="none">None (Using 2024 Background ASIs)</option>
                  </select>

                  {character.race.abilityMode === 'fixed' && hasFixedAsi && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      Applied:{' '}
                      {Object.entries(fixedBonuses)
                        .map(([k, v]) => `${k.toUpperCase()} +${v}`)
                        .join(', ')}
                    </div>
                  )}

                  {(character.race.abilityMode === 'floating_2_1' || character.race.abilityMode === 'floating_1_1_1') && (
                    <div className="flex flex-wrap gap-2">
                      {ABILITY_KEYS.map((ab) => {
                        const val = character.race.abilityBonuses[ab] || 0;
                        const maxPer = character.race.abilityMode === 'floating_2_1' ? 2 : 1;
                        const total = ABILITY_KEYS.reduce((s, k) => s + (character.race.abilityBonuses[k] || 0), 0);
                        return (
                          <div key={ab} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)] text-xs">
                            <span className="font-bold">{ABILITY_LABELS[ab].short}</span>
                            <button
                              type="button"
                              disabled={val <= 0}
                              onClick={() =>
                                onChange((p) => ({
                                  ...p,
                                  race: {
                                    ...p.race,
                                    abilityBonuses: { ...p.race.abilityBonuses, [ab]: Math.max(0, val - 1) },
                                  },
                                }))
                              }
                              className="w-5 h-5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-bold cursor-pointer disabled:opacity-30"
                            >
                              -
                            </button>
                            <span className="font-mono-num font-bold w-4 text-center">+{val}</span>
                            <button
                              type="button"
                              disabled={val >= maxPer || total >= 3}
                              onClick={() =>
                                onChange((p) => ({
                                  ...p,
                                  race: {
                                    ...p.race,
                                    abilityBonuses: { ...p.race.abilityBonuses, [ab]: val + 1 },
                                  },
                                }))
                              }
                              className="w-5 h-5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-bold cursor-pointer disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CollapsibleBox>
            )}

            {selectedRace.additionalSpells?.some((s) => typeof s.ability === 'object') && (
              <CollapsibleBox
                title="Innate Spellcasting Ability"
                subtitle={`Current: ${(character.race.innateSpellAbility || 'cha').toUpperCase()}`}
                badge="Choice"
                accent="blue"
                defaultOpen
              >
                <select
                  value={character.race.innateSpellAbility || 'cha'}
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      race: { ...p.race, innateSpellAbility: e.target.value as AbilityKey },
                    }))
                  }
                  className="px-3 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs font-semibold"
                >
                  <option value="int">Intelligence</option>
                  <option value="wis">Wisdom</option>
                  <option value="cha">Charisma</option>
                </select>
              </CollapsibleBox>
            )}

            {/* Collapsible Species Traits */}
            <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)] pt-2">
              Species Traits
            </div>
            {(selectedRace.entries || []).map((entry, idx) => {
              if (typeof entry === 'string') {
                return (
                  <CollapsibleBox key={`trait-${idx}`} title="Overview" defaultOpen>
                    <RichEntries entries={[entry]} contextTitle={selectedRace.name} />
                  </CollapsibleBox>
                );
              }
              if (entry && typeof entry === 'object' && entry.name) {
                return (
                  <CollapsibleBox key={`trait-${entry.name}-${idx}`} title={entry.name} defaultOpen={idx < 2}>
                    <RichEntries
                      entries={entry.entries || (entry.entry ? [entry.entry] : [])}
                      contextTitle={entry.name}
                    />
                  </CollapsibleBox>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Species List Separated by Core Books & Supplements */}
      {showSelectionList && (
        <div className="ddb-card ddb-card-accent p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#e40712]" />
                Choose a Species
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Separated into 5.5e Core, 5.5e Supplements, 5e Core, and 5e Supplements. Click a species to inspect its traits.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search species / races..."
                  className="w-full pl-9 pr-3 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs"
                />
              </div>
              {selectedRace && (
                <button
                  type="button"
                  onClick={() => setChangingSpecies(false)}
                  className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {groupedRaces.length === 0 ? (
            <div className="text-xs text-[var(--text-muted)] py-6 text-center border border-dashed border-[var(--border-color)] rounded">
              No species match your search and active sourcebooks.
            </div>
          ) : (
            groupedRaces.map((grp) => {
              const renderCard = (race: Race5e) => (
                <button
                  key={`${race.name}|${race.source}`}
                  type="button"
                  onClick={() => setPreviewSpecies(race)}
                  className="p-3.5 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-[#1b9af0] text-left transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold text-sm group-hover:text-[#1b9af0]">
                      {race.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border-color)]">
                      {race.source}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                    Speed: {typeof race.speed === 'number' ? race.speed : race.speed?.walk || 30} ft.
                    {race.darkvision ? ` · Darkvision ${race.darkvision} ft.` : ''}
                  </div>
                </button>
              );

              return (
                <div key={grp.id} className="space-y-3">
                  <div
                    className={`text-xs font-extrabold uppercase tracking-wider border-b border-[var(--border-color)] pb-1 flex items-center justify-between ${
                      grp.id === '5.5e-core'
                        ? 'text-[#e40712]'
                        : grp.id === '5e-core'
                          ? 'text-[#5dbbf7]'
                          : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <span>{grp.label}</span>
                    <span className="font-mono-num text-[10px] text-[var(--text-muted)]">{grp.items.length}</span>
                  </div>

                  {!grp.isSupplement ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {grp.items.map(renderCard)}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {grp.byBook.map((bookGrp) => (
                        <div key={bookGrp.source} className="space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            {bookGrp.bookName} ({bookGrp.source})
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {bookGrp.items.map(renderCard)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* D&D Beyond "CONFIRM ADD SPECIES" Modal */}
      {previewSpecies && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Confirm Add ${previewSpecies.name}`}>
          <div className="fixed inset-0 bg-black/75" onClick={() => setPreviewSpecies(null)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] rounded bg-[var(--bg-page)] border border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-[#1d2226] text-white flex items-center justify-between border-b border-[var(--border-color)]">
              <h3 className="font-bold text-base uppercase tracking-wide">CONFIRM ADD SPECIES</h3>
              <button
                type="button"
                onClick={() => setPreviewSpecies(null)}
                className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <h4 className="text-2xl font-normal text-[var(--text-primary)] leading-tight">
                  {previewSpecies.name}
                </h4>
                <div className="text-xs italic text-[var(--text-secondary)] mt-1">
                  {compendium.books.find((b) => b.source === previewSpecies.source)?.name || previewSpecies.source}
                </div>
              </div>

              <div className="space-y-1 text-sm text-[var(--text-primary)]">
                <div>
                  <strong className="font-bold">Size:</strong> {(previewSpecies.size || ['M']).join(' or ')}
                </div>
                <div>
                  <strong className="font-bold">Speed:</strong>{' '}
                  {typeof previewSpecies.speed === 'number'
                    ? `${previewSpecies.speed} ft.`
                    : `${previewSpecies.speed?.walk || 30} ft.`}
                </div>
                {previewSpecies.darkvision && (
                  <div>
                    <strong className="font-bold">Senses:</strong> Darkvision {previewSpecies.darkvision} ft.
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border-color)] pt-3 space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                  Species Traits
                </div>
                {(previewSpecies.entries || []).map((entry, idx) => {
                  if (typeof entry === 'string') {
                    return (
                      <CollapsibleBox
                        key={`sp-trait-${idx}`}
                        title="Overview"
                        accent="plain"
                        bodyClassName="mx-3 mb-3 p-3.5 border border-[#6b7280]/70 bg-[var(--bg-card)]"
                      >
                        <ExpandableEntries entries={[entry]} contextTitle={previewSpecies.name} />
                      </CollapsibleBox>
                    );
                  }
                  if (entry && typeof entry === 'object' && entry.name) {
                    return (
                      <CollapsibleBox
                        key={`sp-trait-${entry.name}-${idx}`}
                        title={entry.name}
                        accent="plain"
                        bodyClassName="mx-3 mb-3 p-3.5 border border-[#6b7280]/70 bg-[var(--bg-card)]"
                      >
                        <ExpandableEntries
                          entries={entry.entries || (entry.entry ? [entry.entry] : [])}
                          contextTitle={entry.name}
                        />
                      </CollapsibleBox>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setPreviewSpecies(null)}
                className="py-3.5 bg-[#6e767e] hover:bg-[#5c636a] text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer transition"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => confirmChooseSpecies(previewSpecies)}
                className="py-3.5 bg-[#5cb85c] hover:bg-[#4ca64c] text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer transition"
              >
                CHOOSE SPECIES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
