import { useMemo } from 'react';
import type {
  Class5e,
  CompiledCompendium,
  EntryNode,
  OptionalFeatureProgression,
  Spell5e,
} from '../../types/5etools';
import type { Character, CharacterClassSelection, OptionalFeatureSubChoice } from '../../types/character';
import {
  ARTISAN_TOOL_LIST,
  STANDARD_SKILLS,
  extractClassSkillConfig,
  findOptionalFeature,
  findSpell,
  getAvailableSpellsForClass,
  getCharacterKnownProficiencies,
  getOptionalFeatureCantripConfig,
  isLessonsOfFirstOnes,
  isOptionalFeatureEligible,
  isOptionalFeatureRepeatable,
  isPactOfTheTome2024,
  isSourceAllowed,
  isSpellEligibleForCantripConfig,
  makeEntityKey,
  splitEntityKey,
} from '../../engine/rules';
import { ExpandableEntries } from '../RichEntries';
import { OriginFeatSelector } from './OriginFeatSelector';

const FALLBACK_LANGUAGES = [
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

export function SelectedDescriptionPreview({
  title,
  entries,
}: {
  title: string;
  entries: EntryNode[] | undefined;
}) {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="p-2.5 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)] text-xs">
      <ExpandableEntries entries={entries} contextTitle={title} charThreshold={190} />
    </div>
  );
}

function getOwnedOriginFeatKeys(
  character: Character,
  selId: string,
  excludeOptSubKey?: string,
): Set<string> {
  const owned = new Set<string>();
  const addKey = (k: string | undefined) => {
    if (!k) return;
    owned.add(k.toLowerCase());
    owned.add(splitEntityKey(k).name.toLowerCase());
  };
  addKey(character.background.originFeatKey);
  addKey(character.race.originFeatKey);
  for (const c of character.classes) {
    for (const [lvlStr, asi] of Object.entries(c.asiChoices || {})) {
      if (parseInt(lvlStr, 10) <= c.level && asi.mode === 'feat') {
        addKey(asi.featKey);
      }
    }
    for (const [subKey, sub] of Object.entries(c.chosenOptionalFeatureSubChoices || {})) {
      if (c.id === selId && subKey === excludeOptSubKey) continue;
      addKey(sub.featKey);
    }
  }
  return owned;
}

export function OptionalFeatureProgressionSlots({
  prog,
  progOptKey,
  slotStart,
  slotEnd,
  cls,
  sel,
  character,
  compendium,
  onUpdateClass,
}: {
  prog: OptionalFeatureProgression;
  progOptKey: string;
  slotStart: number;
  slotEnd: number;
  cls: Class5e;
  sel: CharacterClassSelection;
  character: Character;
  compendium: CompiledCompendium;
  onUpdateClass: (fn: (c: CharacterClassSelection) => CharacterClassSelection) => void;
}) {
  const progPicked = sel.chosenOptionalFeatures[progOptKey] || [];

  const updateSlotSubChoice = (slotIdx: number, updater: (prev: OptionalFeatureSubChoice) => OptionalFeatureSubChoice) => {
    const subKey = `${progOptKey}:${slotIdx}`;
    onUpdateClass((c) => {
      const prevMap = c.chosenOptionalFeatureSubChoices || {};
      const nextSub = updater(prevMap[subKey] || {});
      return {
        ...c,
        chosenOptionalFeatureSubChoices: {
          ...prevMap,
          [subKey]: nextSub,
        },
      };
    });
  };

  // All cantrips available to this Warlock class (class cantrips + Pact of the Tome chosen cantrips)
  const warlockKnownCantrips = useMemo(() => {
    const keys = new Set<string>(sel.cantrips || []);
    for (const [subK, subV] of Object.entries(sel.chosenOptionalFeatureSubChoices || {})) {
      if (subK.startsWith(`${progOptKey}:`) && subV.spellKeys?.length) {
        for (const spk of subV.spellKeys) {
          const spObj = findSpell(compendium, spk);
          if (spObj?.level === 0) keys.add(makeEntityKey(spObj.name, spObj.source));
        }
      }
    }
    const resolved: Spell5e[] = [];
    for (const k of keys) {
      const sp = findSpell(compendium, k);
      if (sp && sp.level === 0) resolved.push(sp);
    }
    return resolved.sort((a, b) => a.name.localeCompare(b.name));
  }, [sel.cantrips, sel.chosenOptionalFeatureSubChoices, progOptKey, compendium]);

  // All cantrips & L1 rituals for Pact of the Tome
  const allAllowedSpells = useMemo(
    () =>
      compendium.spells
        .filter((sp) =>
          isSourceAllowed(sp.source, character.preferences.enabledSources, character.preferences.ruleset, sp.edition),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [compendium.spells, character.preferences],
  );

  const slots = Array.from({ length: Math.max(0, slotEnd - slotStart) }, (_, i) => slotStart + i);

  return (
    <div className="space-y-3 pt-1">
      {slots.map((slotIdx) => {
        const currentVal = progPicked[slotIdx] || '';
        const usedElsewhere = new Set(progPicked.filter((_, i) => i !== slotIdx));
        const chosenOtherKeys = progPicked.filter((_, i) => i !== slotIdx);
        const candidates = compendium.optionalFeatures
          .filter((of) => {
            if (!of.featureType?.some((t) => prog.featureType.includes(t))) return false;
            const k = makeEntityKey(of.name, of.source);
            if (k === currentVal) return true;
            return isOptionalFeatureEligible(
              of,
              cls,
              sel.level,
              character.preferences.enabledSources,
              character.preferences.ruleset,
              chosenOtherKeys,
            );
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        const chosenOpt = currentVal ? findOptionalFeature(compendium, currentVal) : undefined;
        const subKey = `${progOptKey}:${slotIdx}`;
        const subChoice = sel.chosenOptionalFeatureSubChoices?.[subKey];
        const cantripCfg = getOptionalFeatureCantripConfig(chosenOpt);
        const showOriginFeat = isLessonsOfFirstOnes(chosenOpt);
        const showTomeSpells = isPactOfTheTome2024(chosenOpt);

        return (
          <div key={slotIdx} className="space-y-2">
            <select
              aria-label={`${prog.name} Option ${slotIdx + 1}`}
              value={currentVal}
              onChange={(e) => {
                const picked = e.target.value;
                onUpdateClass((c) => {
                  const next = [...(c.chosenOptionalFeatures[progOptKey] || [])];
                  next[slotIdx] = picked;
                  const nextSubs = { ...(c.chosenOptionalFeatureSubChoices || {}) };
                  delete nextSubs[subKey];
                  return {
                    ...c,
                    chosenOptionalFeatures: {
                      ...c.chosenOptionalFeatures,
                      [progOptKey]: next.filter(Boolean),
                    },
                    chosenOptionalFeatureSubChoices: nextSubs,
                  };
                });
              }}
              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
            >
              <option value="">- Choose a Level {sel.level} Option -</option>
              {candidates
                .filter((opt) => {
                  const k = makeEntityKey(opt.name, opt.source);
                  if (k === currentVal) return true;
                  return !usedElsewhere.has(k) || isOptionalFeatureRepeatable(opt);
                })
                .map((opt) => {
                  const k = makeEntityKey(opt.name, opt.source);
                  return (
                    <option key={k} value={k}>
                      {opt.name} ({opt.source})
                    </option>
                  );
                })}
            </select>

            {chosenOpt && (
              <div className="pl-3 border-l-2 border-[#1b9af0]/60 space-y-2.5">
                <SelectedDescriptionPreview title={chosenOpt.name} entries={chosenOpt.entries} />

                {/* Lessons of the First Ones -> Origin Feat Selector */}
                {showOriginFeat && (() => {
                  const ownedFeats = getOwnedOriginFeatKeys(character, sel.id, subKey);
                  return (
                    <div className="p-3 rounded bg-[var(--bg-card)] border border-[#1b9af0]/50 space-y-2">
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        {chosenOpt.name}: Choose an Origin Feat
                      </div>
                      <OriginFeatSelector
                        compendium={compendium}
                        character={character}
                        featKey={subChoice?.featKey}
                        featChoices={subChoice?.featChoices}
                        allowAnyCategory={false}
                        featSlot={{ classId: sel.id, optSubKey: subKey }}
                        excludedFeatKeys={ownedFeats}
                        selectAriaLabel={`${chosenOpt.name} Origin Feat ${slotIdx + 1}`}
                        placeholder="- Choose an Origin Feat -"
                        onChangeFeatKey={(nextKey) =>
                          updateSlotSubChoice(slotIdx, () => ({ featKey: nextKey, featChoices: {} }))
                        }
                        onChangeFeatChoices={(nextChoices) =>
                          updateSlotSubChoice(slotIdx, (prev) => ({ ...prev, featChoices: nextChoices }))
                        }
                      />
                    </div>
                  );
                })()}

                {/* Agonizing Blast / Repelling Blast / Eldritch Spear -> Known Cantrip Selector */}
                {cantripCfg && (() => {
                  const usedCantripsSameInvocation = new Set<string>();
                  progPicked.forEach((otherKey, otherIdx) => {
                    if (otherIdx === slotIdx) return;
                    if (splitEntityKey(otherKey).name.toLowerCase() === chosenOpt.name.toLowerCase()) {
                      const otherCantrip = sel.chosenOptionalFeatureSubChoices?.[`${progOptKey}:${otherIdx}`]?.cantripKey;
                      if (otherCantrip) usedCantripsSameInvocation.add(splitEntityKey(otherCantrip).name.toLowerCase());
                    }
                  });
                  const eligibleCantrips = warlockKnownCantrips.filter(
                    (sp) =>
                      isSpellEligibleForCantripConfig(sp, cantripCfg.mode) &&
                      (splitEntityKey(subChoice?.cantripKey).name.toLowerCase() === sp.name.toLowerCase() ||
                        !usedCantripsSameInvocation.has(sp.name.toLowerCase())),
                  );

                  return (
                    <div className="p-3 rounded bg-[var(--bg-card)] border border-[#1b9af0]/50 space-y-1.5">
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        {chosenOpt.name}: {cantripCfg.label}
                      </div>
                      <select
                        aria-label={`${chosenOpt.name} Known Cantrip ${slotIdx + 1}`}
                        value={subChoice?.cantripKey || ''}
                        onChange={(e) =>
                          updateSlotSubChoice(slotIdx, (prev) => ({
                            ...prev,
                            cantripKey: e.target.value || undefined,
                          }))
                        }
                        className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                      >
                        <option value="">- Choose Known Cantrip -</option>
                        {eligibleCantrips.map((sp) => {
                          const sk = makeEntityKey(sp.name, sp.source);
                          return (
                            <option key={sk} value={sk}>
                              {sp.name} ({sp.source})
                            </option>
                          );
                        })}
                      </select>
                      {eligibleCantrips.length === 0 && (
                        <div className="text-[11px] text-amber-400">
                          No eligible known cantrips yet. Learn an eligible {cls.name} cantrip in the Spells tab first.
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Pact of the Tome -> 3 Cantrips + 2 Level-1 Ritual Spells */}
                {showTomeSpells && (() => {
                  const tomeSpells = subChoice?.spellKeys || [];
                  const cantripPool = allAllowedSpells.filter((s) => s.level === 0);
                  const ritualPool = allAllowedSpells.filter((s) => s.level === 1 && s.meta?.ritual);
                  return (
                    <div className="p-3 rounded bg-[var(--bg-card)] border border-[#1b9af0]/50 space-y-2">
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        Book of Shadows Spells (3 Cantrips &amp; 2 Level-1 Rituals)
                      </div>
                      {[0, 1, 2].map((idx) => {
                        const val = tomeSpells[idx] || '';
                        const used = new Set(tomeSpells.filter((_, i) => i !== idx));
                        return (
                          <select
                            key={`tome-c-${idx}`}
                            aria-label={`Pact of the Tome Cantrip ${idx + 1}`}
                            value={val}
                            onChange={(e) => {
                              const next = [...tomeSpells];
                              next[idx] = e.target.value;
                              updateSlotSubChoice(slotIdx, (prev) => ({ ...prev, spellKeys: next }));
                            }}
                            className="w-full px-3 py-1.5 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-xs font-medium"
                          >
                            <option value="">- Choose Tome Cantrip {idx + 1} -</option>
                            {cantripPool
                              .filter((sp) => {
                                const k = makeEntityKey(sp.name, sp.source);
                                return k === val || !used.has(k);
                              })
                              .map((sp) => {
                                const k = makeEntityKey(sp.name, sp.source);
                                return (
                                  <option key={k} value={k}>
                                    {sp.name} ({sp.source})
                                  </option>
                                );
                              })}
                          </select>
                        );
                      })}
                      {[3, 4].map((idx) => {
                        const val = tomeSpells[idx] || '';
                        const used = new Set(tomeSpells.filter((_, i) => i !== idx));
                        return (
                          <select
                            key={`tome-r-${idx}`}
                            aria-label={`Pact of the Tome Ritual ${idx - 2}`}
                            value={val}
                            onChange={(e) => {
                              const next = [...tomeSpells];
                              next[idx] = e.target.value;
                              updateSlotSubChoice(slotIdx, (prev) => ({ ...prev, spellKeys: next }));
                            }}
                            className="w-full px-3 py-1.5 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-xs font-medium"
                          >
                            <option value="">- Choose Level-1 Ritual Spell {idx - 2} -</option>
                            {ritualPool
                              .filter((sp) => {
                                const k = makeEntityKey(sp.name, sp.source);
                                return k === val || !used.has(k);
                              })
                              .map((sp) => {
                                const k = makeEntityKey(sp.name, sp.source);
                                return (
                                  <option key={k} value={k}>
                                    {sp.name} ({sp.source})
                                  </option>
                                );
                              })}
                          </select>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export interface FeatureExtraChoiceSummary {
  choiceCount: number;
  missingCount: number;
}

function getMysticArcanumSpellLevel(entries: EntryNode[] | undefined, featLvl: number): number | null {
  const mapByLevel: Record<number, number> = { 11: 6, 13: 7, 15: 8, 17: 9 };
  if (mapByLevel[featLvl]) return mapByLevel[featLvl];
  const m = JSON.stringify(entries || []).match(/level (\d+) Warlock spell/i);
  return m ? parseInt(m[1], 10) : null;
}

export function getFeatureExtraChoiceSummary({
  cls,
  sel,
  featureName,
  featureLevel,
  isSubclass = false,
  entries,
}: {
  cls: Class5e;
  sel: CharacterClassSelection;
  featureName: string;
  featureLevel: number;
  isSubclass?: boolean;
  entries?: EntryNode[];
}): FeatureExtraChoiceSummary {
  const lower = featureName.toLowerCase();
  const key = `${featureName}-${featureLevel}`;

  if (!isSubclass) {
    if (lower === "thieves' cant" && cls.name.toLowerCase() === 'rogue' && cls.edition === 'one') {
      const picked = sel.chosenClassFeatureLanguages?.[key] || [];
      return { choiceCount: 1, missingCount: picked.length >= 1 ? 0 : 1 };
    }
    if (lower === 'deft explorer' && cls.name.toLowerCase() === 'ranger' && cls.edition === 'one') {
      const langs = sel.chosenClassFeatureLanguages?.[key] || [];
      return { choiceCount: 2, missingCount: Math.max(0, 2 - langs.length) };
    }
    if (lower.startsWith('mystic arcanum') && cls.name.toLowerCase() === 'warlock') {
      const picked = sel.chosenClassFeatureSpells?.[key] || [];
      return { choiceCount: 1, missingCount: picked.length >= 1 ? 0 : 1 };
    }
    if (lower === 'spell mastery' && cls.name.toLowerCase() === 'wizard') {
      const picked = (sel.chosenClassFeatureSpells?.[key] || []).filter(Boolean);
      return { choiceCount: 2, missingCount: Math.max(0, 2 - picked.length) };
    }
    if (lower === 'signature spells' && cls.name.toLowerCase() === 'wizard') {
      const picked = (sel.chosenClassFeatureSpells?.[key] || []).filter(Boolean);
      return { choiceCount: 2, missingCount: Math.max(0, 2 - picked.length) };
    }
    return { choiceCount: 0, missingCount: 0 };
  }

  // Subclass choices
  if (lower === 'additional fighting style') {
    const picked = sel.chosenFeatProgressions?.['fp-Additional Fighting Style'] || [];
    return { choiceCount: 1, missingCount: picked.length >= 1 ? 0 : 1 };
  }
  if (lower === 'bonus proficiencies' && JSON.stringify(entries || []).toLowerCase().includes('three skills')) {
    const picked = sel.chosenClassFeatureSkills?.[key] || [];
    return { choiceCount: 3, missingCount: Math.max(0, 3 - picked.length) };
  }
  if (lower === 'magical discoveries') {
    const picked = sel.chosenClassFeatureSpells?.[key] || [];
    return { choiceCount: 2, missingCount: Math.max(0, 2 - picked.length) };
  }
  if (lower === 'student of war') {
    const sk = sel.chosenClassFeatureSkills?.[key] || [];
    const tl = sel.chosenClassFeatureTools?.[key] || [];
    return { choiceCount: 2, missingCount: (sk.length >= 1 ? 0 : 1) + (tl.length >= 1 ? 0 : 1) };
  }
  if (lower === 'blessings of knowledge') {
    const sk = sel.chosenClassFeatureSkills?.[key] || [];
    const tl = sel.chosenClassFeatureTools?.[key] || [];
    return { choiceCount: 3, missingCount: Math.max(0, 2 - sk.length) + (tl.length >= 1 ? 0 : 1) };
  }
  if (lower === 'otherworldly glamour' || lower === "genie's splendor") {
    const sk = sel.chosenClassFeatureSkills?.[key] || [];
    return { choiceCount: 1, missingCount: sk.length >= 1 ? 0 : 1 };
  }
  if (lower === 'knightly envoy') {
    const sk = sel.chosenClassFeatureSkills?.[key] || [];
    const lg = sel.chosenClassFeatureLanguages?.[key] || [];
    return { choiceCount: 2, missingCount: (sk.length >= 1 ? 0 : 1) + (lg.length >= 1 ? 0 : 1) };
  }
  if (lower === 'primal lore') {
    const sk = sel.chosenClassFeatureSkills?.[key] || [];
    const sp = sel.chosenClassFeatureSpells?.[key] || [];
    return { choiceCount: 2, missingCount: (sk.length >= 1 ? 0 : 1) + (sp.length >= 1 ? 0 : 1) };
  }
  if (
    lower === 'circle of the land spells' ||
    lower === 'elemental affinity' ||
    lower === "hunter's prey" ||
    lower === 'defensive tactics' ||
    lower === 'aspect of the wilds' ||
    lower === 'dread allegiance' ||
    lower === 'aura of elemental shielding'
  ) {
    const val = sel.chosenClassFeatureOptions?.[key] || '';
    return { choiceCount: 1, missingCount: val ? 0 : 1 };
  }
  return { choiceCount: 0, missingCount: 0 };
}

export function ClassOrSubclassExtraControls({
  cls,
  sel,
  character,
  compendium,
  featureName,
  featureLevel,
  featureEntries,
  isSubclass = false,
  onUpdateClass,
}: {
  cls: Class5e;
  sel: CharacterClassSelection;
  character: Character;
  compendium: CompiledCompendium;
  featureName: string;
  featureLevel: number;
  featureEntries: EntryNode[];
  isSubclass?: boolean;
  onUpdateClass: (fn: (c: CharacterClassSelection) => CharacterClassSelection) => void;
}) {
  const lower = featureName.toLowerCase();
  const key = `${featureName}-${featureLevel}`;

  const knownProfs = useMemo(
    () => getCharacterKnownProficiencies(character, compendium),
    [character, compendium],
  );

  const languageNames = useMemo(() => {
    const fromComp = compendium.languages
      .filter((l) => isSourceAllowed(l.source, character.preferences.enabledSources, character.preferences.ruleset))
      .map((l) => l.name);
    const merged = fromComp.length > 0 ? fromComp : FALLBACK_LANGUAGES;
    return [...new Set(merged)].sort((a, b) => a.localeCompare(b));
  }, [compendium.languages, character.preferences]);

  const setFeatureArrayField = (
    field: 'chosenClassFeatureLanguages' | 'chosenClassFeatureSkills' | 'chosenClassFeatureTools' | 'chosenClassFeatureSpells',
    slotIdx: number,
    value: string,
  ) => {
    onUpdateClass((c) => {
      const prevMap = (c[field] as Record<string, string[]> | undefined) || {};
      const next = [...(prevMap[key] || [])];
      next[slotIdx] = value;
      return {
        ...c,
        [field]: {
          ...prevMap,
          [key]: next.filter(Boolean),
        },
      };
    });
  };

  // Language Selectors (Thieves' Cant, Deft Explorer, Knightly Envoy)
  const renderLanguagePickers = (count: number) => {
    const picked = sel.chosenClassFeatureLanguages?.[key] || [];
    return (
      <div className="space-y-2 pt-1">
        {Array.from({ length: count }, (_, idx) => {
          const cur = picked[idx] || '';
          const usedElsewhere = new Set(picked.filter((_, i) => i !== idx));
          return (
            <select
              key={`cflang-${idx}`}
              aria-label={`${featureName} Language ${idx + 1}`}
              value={cur}
              onChange={(e) => setFeatureArrayField('chosenClassFeatureLanguages', idx, e.target.value)}
              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
            >
              <option value="">- Choose Bonus Language -</option>
              {languageNames
                .filter((lang) => lang === cur || (!usedElsewhere.has(lang) && !knownProfs.languages.has(lang.toLowerCase())))
                .map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
            </select>
          );
        })}
      </div>
    );
  };

  // Skill Selectors for Class / Subclass Features
  const renderSkillPickers = (count: number, pool: string[], ariaPrefix: string) => {
    const picked = sel.chosenClassFeatureSkills?.[key] || [];
    return (
      <div className="space-y-2 pt-1">
        {Array.from({ length: count }, (_, idx) => {
          const cur = picked[idx] || '';
          const usedElsewhere = new Set(picked.filter((_, i) => i !== idx));
          return (
            <select
              key={`cfsk-${idx}`}
              aria-label={`${ariaPrefix} Skill ${idx + 1}`}
              value={cur}
              onChange={(e) => setFeatureArrayField('chosenClassFeatureSkills', idx, e.target.value)}
              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
            >
              <option value="">- Choose Skill Proficiency -</option>
              {pool
                .filter((sk) => sk === cur || (!usedElsewhere.has(sk) && !knownProfs.skills.has(sk.toLowerCase())))
                .map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))}
            </select>
          );
        })}
      </div>
    );
  };

  // Tool Selectors
  const renderToolPickers = (count: number, pool: string[], ariaPrefix: string) => {
    const picked = sel.chosenClassFeatureTools?.[key] || [];
    return (
      <div className="space-y-2 pt-1">
        {Array.from({ length: count }, (_, idx) => {
          const cur = picked[idx] || '';
          const usedElsewhere = new Set(picked.filter((_, i) => i !== idx));
          return (
            <select
              key={`cftl-${idx}`}
              aria-label={`${ariaPrefix} Tool ${idx + 1}`}
              value={cur}
              onChange={(e) => setFeatureArrayField('chosenClassFeatureTools', idx, e.target.value)}
              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
            >
              <option value="">- Choose Tool Proficiency -</option>
              {pool
                .filter((t) => t === cur || (!usedElsewhere.has(t) && !knownProfs.tools.has(t.toLowerCase())))
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </select>
          );
        })}
      </div>
    );
  };

  // Option Dropdown + Description helper
  const renderNamedOptions = (options: { value: string; label: string; entries: EntryNode[] }[]) => {
    const pickedVal = sel.chosenClassFeatureOptions?.[key] || '';
    const activeOpt = options.find((o) => o.value === pickedVal);
    return (
      <div className="space-y-2 pt-1">
        <select
          aria-label={`${featureName} Option`}
          value={pickedVal}
          onChange={(e) => {
            const val = e.target.value;
            onUpdateClass((c) => ({
              ...c,
              chosenClassFeatureOptions: { ...(c.chosenClassFeatureOptions || {}), [key]: val },
            }));
          }}
          className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
        >
          <option value="">- Choose {featureName} Option -</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {activeOpt && <SelectedDescriptionPreview title={activeOpt.label} entries={activeOpt.entries} />}
      </div>
    );
  };

  if (!isSubclass) {
    if (lower === "thieves' cant" && cls.name.toLowerCase() === 'rogue' && cls.edition === 'one') {
      return renderLanguagePickers(1);
    }
    if (lower === 'deft explorer' && cls.name.toLowerCase() === 'ranger' && cls.edition === 'one') {
      return renderLanguagePickers(2);
    }
    if (lower.startsWith('mystic arcanum') && cls.name.toLowerCase() === 'warlock') {
      const spellLvl = getMysticArcanumSpellLevel(featureEntries, featureLevel) || 6;
      const pickedKey = sel.chosenClassFeatureSpells?.[key]?.[0] || '';
      const arcanumPool = getAvailableSpellsForClass(
        compendium,
        'Warlock',
        cls.source,
        undefined,
        undefined,
        spellLvl,
        character.preferences.enabledSources,
        character.preferences.ruleset,
      ).filter((s) => s.level === spellLvl);
      const chosenSpell = pickedKey ? findSpell(compendium, pickedKey) : undefined;
      return (
        <div className="space-y-2 pt-1">
          <select
            aria-label={`${featureName} Level ${spellLvl} Spell`}
            value={pickedKey}
            onChange={(e) => setFeatureArrayField('chosenClassFeatureSpells', 0, e.target.value)}
            className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
          >
            <option value="">- Choose Level {spellLvl} Warlock Spell -</option>
            {arcanumPool.map((sp) => {
              const sk = makeEntityKey(sp.name, sp.source);
              return (
                <option key={sk} value={sk}>
                  {sp.name} ({sp.source})
                </option>
              );
            })}
          </select>
          {chosenSpell && <SelectedDescriptionPreview title={chosenSpell.name} entries={chosenSpell.entries} />}
        </div>
      );
    }
    if (lower === 'spell mastery' && cls.name.toLowerCase() === 'wizard') {
      const picked = sel.chosenClassFeatureSpells?.[key] || [];
      const wizardSpells = getAvailableSpellsForClass(
        compendium,
        'Wizard',
        cls.source,
        undefined,
        undefined,
        2,
        character.preferences.enabledSources,
        character.preferences.ruleset,
      ).filter((s) => s.time?.some((t) => t.unit.toLowerCase() === 'action'));
      const lvl1Pool = wizardSpells.filter((s) => s.level === 1);
      const lvl2Pool = wizardSpells.filter((s) => s.level === 2);
      const sp1 = picked[0] ? findSpell(compendium, picked[0]) : undefined;
      const sp2 = picked[1] ? findSpell(compendium, picked[1]) : undefined;
      return (
        <div className="space-y-2 pt-1">
          <select
            aria-label="Spell Mastery Level 1 Spell"
            value={picked[0] || ''}
            onChange={(e) =>
              onUpdateClass((c) => ({
                ...c,
                chosenClassFeatureSpells: { ...(c.chosenClassFeatureSpells || {}), [key]: [e.target.value, picked[1] || ''] },
              }))
            }
            className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
          >
            <option value="">- Choose Level 1 Wizard Spell (1 Action) -</option>
            {lvl1Pool.map((sp) => {
              const sk = makeEntityKey(sp.name, sp.source);
              return (
                <option key={sk} value={sk}>
                  {sp.name} ({sp.source})
                </option>
              );
            })}
          </select>
          {sp1 && <SelectedDescriptionPreview title={sp1.name} entries={sp1.entries} />}
          <select
            aria-label="Spell Mastery Level 2 Spell"
            value={picked[1] || ''}
            onChange={(e) =>
              onUpdateClass((c) => ({
                ...c,
                chosenClassFeatureSpells: { ...(c.chosenClassFeatureSpells || {}), [key]: [picked[0] || '', e.target.value] },
              }))
            }
            className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
          >
            <option value="">- Choose Level 2 Wizard Spell (1 Action) -</option>
            {lvl2Pool.map((sp) => {
              const sk = makeEntityKey(sp.name, sp.source);
              return (
                <option key={sk} value={sk}>
                  {sp.name} ({sp.source})
                </option>
              );
            })}
          </select>
          {sp2 && <SelectedDescriptionPreview title={sp2.name} entries={sp2.entries} />}
        </div>
      );
    }
    if (lower === 'signature spells' && cls.name.toLowerCase() === 'wizard') {
      const picked = sel.chosenClassFeatureSpells?.[key] || [];
      const lvl3Pool = getAvailableSpellsForClass(
        compendium,
        'Wizard',
        cls.source,
        undefined,
        undefined,
        3,
        character.preferences.enabledSources,
        character.preferences.ruleset,
      ).filter((s) => s.level === 3);
      return (
        <div className="space-y-2 pt-1">
          {[0, 1].map((idx) => {
            const cur = picked[idx] || '';
            const usedElsewhere = new Set(picked.filter((_, i) => i !== idx));
            const spObj = cur ? findSpell(compendium, cur) : undefined;
            return (
              <div key={`sig-${idx}`} className="space-y-1.5">
                <select
                  aria-label={`Signature Spell ${idx + 1}`}
                  value={cur}
                  onChange={(e) => setFeatureArrayField('chosenClassFeatureSpells', idx, e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                >
                  <option value="">- Choose Level 3 Wizard Spell {idx + 1} -</option>
                  {lvl3Pool
                    .filter((s) => {
                      const k = makeEntityKey(s.name, s.source);
                      return k === cur || !usedElsewhere.has(k);
                    })
                    .map((s) => {
                      const k = makeEntityKey(s.name, s.source);
                      return (
                        <option key={k} value={k}>
                          {s.name} ({s.source})
                        </option>
                      );
                    })}
                </select>
                {spObj && <SelectedDescriptionPreview title={spObj.name} entries={spObj.entries} />}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  }

  // SUBCLASS CONTROLS
  if (lower === 'additional fighting style') {
    const fpKey = 'fp-Additional Fighting Style';
    const pickedVal = sel.chosenFeatProgressions?.[fpKey]?.[0] || '';
    const existingFs = new Set(
      Object.entries(sel.chosenFeatProgressions || {})
        .filter(([k]) => k !== fpKey)
        .flatMap(([, v]) => v),
    );
    const fsCandidates = compendium.feats
      .filter(
        (f) =>
          f.category?.startsWith('FS') &&
          isSourceAllowed(f.source, character.preferences.enabledSources, character.preferences.ruleset, f.edition),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    const chosenFs = pickedVal
      ? fsCandidates.find((f) => makeEntityKey(f.name, f.source) === pickedVal)
      : undefined;
    return (
      <div className="space-y-2 pt-1">
        <select
          aria-label="Additional Fighting Style Option"
          value={pickedVal}
          onChange={(e) => {
            const val = e.target.value;
            onUpdateClass((c) => ({
              ...c,
              chosenFeatProgressions: {
                ...(c.chosenFeatProgressions || {}),
                [fpKey]: val ? [val] : [],
              },
            }));
          }}
          className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
        >
          <option value="">- Choose Additional Fighting Style -</option>
          {fsCandidates
            .filter((ft) => {
              const k = makeEntityKey(ft.name, ft.source);
              return k === pickedVal || !existingFs.has(k);
            })
            .map((ft) => {
              const k = makeEntityKey(ft.name, ft.source);
              return (
                <option key={k} value={k}>
                  {ft.name} ({ft.source})
                </option>
              );
            })}
        </select>
        {chosenFs && <SelectedDescriptionPreview title={chosenFs.name} entries={chosenFs.entries} />}
      </div>
    );
  }

  if (lower === 'bonus proficiencies' && JSON.stringify(featureEntries).toLowerCase().includes('three skills')) {
    return renderSkillPickers(3, STANDARD_SKILLS.map((s) => s.name), featureName);
  }
  if (lower === 'student of war') {
    const fighterSkills = extractClassSkillConfig(cls, true).choicePool;
    return (
      <div className="space-y-2">
        {renderToolPickers(1, ARTISAN_TOOL_LIST, 'Student of War')}
        {renderSkillPickers(1, fighterSkills.length > 0 ? fighterSkills : STANDARD_SKILLS.map((s) => s.name), 'Student of War')}
      </div>
    );
  }
  if (lower === 'blessings of knowledge') {
    return (
      <div className="space-y-2">
        {renderToolPickers(1, ARTISAN_TOOL_LIST, 'Blessings of Knowledge')}
        {renderSkillPickers(2, ['Arcana', 'History', 'Nature', 'Religion'], 'Blessings of Knowledge')}
      </div>
    );
  }
  if (lower === 'otherworldly glamour') {
    return renderSkillPickers(1, ['Deception', 'Performance', 'Persuasion'], 'Otherworldly Glamour');
  }
  if (lower === "genie's splendor") {
    return renderSkillPickers(1, ['Acrobatics', 'Intimidation', 'Performance', 'Persuasion'], "Genie's Splendor");
  }
  if (lower === 'knightly envoy') {
    return (
      <div className="space-y-2">
        {renderLanguagePickers(1)}
        {renderSkillPickers(1, ['Insight', 'Intimidation', 'Persuasion', 'Performance'], 'Knightly Envoy')}
      </div>
    );
  }
  if (lower === 'primal lore') {
    const druidCantrips = getAvailableSpellsForClass(
      compendium,
      'Druid',
      'XPHB',
      undefined,
      undefined,
      0,
      character.preferences.enabledSources,
      character.preferences.ruleset,
    );
    const curSp = sel.chosenClassFeatureSpells?.[key]?.[0] || '';
    const spObj = curSp ? findSpell(compendium, curSp) : undefined;
    return (
      <div className="space-y-2 pt-1">
        <select
          aria-label="Primal Lore Druid Cantrip"
          value={curSp}
          onChange={(e) => setFeatureArrayField('chosenClassFeatureSpells', 0, e.target.value)}
          className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium"
        >
          <option value="">- Choose Druid Cantrip -</option>
          {druidCantrips.map((s) => {
            const sk = makeEntityKey(s.name, s.source);
            return (
              <option key={sk} value={sk}>
                {s.name} ({s.source})
              </option>
            );
          })}
        </select>
        {spObj && <SelectedDescriptionPreview title={spObj.name} entries={spObj.entries} />}
        {renderSkillPickers(1, ['Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Survival'], 'Primal Lore')}
      </div>
    );
  }
  if (lower === 'magical discoveries') {
    const picked = sel.chosenClassFeatureSpells?.[key] || [];
    const maxSlotLvl = Math.min(9, Math.ceil(sel.level / 2));
    const lorePool = getAvailableSpellsForClass(
      compendium,
      'Cleric',
      'XPHB',
      undefined,
      undefined,
      maxSlotLvl,
      character.preferences.enabledSources,
      character.preferences.ruleset,
      ['Druid', 'Wizard'],
    ).concat(
      getAvailableSpellsForClass(
        compendium,
        'Druid',
        'XPHB',
        undefined,
        undefined,
        0,
        character.preferences.enabledSources,
        character.preferences.ruleset,
      ),
      getAvailableSpellsForClass(
        compendium,
        'Wizard',
        'XPHB',
        undefined,
        undefined,
        0,
        character.preferences.enabledSources,
        character.preferences.ruleset,
      ),
    );
    const dedup = new Map<string, Spell5e>();
    for (const s of lorePool) dedup.set(makeEntityKey(s.name, s.source), s);
    const poolList = [...dedup.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    return (
      <div className="space-y-2 pt-1">
        {[0, 1].map((idx) => {
          const cur = picked[idx] || '';
          const used = new Set(picked.filter((_, i) => i !== idx));
          const spObj = cur ? findSpell(compendium, cur) : undefined;
          return (
            <div key={`md-${idx}`} className="space-y-1.5">
              <select
                aria-label={`Magical Discoveries Spell ${idx + 1}`}
                value={cur}
                onChange={(e) => setFeatureArrayField('chosenClassFeatureSpells', idx, e.target.value)}
                className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium"
              >
                <option value="">- Choose Cleric/Druid/Wizard Spell {idx + 1} -</option>
                {poolList
                  .filter((s) => {
                    const sk = makeEntityKey(s.name, s.source);
                    return sk === cur || !used.has(sk);
                  })
                  .map((s) => {
                    const sk = makeEntityKey(s.name, s.source);
                    return (
                      <option key={sk} value={sk}>
                        {s.name} (L{s.level})
                      </option>
                    );
                  })}
              </select>
              {spObj && <SelectedDescriptionPreview title={spObj.name} entries={spObj.entries} />}
            </div>
          );
        })}
      </div>
    );
  }
  if (lower === 'circle of the land spells') {
    const tables = featureEntries.filter(
      (n): n is Exclude<EntryNode, string> => typeof n === 'object' && n !== null && n.type === 'table' && Boolean(n.caption),
    );
    if (tables.length > 0) {
      return renderNamedOptions(
        tables.map((t) => ({
          value: String(t.caption),
          label: String(t.caption),
          entries: [t],
        })),
      );
    }
  }
  if (lower === 'elemental affinity') {
    return renderNamedOptions(
      ['Acid', 'Cold', 'Fire', 'Lightning', 'Poison'].map((dmg) => ({
        value: dmg,
        label: dmg,
        entries: [`You gain Resistance to ${dmg} damage and add your Charisma modifier to one damage roll of spells dealing ${dmg} damage.`],
      })),
    );
  }
  if (lower === 'aura of elemental shielding') {
    return renderNamedOptions(
      ['Acid', 'Cold', 'Fire', 'Lightning', 'Thunder'].map((dmg) => ({
        value: dmg,
        label: dmg,
        entries: [`You and allies in your Aura of Protection have Resistance to ${dmg} damage.`],
      })),
    );
  }
  if (lower === 'dread allegiance') {
    return renderNamedOptions([
      { value: 'Bane', label: 'Bane (Psychic + Minor Illusion)', entries: ['Gain Psychic damage resistance and Minor Illusion cantrip.'] },
      { value: 'Bhaal', label: 'Bhaal (Poison + Blade Ward)', entries: ['Gain Poison damage resistance and Blade Ward cantrip.'] },
      { value: 'Myrkul', label: 'Myrkul (Necrotic + Chill Touch)', entries: ['Gain Necrotic damage resistance and Chill Touch cantrip.'] },
    ]);
  }
  if (lower === "hunter's prey" || lower === 'defensive tactics' || lower === 'aspect of the wilds') {
    const namedNodes: { name: string; entries: EntryNode[] }[] = [];
    const walk = (nodes: EntryNode[]) => {
      for (const n of nodes) {
        if (!n || typeof n !== 'object') continue;
        if (n.name && Array.isArray(n.entries)) {
          namedNodes.push({ name: n.name, entries: n.entries });
        } else if (Array.isArray(n.entries)) {
          walk(n.entries);
        }
      }
    };
    walk(featureEntries);
    if (namedNodes.length > 0) {
      return renderNamedOptions(
        namedNodes.map((o) => ({ value: o.name, label: o.name, entries: o.entries })),
      );
    }
  }

  return null;
}
