import { useMemo } from 'react';
import { Dices, ScrollText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AbilityKey, EntryNode } from '../../types/5etools';
import type { Character } from '../../types/character';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  findBackground,
  findFeat,
  groupBySourceCategory,
  isSourceAllowed,
  makeEntityKey,
  resolveBackgroundProficiencyState,
} from '../../engine/rules';
import { stripFiveToolsTags } from '../../services/fiveToolsText';
import { RichEntries } from '../RichEntries';
import { CollapsibleBox } from '../CollapsibleBox';
import { OriginFeatSelector } from './OriginFeatSelector';

const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
  'Unaligned',
];

function extractCharacteristicTables(entries: EntryNode[] | undefined) {
  const result: { label: string; rows: string[] }[] = [];
  if (!entries) return result;
  for (const node of entries) {
    if (typeof node === 'object' && node !== null && node.type === 'entries' && node.entries) {
      for (const child of node.entries) {
        if (typeof child === 'object' && child !== null && child.type === 'table' && Array.isArray(child.rows)) {
          const label = child.colLabels?.[1] ? stripFiveToolsTags(child.colLabels[1]) : child.caption || 'Table';
          const rows = child.rows
            .map((r) => (typeof r[1] === 'string' ? stripFiveToolsTags(r[1]) : ''))
            .filter(Boolean);
          if (rows.length > 0) result.push({ label, rows });
        }
      }
    }
  }
  return result;
}

export function BuilderBackgroundStep({
  character,
  onChange,
}: {
  character: Character;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const { compendium } = useApp();

  const backgrounds = useMemo(() => {
    if (!compendium) return [];
    return compendium.backgrounds
      .filter((b) => isSourceAllowed(b.source, character.preferences.enabledSources, character.preferences.ruleset, b.edition))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [compendium, character.preferences]);

  const groupedBackgrounds = useMemo(
    () => groupBySourceCategory(backgrounds, compendium?.books),
    [backgrounds, compendium?.books],
  );

  if (!compendium) return null;

  const selectedBg = findBackground(compendium, character.background.backgroundKey);
  const bgProfState = useMemo(
    () => resolveBackgroundProficiencyState(character, compendium),
    [character, compendium],
  );
  const bgAbilityPool: AbilityKey[] = (() => {
    const weighted = selectedBg?.ability?.find((a) => a.choose?.weighted)?.choose?.weighted?.from;
    if (weighted && weighted.length > 0 && !character.preferences.tashaOriginAbilityOverride) {
      return weighted;
    }
    return ABILITY_KEYS;
  })();

  const defaultFeatKey = selectedBg?.feats?.[0] ? Object.keys(selectedBg.feats[0])[0] : undefined;
  const activeFeatKey = character.background.originFeatKey || (defaultFeatKey ? defaultFeatKey.replace(';', ' ') : undefined);
  const activeFeat = activeFeatKey
    ? findFeat(compendium, activeFeatKey.includes('|') ? activeFeatKey : `${activeFeatKey}|XPHB`) ||
      compendium.feats.find((f) => activeFeatKey.toLowerCase().startsWith(f.name.toLowerCase()))
    : undefined;

  const selectBackground = (key: string) => {
    if (!key) {
      onChange((prev) => ({
        ...prev,
        background: {
          ...prev.background,
          backgroundKey: undefined,
          chosenSkills: [],
          chosenTools: [],
          chosenLanguages: [],
          originFeatKey: undefined,
          originFeatChoices: {},
        },
      }));
      return;
    }
    const bg = findBackground(compendium, key);
    if (!bg) return;
    const rawFeatKey = bg.feats?.[0] ? Object.keys(bg.feats[0])[0] : undefined;
    let resolvedFeatKey: string | undefined;
    let spellList: string | undefined;
    if (rawFeatKey) {
      const [fNameRaw, fSrc] = rawFeatKey.split('|');
      const [fBaseRaw, variantRaw] = fNameRaw.split(';');
      const fBaseName = fBaseRaw.trim();
      if (variantRaw) {
        spellList = variantRaw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
      }
      const match = compendium.feats.find(
        (f) => f.name.toLowerCase() === fBaseName.toLowerCase() && (!fSrc || f.source.toLowerCase() === fSrc.toLowerCase()),
      );
      if (match) resolvedFeatKey = makeEntityKey(match.name, match.source);
    }

    const hasBgAsi = Boolean(bg.ability?.length);
    onChange((prev) => ({
      ...prev,
      race: hasBgAsi ? { ...prev.race, abilityMode: 'none', abilityBonuses: {} } : prev.race,
      background: {
        ...prev.background,
        backgroundKey: key,
        chosenSkills: [],
        chosenTools: [],
        chosenLanguages: [],
        abilityMode: hasBgAsi ? 'weighted_2_1' : prev.preferences.tashaOriginAbilityOverride ? 'weighted_2_1' : 'none',
        abilityBonuses: {},
        originFeatKey: resolvedFeatKey,
        originFeatChoices: spellList ? { spellList, spellAbility: spellList === 'Wizard' ? 'int' : 'wis' } : {},
      },
    }));
  };

  const langChoiceCount =
    selectedBg?.languageProficiencies?.reduce((sum, l) => {
      const anyStd = typeof l.anyStandard === 'number' ? l.anyStandard : 0;
      const anyGen = typeof l.any === 'number' ? l.any : 0;
      return sum + anyStd + anyGen;
    }, 0) || 0;

  const setDesc = (field: keyof Character['description'], value: string) => {
    onChange((p) => ({ ...p, description: { ...p.description, [field]: value } }));
  };

  const characteristicTables = extractCharacteristicTables(selectedBg?.entries);

  const rollSuggested = (tableRows: string[], field: 'personalityTraits' | 'ideals' | 'bonds' | 'flaws') => {
    if (tableRows.length === 0) return;
    const pick = tableRows[Math.floor(Math.random() * tableRows.length)];
    setDesc(field, pick);
  };

  return (
    <div className="space-y-4">
      {/* Dropdown List to Choose Background */}
      <div className="ddb-card ddb-card-accent p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#e40712]" />
              Background
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Select a background from the dropdown below to configure proficiencies, origin features, and character details.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="background-select" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Choose a Background
          </label>
          <select
            id="background-select"
            value={character.background.backgroundKey || ''}
            onChange={(e) => selectBackground(e.target.value)}
            className="w-full sm:max-w-lg px-3 py-2.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm font-semibold focus:outline-none focus:border-[#1b9af0]"
          >
            <option value="">-- Choose a Background --</option>
            {groupedBackgrounds.map((grp) => (
              <optgroup key={grp.id} label={grp.label}>
                {grp.items.map((bg) => (
                  <option key={`${bg.name}|${bg.source}`} value={`${bg.name}|${bg.source}`}>
                    {bg.name} ({bg.source})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {selectedBg && (
          <div className="space-y-3 pt-2">
            {(bgProfState.fixedBgSkills.length > 0 ||
              bgProfState.skillSlots.length > 0 ||
              bgProfState.fixedBgTools.length > 0 ||
              bgProfState.toolSlots.length > 0) && (() => {
              const missingSkills = Math.max(
                0,
                bgProfState.skillSlots.length - character.background.chosenSkills.filter(Boolean).length,
              );
              const missingTools = Math.max(
                0,
                bgProfState.toolSlots.length - character.background.chosenTools.filter(Boolean).length,
              );
              const missingProfCount = missingSkills + missingTools;
              const keptSkillSet = new Set(bgProfState.keptFixedSkills.map((s) => s.toLowerCase()));
              const keptToolSet = new Set(bgProfState.keptFixedTools.map((t) => t.toLowerCase()));

              return (
                <CollapsibleBox
                  title="Background Proficiencies"
                  subtitle={
                    missingProfCount > 0
                      ? `${missingProfCount} Choice${missingProfCount > 1 ? 's' : ''} Needed`
                      : [...bgProfState.keptFixedSkills, ...character.background.chosenSkills, ...bgProfState.keptFixedTools, ...character.background.chosenTools].join(', ') || 'Granted'
                  }
                  badge={missingProfCount > 0 ? `${missingProfCount} Choice${missingProfCount > 1 ? 's' : ''}` : 'Proficiencies'}
                  alertDot={missingProfCount > 0}
                  accent="blue"
                  defaultOpen
                >
                  <div className="space-y-3">
                    {bgProfState.fixedBgSkills.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Skill Proficiencies
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {bgProfState.fixedBgSkills.map((sk) => {
                            const overlapSrc = bgProfState.nonBgSkillSources.get(sk.toLowerCase());
                            return (
                              <span
                                key={sk}
                                className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                                  overlapSrc
                                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                                    : 'bg-[var(--bg-card-alt)] border-[var(--border-color)] text-[var(--text-primary)]'
                                }`}
                              >
                                {overlapSrc ? (
                                  <>
                                    <span className="line-through opacity-75">{sk}</span>{' '}
                                    <span className="text-[11px]">
                                      (Already from {overlapSrc} → free replacement below)
                                    </span>
                                  </>
                                ) : (
                                  sk
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {bgProfState.skillSlots.length > 0 && (
                      <div className="space-y-2">
                        {bgProfState.skillSlots.map((slot, idx) => {
                          const currentVal = character.background.chosenSkills[idx] || '';
                          const usedOther = new Set(
                            character.background.chosenSkills
                              .filter((_, i) => i !== idx)
                              .map((s) => s.toLowerCase()),
                          );
                          const isRep = slot.kind === 'replacement';
                          return (
                            <div key={`bg-sk-${idx}`} className="space-y-1">
                              <div className="text-xs text-[var(--text-secondary)] font-semibold">
                                {isRep
                                  ? `Replacement Skill Choice (replacing ${slot.replacedName})`
                                  : `Skill Choice ${idx + 1}`}
                              </div>
                              <select
                                aria-label={
                                  isRep
                                    ? `Background Replacement Skill (${slot.replacedName})`
                                    : `Background Skill Choice ${idx + 1}`
                                }
                                value={currentVal}
                                onChange={(e) => {
                                  const picked = e.target.value;
                                  onChange((p) => {
                                    const next = [...p.background.chosenSkills];
                                    next[idx] = picked;
                                    return {
                                      ...p,
                                      background: { ...p.background, chosenSkills: next.filter(Boolean) },
                                    };
                                  });
                                }}
                                className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                              >
                                <option value="">- Choose a Skill Proficiency -</option>
                                {slot.pool
                                  .filter((opt) => {
                                    const low = opt.toLowerCase();
                                    if (opt === currentVal) return true;
                                    if (usedOther.has(low) || keptSkillSet.has(low)) return false;
                                    if (isRep && bgProfState.nonBgSkillSources.has(low)) return false;
                                    return true;
                                  })
                                  .map((opt) => {
                                    const src = bgProfState.nonBgSkillSources.get(opt.toLowerCase());
                                    return (
                                      <option key={opt} value={opt}>
                                        {src && opt !== currentVal ? `${opt} (from ${src})` : opt}
                                      </option>
                                    );
                                  })}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {bgProfState.fixedBgTools.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Tool Proficiencies
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {bgProfState.fixedBgTools.map((tl) => {
                            const overlapSrc = bgProfState.nonBgToolSources.get(tl.toLowerCase());
                            return (
                              <span
                                key={tl}
                                className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                                  overlapSrc
                                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                                    : 'bg-[var(--bg-card-alt)] border-[var(--border-color)] text-[var(--text-primary)]'
                                }`}
                              >
                                {overlapSrc ? (
                                  <>
                                    <span className="line-through opacity-75">{tl}</span>{' '}
                                    <span className="text-[11px]">
                                      (Already from {overlapSrc} → free replacement below)
                                    </span>
                                  </>
                                ) : (
                                  tl
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {bgProfState.toolSlots.length > 0 && (
                      <div className="space-y-2">
                        {bgProfState.toolSlots.map((slot, idx) => {
                          const currentVal = character.background.chosenTools[idx] || '';
                          const usedOther = new Set(
                            character.background.chosenTools
                              .filter((_, i) => i !== idx)
                              .map((t) => t.toLowerCase()),
                          );
                          const isRep = slot.kind === 'replacement';
                          return (
                            <div key={`bg-tl-${idx}`} className="space-y-1">
                              <div className="text-xs text-[var(--text-secondary)] font-semibold">
                                {isRep
                                  ? `Replacement Tool Choice (replacing ${slot.replacedName})`
                                  : `Tool Proficiency Choice ${idx + 1}`}
                              </div>
                              <select
                                aria-label={
                                  isRep
                                    ? `Background Replacement Tool (${slot.replacedName})`
                                    : `Background Tool Choice ${idx + 1}`
                                }
                                value={currentVal}
                                onChange={(e) => {
                                  const picked = e.target.value;
                                  onChange((p) => {
                                    const next = [...p.background.chosenTools];
                                    next[idx] = picked;
                                    return {
                                      ...p,
                                      background: { ...p.background, chosenTools: next.filter(Boolean) },
                                    };
                                  });
                                }}
                                className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                              >
                                <option value="">- Choose a Tool Proficiency -</option>
                                {slot.pool
                                  .filter((opt) => {
                                    const low = opt.toLowerCase();
                                    if (opt === currentVal) return true;
                                    if (usedOther.has(low) || keptToolSet.has(low)) return false;
                                    if (isRep && bgProfState.nonBgToolSources.has(low)) return false;
                                    return true;
                                  })
                                  .map((opt) => {
                                    const src = bgProfState.nonBgToolSources.get(opt.toLowerCase());
                                    return (
                                      <option key={opt} value={opt}>
                                        {src && opt !== currentVal ? `${opt} (from ${src})` : opt}
                                      </option>
                                    );
                                  })}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CollapsibleBox>
              );
            })()}

            {(selectedBg.ability?.length || character.preferences.tashaOriginAbilityOverride) && (
              <CollapsibleBox
                title="Background Ability Score Increases"
                subtitle={character.background.abilityMode === 'weighted_2_1' ? '+2 / +1 Distribution' : '+1 / +1 / +1 Distribution'}
                badge="Choice"
                accent="blue"
                defaultOpen
              >
                <div className="space-y-3">
                  <div className="flex rounded overflow-hidden border border-[var(--border-color)] w-fit text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          background: { ...p.background, abilityMode: 'weighted_2_1', abilityBonuses: {} },
                        }))
                      }
                      className={`px-3 py-1.5 cursor-pointer ${
                        character.background.abilityMode === 'weighted_2_1'
                          ? 'bg-[#1b9af0] text-white'
                          : 'bg-[var(--bg-card-alt)]'
                      }`}
                    >
                      +2 / +1
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          background: { ...p.background, abilityMode: 'three_1', abilityBonuses: {} },
                        }))
                      }
                      className={`px-3 py-1.5 cursor-pointer ${
                        character.background.abilityMode === 'three_1'
                          ? 'bg-[#1b9af0] text-white'
                          : 'bg-[var(--bg-card-alt)]'
                      }`}
                    >
                      +1 / +1 / +1
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {bgAbilityPool.map((ab) => {
                      const val = character.background.abilityBonuses[ab] || 0;
                      const totalAssigned = ABILITY_KEYS.reduce((s, k) => s + (character.background.abilityBonuses[k] || 0), 0);
                      const maxPerStat = character.background.abilityMode === 'weighted_2_1' ? 2 : 1;
                      return (
                        <div key={ab} className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)] text-xs">
                          <span className="font-bold">{ABILITY_LABELS[ab].short}</span>
                          <button
                            type="button"
                            disabled={val <= 0}
                            onClick={() =>
                              onChange((p) => ({
                                ...p,
                                background: {
                                  ...p.background,
                                  abilityBonuses: { ...p.background.abilityBonuses, [ab]: Math.max(0, val - 1) },
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
                            disabled={val >= maxPerStat || totalAssigned >= 3}
                            onClick={() =>
                              onChange((p) => ({
                                ...p,
                                background: {
                                  ...p.background,
                                  abilityBonuses: { ...p.background.abilityBonuses, [ab]: val + 1 },
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
                </div>
              </CollapsibleBox>
            )}

            {(selectedBg.feats?.length || character.preferences.ruleset === '2024') && (
              <CollapsibleBox
                title="Origin Feat"
                subtitle={activeFeat ? `${activeFeat.name} (${activeFeat.source})` : 'Select Origin Feat'}
                badge="Feat"
                accent="blue"
                defaultOpen
              >
                <OriginFeatSelector
                  compendium={compendium}
                  character={character}
                  featKey={character.background.originFeatKey}
                  featChoices={character.background.originFeatChoices}
                  featSlot="background-feat"
                  selectAriaLabel="Background Origin Feat"
                  onChangeFeatKey={(nextKey) =>
                    onChange((p) => ({
                      ...p,
                      background: {
                        ...p.background,
                        originFeatKey: nextKey,
                        originFeatChoices: {},
                      },
                    }))
                  }
                  onChangeFeatChoices={(nextChoices) =>
                    onChange((p) => ({
                      ...p,
                      background: {
                        ...p.background,
                        originFeatChoices: nextChoices,
                      },
                    }))
                  }
                />
              </CollapsibleBox>
            )}

            {langChoiceCount > 0 && (
              <CollapsibleBox
                title="Languages"
                subtitle={`Choose ${langChoiceCount} (${character.background.chosenLanguages.length}/${langChoiceCount})`}
                badge={`${character.background.chosenLanguages.length}/${langChoiceCount}`}
                accent="blue"
                defaultOpen
              >
                <div className="flex flex-wrap gap-1.5">
                  {compendium.languages
                    .filter((l) => isSourceAllowed(l.source, character.preferences.enabledSources, character.preferences.ruleset))
                    .slice(0, 24)
                    .map((lang) => {
                      const picked = character.background.chosenLanguages.includes(lang.name);
                      return (
                        <button
                          key={`${lang.name}|${lang.source}`}
                          type="button"
                          onClick={() =>
                            onChange((p) => {
                              const curr = p.background.chosenLanguages;
                              const next = picked
                                ? curr.filter((x) => x !== lang.name)
                                : curr.length < langChoiceCount
                                  ? [...curr, lang.name]
                                  : curr;
                              return { ...p, background: { ...p.background, chosenLanguages: next } };
                            })
                          }
                          className={`px-2.5 py-1 rounded text-xs font-bold border cursor-pointer ${
                            picked
                              ? 'bg-[#1b9af0] text-white border-[#1b9af0]'
                              : 'bg-[var(--bg-card-alt)] border-[var(--border-color)]'
                          }`}
                        >
                          {lang.name}
                        </button>
                      );
                    })}
                </div>
              </CollapsibleBox>
            )}

            <CollapsibleBox title={`${selectedBg.name} Description & Features`} subtitle={selectedBg.source}>
              <RichEntries entries={selectedBg.entries} contextTitle={selectedBg.name} />
            </CollapsibleBox>
          </div>
        )}
      </div>

      {/* Collapsible Character Details, Physical Characteristics, Personal Characteristics, and Notes */}
      <CollapsibleBox title="Character Details" subtitle="Alignment, Faith, and Lifestyle" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Alignment
            </label>
            <select
              value={character.description.alignment}
              onChange={(e) => setDesc('alignment', e.target.value)}
              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm"
            >
              {ALIGNMENTS.map((al) => (
                <option key={al} value={al}>
                  {al}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Faith / Deity
            </label>
            <input
              type="text"
              value={character.description.faith}
              onChange={(e) => setDesc('faith', e.target.value)}
              placeholder="e.g. Bahamut, Mystra, None"
              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Lifestyle
            </label>
            <select
              value={character.description.lifestyle}
              onChange={(e) => setDesc('lifestyle', e.target.value)}
              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm"
            >
              {['Wretched', 'Squalid', 'Poor', 'Modest', 'Comfortable', 'Wealthy', 'Aristocratic'].map((ls) => (
                <option key={ls} value={ls}>
                  {ls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleBox>

      <CollapsibleBox title="Physical Characteristics" subtitle="Hair, Skin, Eyes, Height, Weight, Age, Gender" defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { key: 'hair', label: 'Hair' },
              { key: 'skin', label: 'Skin' },
              { key: 'eyes', label: 'Eyes' },
              { key: 'height', label: 'Height' },
              { key: 'weight', label: 'Weight' },
              { key: 'age', label: 'Age' },
              { key: 'gender', label: 'Gender' },
              { key: 'size', label: 'Size' },
            ] as const
          ).map((f) => (
            <div key={f.key}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                {f.label}
              </label>
              <input
                type="text"
                value={character.description[f.key]}
                onChange={(e) => setDesc(f.key, e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs"
              />
            </div>
          ))}
        </div>
      </CollapsibleBox>

      <CollapsibleBox title="Personal Characteristics" subtitle="Personality Traits, Ideals, Bonds, and Flaws" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(
            [
              { key: 'personalityTraits', label: 'Personality Traits', tableMatch: 'Personality' },
              { key: 'ideals', label: 'Ideals', tableMatch: 'Ideal' },
              { key: 'bonds', label: 'Bonds', tableMatch: 'Bond' },
              { key: 'flaws', label: 'Flaws', tableMatch: 'Flaw' },
            ] as const
          ).map((f) => {
            const table = characteristicTables.find((t) =>
              t.label.toLowerCase().includes(f.tableMatch.toLowerCase()),
            );
            return (
              <div key={f.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {f.label}
                  </label>
                  {table && (
                    <button
                      type="button"
                      onClick={() => rollSuggested(table.rows, f.key)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1b9af0] hover:underline cursor-pointer"
                    >
                      <Dices className="w-3 h-3" /> Roll Suggested
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={character.description[f.key]}
                  onChange={(e) => setDesc(f.key, e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs"
                />
              </div>
            );
          })}
        </div>
      </CollapsibleBox>

      <CollapsibleBox title="Notes" subtitle="Organizations, Allies, Enemies, Backstory, and Other" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Backstory
            </label>
            <textarea
              rows={4}
              value={character.description.backstory}
              onChange={(e) => setDesc('backstory', e.target.value)}
              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Organizations, Allies &amp; Other Notes
            </label>
            <textarea
              rows={4}
              value={character.description.allies}
              onChange={(e) => setDesc('allies', e.target.value)}
              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Additional Notes
            </label>
            <textarea
              rows={3}
              value={character.description.notes}
              onChange={(e) => setDesc('notes', e.target.value)}
              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs"
            />
          </div>
        </div>
      </CollapsibleBox>
    </div>
  );
}
