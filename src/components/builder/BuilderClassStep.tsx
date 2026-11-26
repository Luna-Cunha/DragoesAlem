import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ExternalLink, Plus, Search, Shield, Sparkles, Swords, Wand2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AbilityKey, Class5e, ClassFeature5e, EntryNode, Feat5e } from '../../types/5etools';
import type { Character, CharacterClassSelection } from '../../types/character';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  computeCharacter,
  extractClassSkillConfig,
  extractClassToolConfig,
  findBackground,
  findClass,
  findFeat,
  findItem,
  findOptionalFeature,
  findSubclass,
  getAvailableSpellsForClass,
  getCharacterKnownProficiencies,
  getClassAsiLevels,
  getClassExpertiseTiers,
  getClassPreparedSpellLimit,
  getOptionalFeatureCantripConfig,
  getProgressionCount,
  isCoreSource,
  isLessonsOfFirstOnes,
  isSourceAllowed,
  makeEntityKey,
  resolveBackgroundProficiencyState,
  splitEntityKey,
} from '../../engine/rules';
import { stripFiveToolsTags } from '../../services/fiveToolsText';
import { ExpandableEntries } from '../RichEntries';
import { CollapsibleBox } from '../CollapsibleBox';
import { ClassSpellsPanel } from './ClassSpellsPanel';
import {
  ClassOrSubclassExtraControls,
  OptionalFeatureProgressionSlots,
  SelectedDescriptionPreview,
  getFeatureExtraChoiceSummary,
} from './ClassFeatureChoices';
import { FeatSubChoices } from './OriginFeatSelector';

function formatOrdinalLevel(lvl: number): string {
  if (lvl === 1) return '1st level';
  if (lvl === 2) return '2nd level';
  if (lvl === 3) return '3rd level';
  return `${lvl}th level`;
}

function getClassPrimaryAbilityText(cls: Class5e): string {
  if (cls.primaryAbility && cls.primaryAbility.length > 0) {
    const keys = cls.primaryAbility.flatMap((obj) =>
      Object.entries(obj)
        .filter(([, v]) => v === true)
        .map(([k]) => ABILITY_LABELS[k as AbilityKey]?.full || k.toUpperCase()),
    );
    if (keys.length > 0) return keys.join(' or ');
  }
  if (cls.spellcastingAbility) return ABILITY_LABELS[cls.spellcastingAbility].full;
  return cls.proficiency?.map((k) => ABILITY_LABELS[k].full).join(' & ') || 'Varies';
}

function extractClassSummaryText(entries: EntryNode[] | undefined): string {
  if (!entries) return '';
  for (const node of entries) {
    if (typeof node === 'string') {
      const clean = stripFiveToolsTags(node).trim();
      if (clean.length > 40) return clean;
    } else if (node && typeof node === 'object' && Array.isArray(node.entries)) {
      const inner = extractClassSummaryText(node.entries);
      if (inner) return inner;
    }
  }
  return '';
}

function extractInlineOptionRefs(entries: EntryNode[] | undefined): {
  optionalFeatureRefs: string[];
  classFeatureRefs: string[];
  featRefs: string[];
} {
  const optionalFeatureRefs: string[] = [];
  const classFeatureRefs: string[] = [];
  const featRefs: string[] = [];
  if (!entries) return { optionalFeatureRefs, classFeatureRefs, featRefs };

  const walk = (nodes: EntryNode[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      if (node.type === 'refFeat' && typeof (node as Record<string, unknown>).feat === 'string') {
        featRefs.push(String((node as Record<string, unknown>).feat));
      } else if (node.type === 'options' && Array.isArray(node.entries)) {
        for (const sub of node.entries) {
          if (typeof sub === 'object' && sub !== null) {
            if (sub.type === 'refOptionalfeature' && sub.optionalfeature) {
              optionalFeatureRefs.push(sub.optionalfeature);
            } else if (sub.type === 'refClassFeature' && sub.classFeature) {
              classFeatureRefs.push(sub.classFeature);
            }
          }
        }
      } else {
        if (Array.isArray(node.entries)) walk(node.entries);
        if (Array.isArray(node.items)) walk(node.items);
      }
    }
  };
  walk(entries);
  return { optionalFeatureRefs, classFeatureRefs, featRefs };
}

function ClassEmblem({ className, size = 'lg' }: { className: string; size?: 'sm' | 'lg' }) {
  const lower = className.toLowerCase();
  const Icon =
    lower.includes('wizard') || lower.includes('sorcerer') || lower.includes('warlock') || lower.includes('mage')
      ? Wand2
      : lower.includes('fighter') || lower.includes('barbarian') || lower.includes('paladin')
        ? Swords
        : lower.includes('cleric') || lower.includes('druid')
          ? Sparkles
          : Shield;
  const dims = size === 'sm' ? 'w-9 h-9' : 'w-18 h-18';
  const iconDims = size === 'sm' ? 'w-5 h-5' : 'w-9 h-9';
  return (
    <div className={`${dims} rounded-lg bg-gradient-to-br from-[#353b52] to-[#1a1e2b] border border-white/15 flex items-center justify-center shrink-0 shadow-md`}>
      <Icon className={`${iconDims} text-white drop-shadow`} />
    </div>
  );
}

export function BuilderClassStep({
  character,
  onChange,
}: {
  character: Character;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const { compendium, openDrawer } = useApp();
  const [classSearch, setClassSearch] = useState('');
  const [showAddBrowser, setShowAddBrowser] = useState(false);
  const [previewClass, setPreviewClass] = useState<Class5e | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, 'features' | 'spells'>>({});

  const computedSummary = useMemo(
    () => (compendium ? computeCharacter(character, compendium) : null),
    [character, compendium],
  );
  const bgProfState = useMemo(
    () => (compendium ? resolveBackgroundProficiencyState(character, compendium) : null),
    [character, compendium],
  );
  const selectedBg = useMemo(
    () => (compendium ? findBackground(compendium, character.background.backgroundKey) : undefined),
    [compendium, character.background.backgroundKey],
  );

  const availableClasses = useMemo(() => {
    if (!compendium) return [];
    const q = classSearch.trim().toLowerCase();
    return compendium.classes
      .filter((c) => {
        if (!isSourceAllowed(c.source, character.preferences.enabledSources, character.preferences.ruleset, c.edition)) {
          return false;
        }
        return !q || c.name.toLowerCase().includes(q) || c.source.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source));
  }, [compendium, classSearch, character.preferences]);

  const groupedClasses = useMemo(() => {
    if (!compendium) return { core: [] as Class5e[], byBook: [] as { bookName: string; source: string; items: Class5e[] }[] };
    const core = availableClasses.filter((c) => isCoreSource(c.source));
    const supMap = new Map<string, Class5e[]>();
    for (const c of availableClasses) {
      if (isCoreSource(c.source)) continue;
      const arr = supMap.get(c.source) || [];
      arr.push(c);
      supMap.set(c.source, arr);
    }
    const byBook = [...supMap.entries()]
      .map(([src, items]) => {
        const book = compendium.books.find((b) => b.source === src);
        return { bookName: book?.name || src, source: src, items };
      })
      .sort((a, b) => a.bookName.localeCompare(b.bookName));
    return { core, byBook };
  }, [availableClasses, compendium]);

  const availableFeats = useMemo(() => {
    if (!compendium) return [];
    return compendium.feats
      .filter((f) => isSourceAllowed(f.source, character.preferences.enabledSources, character.preferences.ruleset))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [compendium, character.preferences]);

  const masterableWeapons = useMemo(() => {
    if (!compendium) return [];
    const map = new Map<string, (typeof compendium.items)[number]>();
    for (const it of compendium.items) {
      if (!it.weapon || !it.mastery?.length) continue;
      if (!isSourceAllowed(it.source, character.preferences.enabledSources, character.preferences.ruleset, it.edition)) {
        continue;
      }
      const k = it.name.toLowerCase();
      const prev = map.get(k);
      if (!prev || (character.preferences.ruleset === '2024' && it.source === 'XPHB' && prev.source !== 'XPHB')) {
        map.set(k, it);
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [compendium, character.preferences]);

  if (!compendium) return null;

  const totalLevels = character.classes.reduce((s, c) => s + c.level, 0);

  const confirmChooseClass = (cls: Class5e) => {
    const isPrimary = character.classes.length === 0;
    const newEntry: CharacterClassSelection = {
      id: `cls-${cls.name}-${cls.source}-${Date.now()}`,
      className: cls.name,
      classSource: cls.source,
      level: 1,
      isPrimary,
      hpRolls: { 1: cls.hd?.faces || 8 },
      chosenSkills: [],
      chosenTools: [],
      expertiseSkills: [],
      chosenOptionalFeatures: {},
      chosenOptionalFeatureSubChoices: {},
      chosenFeatProgressions: {},
      chosenFeatProgressionChoices: {},
      chosenClassFeatureOptions: {},
      chosenClassFeatureSkills: {},
      chosenClassFeatureTools: {},
      chosenClassFeatureLanguages: {},
      chosenClassFeatureSpells: {},
      chosenWeaponMasteries: [],
      asiChoices: {},
      preparedSpells: [],
      knownSpells: [],
      cantrips: [],
      spellbookSpells: [],
    };
    onChange((prev) => ({
      ...prev,
      classes: [...prev.classes, newEntry],
    }));
    setPreviewClass(null);
    setShowAddBrowser(false);
  };

  const updateClassSel = (id: string, fn: (sel: CharacterClassSelection) => CharacterClassSelection) => {
    onChange((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === id ? fn(c) : c)),
    }));
  };

  const removeClassSel = (id: string) => {
    onChange((prev) => {
      const remaining = prev.classes.filter((c) => c.id !== id);
      if (remaining.length > 0 && !remaining.some((c) => c.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return { ...prev, classes: remaining };
    });
  };

  const resolveClassFeatures = (cls: Class5e, subOptProgNames: Set<string> = new Set()) => {
    const list: { lvl: number; feat: ClassFeature5e; gainSubclassFeature: boolean }[] = [];
    const optProgNames = new Set([
      ...(cls.optionalfeatureProgression || []).map((p) => p.name.toLowerCase()),
      ...subOptProgNames,
    ]);

    for (const cfRef of cls.classFeatures) {
      const refStr = typeof cfRef === 'string' ? cfRef : cfRef.classFeature;
      const gainSubclassFeature = typeof cfRef === 'object' ? Boolean(cfRef.gainSubclassFeature) : false;
      const [fName, fClass, fClassSrc, fLvlStr] = refStr.split('|');
      const fLvl = parseInt(fLvlStr || '1', 10);
      const cfObj = compendium.classFeatures.find(
        (cf) =>
          cf.name.toLowerCase() === fName.toLowerCase() &&
          cf.className.toLowerCase() === (fClass || cls.name).toLowerCase() &&
          cf.classSource.toLowerCase() === (fClassSrc || cls.source).toLowerCase() &&
          cf.level === fLvl,
      );
      if (!cfObj) continue;

      // Deduplicate 5etools "* Options" reference-container entries (e.g. "Eldritch Invocation Options")
      // when the class already defines an optionalfeatureProgression for them
      const isOptionsContainer =
        cfObj.name.toLowerCase().endsWith(' options') &&
        cfObj.entries.every(
          (e) =>
            typeof e === 'string' ||
            (typeof e === 'object' && e !== null && e.type === 'options'),
        ) &&
        optProgNames.size > 0;
      if (isOptionsContainer) continue;

      list.push({ lvl: fLvl, feat: cfObj, gainSubclassFeature });
    }
    return list;
  };

  const showBrowser = character.classes.length === 0 || showAddBrowser;

  return (
    <div className="space-y-6">
      {/* Selected Classes */}
      {character.classes.map((sel) => {
        const cls = findClass(compendium, sel.className, sel.classSource);
        if (!cls) return null;

        const matchingSubclasses = compendium.subclasses
          .filter(
            (s) =>
              s.className.toLowerCase() === cls.name.toLowerCase() &&
              s.classSource.toLowerCase() === cls.source.toLowerCase() &&
              isSourceAllowed(s.source, character.preferences.enabledSources, character.preferences.ruleset, s.edition),
          )
          .sort((a, b) => a.name.localeCompare(b.name));

        const activeSubclass = findSubclass(
          compendium,
          cls.name,
          cls.source,
          sel.subclassName,
          sel.subclassSource,
        );

        const skillCfg = extractClassSkillConfig(cls, sel.isPrimary);
        const skillCount = skillCfg.choiceCount;
        const skillOptions = skillCfg.choicePool;
        const toolCfg = extractClassToolConfig(cls, sel.isPrimary);
        const toolCount = toolCfg.choiceCount;
        const toolOptions = toolCfg.choicePool;
        const chosenToolsList = sel.chosenTools || [];
        const asiLevels = getClassAsiLevels(cls);

        const subOptProgNames = new Set(
          (activeSubclass?.optionalfeatureProgression || []).map((p) => p.name.toLowerCase()),
        );
        const allResolvedFeatures = resolveClassFeatures(cls, subOptProgNames);
        const unlockedFeatures = allResolvedFeatures.filter((x) => x.lvl <= sel.level);
        const higherLevelFeatures = allResolvedFeatures.filter((x) => x.lvl > sel.level);

        const optProgressions = [
          ...(cls.optionalfeatureProgression || []),
          ...(activeSubclass?.optionalfeatureProgression || []),
        ].filter((prog) => getProgressionCount(prog.progression, sel.level) > 0);

        const featProgressions = (cls.featProgression || []).filter((fp) => {
          const lower = fp.name.toLowerCase();
          if (lower.includes('ability') || lower.includes('epic boon') || fp.category?.includes('EB')) {
            return false;
          }
          return getProgressionCount(fp.progression, sel.level) > 0;
        });

        const progression = activeSubclass?.casterProgression || cls.casterProgression;
        const spellAbility = activeSubclass?.spellcastingAbility || cls.spellcastingAbility;
        const maxSpellLevel =
          progression === 'full'
            ? Math.min(9, Math.ceil(sel.level / 2))
            : progression === 'pact'
              ? Math.min(5, Math.ceil(sel.level / 2))
              : progression === '1/2' || progression === 'artificer'
                ? sel.level >= 17 ? 5 : sel.level >= 13 ? 4 : sel.level >= 9 ? 3 : sel.level >= 5 ? 2 : sel.level >= 2 || cls.edition === 'one' ? 1 : 0
                : progression === '1/3'
                  ? sel.level >= 19 ? 4 : sel.level >= 13 ? 3 : sel.level >= 7 ? 2 : sel.level >= 3 ? 1 : 0
                  : 0;

        const cantripOrderBonus = Object.values(sel.chosenClassFeatureOptions || {}).some((v) => {
          const low = v.split('|')[0]?.toLowerCase();
          return low === 'thaumaturge' || low === 'magician';
        })
          ? 1
          : 0;
        const cantripLimit =
          ((activeSubclass?.cantripProgression || cls.cantripProgression)?.[sel.level - 1] ?? 0) +
          cantripOrderBonus;
        const knownLimit = (activeSubclass?.spellsKnownProgression || cls.spellsKnownProgression)?.[sel.level - 1] ?? 0;
        const spellMod = spellAbility ? computedSummary?.abilityScores[spellAbility]?.modifier ?? 0 : 0;
        const preparedLimit = getClassPreparedSpellLimit(cls, activeSubclass, sel.level, spellMod);
        const magicalSecretsClasses =
          cls.name.toLowerCase() === 'bard' && cls.edition === 'one' && sel.level >= 10
            ? ['Cleric', 'Druid', 'Wizard']
            : [];

        const classSpells =
          progression && spellAbility && maxSpellLevel >= 0
            ? getAvailableSpellsForClass(
                compendium,
                cls.name,
                cls.source,
                activeSubclass?.name,
                activeSubclass?.source,
                Math.max(0, maxSpellLevel),
                character.preferences.enabledSources,
                character.preferences.ruleset,
                magicalSecretsClasses,
              )
            : [];

        const expertiseTiers = getClassExpertiseTiers(cls, sel.level);

        const weaponMasteryCount = getProgressionCount(cls.itemMasteriesProgression, sel.level);

        const coreTraitEntries: EntryNode[] = [
          'As a Level 1 Character:',
          {
            type: 'list',
            items: [
              `Gain all the traits in the Core ${cls.name} Traits table (Hit Die d${cls.hd?.faces || 8}, Saves: ${cls.proficiency?.map((p) => ABILITY_LABELS[p].full).join(' & ') || 'None'}).`,
              `Armor: ${cls.startingProficiencies?.armor?.join(', ') || 'None'} · Weapons: ${cls.startingProficiencies?.weapons?.join(', ') || 'None'}${toolCfg.fixed.length > 0 ? ` · Tools: ${toolCfg.fixed.join(', ')}` : ''}.`,
              `Gain the ${cls.name}'s level 1 features.`,
            ],
          },
        ];

        const missingSkills = Math.max(0, skillCount - sel.chosenSkills.length);
        const missingTools = Math.max(0, toolCount - chosenToolsList.length);
        const coreChoiceTotal = skillCount + toolCount;
        const missingCoreChoices = missingSkills + missingTools;
        const currentSubTab = activeSubTab[sel.id] || 'features';

        // Track which progressions have already been attached inside a matching feature card
        const attachedProgressions = new Map<string, number>();
        const attachedFeatProgressions = new Set<string>();
        const attachedExpertiseTiers = new Set<string>();
        let attachedWeaponMastery = false;

        return (
          <div key={sel.id} className="ddb-card p-5 space-y-4">
            {/* D&D Beyond Class Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ClassEmblem className={cls.name} size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{cls.name}</h2>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)] text-[var(--text-muted)] font-bold">
                      {cls.source}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Level</label>
                  <select
                    aria-label={`${cls.name} Level`}
                    value={sel.level}
                    onChange={(e) => {
                      const nextLvl = parseInt(e.target.value, 10);
                      updateClassSel(sel.id, (c) => ({ ...c, level: nextLvl }));
                    }}
                    className="px-3 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] font-mono-num font-bold text-sm"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                      <option key={lvl} value={lvl} disabled={lvl - sel.level + totalLevels > 20}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => removeClassSel(sel.id)}
                  aria-label="Remove Class"
                  title="Remove Class"
                  className="p-1.5 text-[#e40712] hover:bg-[#e40712]/10 rounded cursor-pointer transition"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* CLASS FEATURES / SPELLS Sub-tabs */}
            <div className="flex items-center gap-6 border-b border-[var(--border-color)] text-xs font-extrabold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setActiveSubTab((m) => ({ ...m, [sel.id]: 'features' }))}
                className={`pb-2.5 flex items-center gap-1 cursor-pointer border-b-2 transition ${
                  currentSubTab === 'features'
                    ? 'border-[#5dbbf7] text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Class Features
                <ChevronDown className={`w-3.5 h-3.5 transition ${currentSubTab === 'features' ? 'rotate-180' : ''}`} />
              </button>
              {classSpells.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveSubTab((m) => ({ ...m, [sel.id]: 'spells' }))}
                  className={`pb-2.5 flex items-center gap-1 cursor-pointer border-b-2 transition ${
                    currentSubTab === 'spells'
                      ? 'border-[#5dbbf7] text-[var(--text-primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Spells
                  <ChevronDown className={`w-3.5 h-3.5 transition ${currentSubTab === 'spells' ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {currentSubTab === 'features' && (
              <div className="space-y-3 pt-1">
                {/* 1. Core <Class> Traits Card (with 1st-level Tool & Skill Proficiencies & Hit Points) */}
                <CollapsibleBox
                  title={`Core ${cls.name} Traits`}
                  subtitle={`${coreChoiceTotal > 0 ? `${coreChoiceTotal} ${coreChoiceTotal === 1 ? 'Choice' : 'Choices'} · ` : ''}1st level`}
                  alertDot={missingCoreChoices > 0}
                  accent="plain"
                  defaultOpen
                  bodyClassName="mx-3 mb-3 p-3.5 border border-[#6b7280]/70 bg-[var(--bg-card)] space-y-3"
                >
                  <ExpandableEntries entries={coreTraitEntries} contextTitle={`Core ${cls.name} Traits`} />

                  {toolCount > 0 && toolOptions.length > 0 && (() => {
                    const bgToolSet = new Set(
                      [...(bgProfState?.fixedBgTools || []), ...character.background.chosenTools].map((t) =>
                        t.toLowerCase(),
                      ),
                    );
                    const isInstrumentPool = toolOptions.length <= 12 && toolOptions.includes('Lute');
                    return (
                      <div className="space-y-2 pt-1">
                        {Array.from({ length: toolCount }, (_, slotIdx) => {
                          const currentVal = chosenToolsList[slotIdx] || '';
                          const usedElsewhere = new Set(chosenToolsList.filter((_, idx) => idx !== slotIdx));
                          return (
                            <select
                              key={`tool-${slotIdx}`}
                              aria-label={`${cls.name} Tool Proficiency ${slotIdx + 1}`}
                              value={currentVal}
                              onChange={(e) => {
                                const picked = e.target.value;
                                updateClassSel(sel.id, (c) => {
                                  const next = [...(c.chosenTools || [])];
                                  next[slotIdx] = picked;
                                  return { ...c, chosenTools: next.filter(Boolean) };
                                });
                              }}
                              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                            >
                              <option value="">
                                {isInstrumentPool
                                  ? '- Choose a Musical Instrument -'
                                  : `- Choose a ${cls.name} Tool Proficiency -`}
                              </option>
                              {toolOptions
                                .filter((tl) => !usedElsewhere.has(tl) || tl === currentVal)
                                .map((tl) => {
                                  const fromBg = bgToolSet.has(tl.toLowerCase());
                                  const label = fromBg
                                    ? `${tl} (from ${selectedBg?.name || 'Background'})`
                                    : tl;
                                  return (
                                    <option key={tl} value={tl}>
                                      {label}
                                    </option>
                                  );
                                })}
                            </select>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {skillCount > 0 && skillOptions.length > 0 && (() => {
                    const bgSkillSet = new Set(
                      [...(bgProfState?.fixedBgSkills || []), ...character.background.chosenSkills].map((s) =>
                        s.toLowerCase(),
                      ),
                    );
                    const speciesSkillSet = new Set(
                      [...character.race.chosenSkills, ...(character.race.originFeatChoices?.skills || [])].map((s) =>
                        s.toLowerCase(),
                      ),
                    );
                    return (
                      <div className="space-y-2 pt-1">
                        {Array.from({ length: skillCount }, (_, slotIdx) => {
                          const currentVal = sel.chosenSkills[slotIdx] || '';
                          const usedElsewhere = new Set(
                            sel.chosenSkills.filter((_, idx) => idx !== slotIdx),
                          );
                          return (
                            <select
                              key={slotIdx}
                              aria-label={`${cls.name} Skill Proficiency ${slotIdx + 1}`}
                              value={currentVal}
                              onChange={(e) => {
                                const picked = e.target.value;
                                updateClassSel(sel.id, (c) => {
                                  const next = [...c.chosenSkills];
                                  next[slotIdx] = picked;
                                  return { ...c, chosenSkills: next.filter(Boolean) };
                                });
                              }}
                              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                            >
                              <option value="">- Choose a Skill -</option>
                              {skillOptions
                                .filter((sk) => !usedElsewhere.has(sk) || sk === currentVal)
                                .map((sk) => {
                                  const low = sk.toLowerCase();
                                  const fromBg = bgSkillSet.has(low);
                                  const fromSpecies = speciesSkillSet.has(low);
                                  const tag = fromBg
                                    ? ` (Already from ${selectedBg?.name || 'Background'})`
                                    : fromSpecies
                                      ? ' (Already from Species)'
                                      : '';
                                  return (
                                    <option key={sk} value={sk}>
                                      {sk}
                                      {tag}
                                    </option>
                                  );
                                })}
                            </select>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {bgProfState && (bgProfState.overlappedSkills.length > 0 || bgProfState.overlappedTools.length > 0) && (
                    <div className="p-3 rounded bg-amber-500/10 border border-amber-500/40 space-y-2 text-xs">
                      <div className="font-bold text-amber-300">
                        Background Overlap Detected ({selectedBg?.name}):
                      </div>
                      <div className="text-[var(--text-secondary)]">
                        Overlapping proficiencies convert to free choices on your Background:
                      </div>
                      {bgProfState.skillSlots.map((slot, idx) => {
                        if (slot.kind !== 'replacement') return null;
                        const currentRep = character.background.chosenSkills[idx] || '';
                        const keptSet = new Set(bgProfState.keptFixedSkills.map((s) => s.toLowerCase()));
                        const otherPicked = new Set(
                          character.background.chosenSkills
                            .filter((_, i) => i !== idx)
                            .map((s) => s.toLowerCase()),
                        );
                        return (
                          <div key={`cls-bg-sk-${idx}`} className="space-y-1">
                            <div className="font-semibold text-[var(--text-primary)]">
                              Free Skill Replacement for {slot.replacedName}:
                            </div>
                            <select
                              aria-label={`Class Triggered Background Replacement Skill (${slot.replacedName})`}
                              value={currentRep}
                              onChange={(e) => {
                                const picked = e.target.value;
                                onChange((prev) => {
                                  const next = [...prev.background.chosenSkills];
                                  next[idx] = picked;
                                  return {
                                    ...prev,
                                    background: { ...prev.background, chosenSkills: next.filter(Boolean) },
                                  };
                                });
                              }}
                              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                            >
                              <option value="">- Choose Free Replacement Skill -</option>
                              {slot.pool
                                .filter((opt) => {
                                  const low = opt.toLowerCase();
                                  if (opt === currentRep) return true;
                                  return !keptSet.has(low) && !otherPicked.has(low) && !bgProfState.nonBgSkillSources.has(low);
                                })
                                .map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                            </select>
                          </div>
                        );
                      })}
                      {bgProfState.toolSlots.map((slot, idx) => {
                        if (slot.kind !== 'replacement') return null;
                        const currentRep = character.background.chosenTools[idx] || '';
                        const keptSet = new Set(bgProfState.keptFixedTools.map((t) => t.toLowerCase()));
                        const otherPicked = new Set(
                          character.background.chosenTools
                            .filter((_, i) => i !== idx)
                            .map((t) => t.toLowerCase()),
                        );
                        return (
                          <div key={`cls-bg-tl-${idx}`} className="space-y-1">
                            <div className="font-semibold text-[var(--text-primary)]">
                              Free Tool Replacement for {slot.replacedName}:
                            </div>
                            <select
                              aria-label={`Class Triggered Background Replacement Tool (${slot.replacedName})`}
                              value={currentRep}
                              onChange={(e) => {
                                const picked = e.target.value;
                                onChange((prev) => {
                                  const next = [...prev.background.chosenTools];
                                  next[idx] = picked;
                                  return {
                                    ...prev,
                                    background: { ...prev.background, chosenTools: next.filter(Boolean) },
                                  };
                                });
                              }}
                              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                            >
                              <option value="">- Choose Free Replacement Tool -</option>
                              {slot.pool
                                .filter((opt) => {
                                  const low = opt.toLowerCase();
                                  if (opt === currentRep) return true;
                                  return !keptSet.has(low) && !otherPicked.has(low) && !bgProfState.nonBgToolSources.has(low);
                                })
                                .map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {character.preferences.hpMode === 'manual' && (
                    <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
                      <div className="text-xs font-bold text-[var(--text-secondary)]">
                        Manual HP Rolls (d{cls.hd?.faces} per level)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: sel.level }, (_, i) => i + 1).map((lvl) => {
                          const faces = cls.hd?.faces || 8;
                          const val = sel.isPrimary && lvl === 1 ? faces : sel.hpRolls[lvl] ?? Math.floor(faces / 2) + 1;
                          return (
                            <div key={lvl} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
                              <span className="text-[11px] font-bold text-[var(--text-muted)]">L{lvl}</span>
                              <input
                                type="number"
                                min={1}
                                max={faces}
                                disabled={sel.isPrimary && lvl === 1}
                                value={val}
                                onChange={(e) => {
                                  const num = Math.max(1, Math.min(faces, parseInt(e.target.value, 10) || 1));
                                  updateClassSel(sel.id, (c) => ({ ...c, hpRolls: { ...c.hpRolls, [lvl]: num } }));
                                }}
                                className="w-12 text-center font-mono-num text-xs font-bold bg-transparent focus:outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CollapsibleBox>

                {/* 2. Unified Unlocked Class Features (each rendered ONCE with embedded choices) */}
                {unlockedFeatures.map(({ lvl, feat, gainSubclassFeature }, featIdx) => {
                  const featLower = feat.name.toLowerCase();

                  // Match optionalfeatureProgression (e.g. Eldritch Invocations, Metamagic, Maneuvers)
                  const matchedProg = optProgressions.find(
                    (p) =>
                      p.name.toLowerCase() === featLower ||
                      featLower.includes(p.name.toLowerCase()),
                  );
                  let progSlotStart = 0;
                  let progSlotEnd = 0;
                  if (matchedProg) {
                    const prevCount = attachedProgressions.get(matchedProg.name) || 0;
                    const countAtThisLevel = getProgressionCount(matchedProg.progression, lvl);
                    const totalCountAtClassLvl = getProgressionCount(matchedProg.progression, sel.level);
                    const laterMatchingFeatureExists = unlockedFeatures.some(
                      (other, oIdx) =>
                        oIdx > featIdx &&
                        (other.feat.name.toLowerCase() === matchedProg.name.toLowerCase() ||
                          other.feat.name.toLowerCase().includes(matchedProg.name.toLowerCase())),
                    );
                    const end = laterMatchingFeatureExists
                      ? Math.max(prevCount, countAtThisLevel)
                      : totalCountAtClassLvl;
                    progSlotStart = prevCount;
                    progSlotEnd = end;
                    attachedProgressions.set(matchedProg.name, end);
                  }

                  // Match featProgression (e.g. XPHB Fighter/Paladin/Ranger Fighting Style)
                  const matchedFeatProg = featProgressions.find(
                    (fp) =>
                      !attachedFeatProgressions.has(fp.name) &&
                      (fp.name.toLowerCase() === featLower || featLower.includes(fp.name.toLowerCase())),
                  );
                  if (matchedFeatProg) attachedFeatProgressions.add(matchedFeatProg.name);

                  // Recursively find inline options (refOptionalfeature, refClassFeature, and refFeat such as Blessed Warrior)
                  const inlineExtracted = extractInlineOptionRefs(feat.entries);
                  const inlineRefOptKeys = !matchedProg && !matchedFeatProg ? inlineExtracted.optionalFeatureRefs : [];
                  const inlineRefCfKeys = !matchedProg && !matchedFeatProg ? inlineExtracted.classFeatureRefs : [];
                  const inlineRefFeatKeys = inlineExtracted.featRefs;

                  const isWeaponMastery = weaponMasteryCount > 0 && featLower.includes('weapon mastery') && !attachedWeaponMastery;
                  if (isWeaponMastery) attachedWeaponMastery = true;

                  const matchedExpertiseTier = expertiseTiers.find((tier) => {
                    const tierId = `${tier.featureName}:${tier.unlockLevel}`;
                    return (
                      !attachedExpertiseTiers.has(tierId) &&
                      tier.unlockLevel === lvl &&
                      featLower.includes(tier.featureName.toLowerCase())
                    );
                  });
                  if (matchedExpertiseTier) {
                    attachedExpertiseTiers.add(`${matchedExpertiseTier.featureName}:${matchedExpertiseTier.unlockLevel}`);
                  }

                  const isAsi =
                    asiLevels.includes(lvl) &&
                    (featLower.includes('ability score improvement') || featLower.includes('epic boon'));
                  const isEpicBoonFeature = featLower.includes('epic boon');

                  // Count choices in this single card
                  let choiceCount = 0;
                  let missingCount = 0;

                  const progSliceLen = Math.max(0, progSlotEnd - progSlotStart);
                  const progOptKey = matchedProg ? `prog-${matchedProg.name}` : '';
                  const progPicked = matchedProg ? sel.chosenOptionalFeatures[progOptKey] || [] : [];
                  if (matchedProg && progSliceLen > 0) {
                    choiceCount += progSliceLen;
                    for (let s = progSlotStart; s < progSlotEnd; s++) {
                      const optK = progPicked[s];
                      if (!optK) {
                        missingCount += 1;
                      } else {
                        const optObj = findOptionalFeature(compendium, optK);
                        const subV = sel.chosenOptionalFeatureSubChoices?.[`${progOptKey}:${s}`];
                        if (isLessonsOfFirstOnes(optObj) && !subV?.featKey) missingCount += 1;
                        if (getOptionalFeatureCantripConfig(optObj) && !subV?.cantripKey) missingCount += 1;
                      }
                    }
                  }

                  const featProgLimit = matchedFeatProg
                    ? getProgressionCount(matchedFeatProg.progression, sel.level)
                    : 0;
                  const featProgKey = matchedFeatProg ? `fp-${matchedFeatProg.name}` : '';
                  const featProgPicked = matchedFeatProg ? sel.chosenFeatProgressions?.[featProgKey] || [] : [];
                  if (matchedFeatProg && featProgLimit > 0) {
                    choiceCount += featProgLimit;
                    missingCount += Math.max(0, featProgLimit - featProgPicked.length);
                  }

                  const inlineKey = `cf-${feat.name}-${lvl}`;
                  const inlinePicked = sel.chosenOptionalFeatures[inlineKey] || [];
                  if (inlineRefOptKeys.length > 0) {
                    choiceCount += 1;
                    if (inlinePicked.length === 0) missingCount += 1;
                  }

                  const cfOptionKey = `${feat.name}-${lvl}`;
                  const cfPicked = sel.chosenClassFeatureOptions?.[cfOptionKey] || '';
                  if (inlineRefCfKeys.length > 0) {
                    choiceCount += 1;
                    if (!cfPicked) missingCount += 1;
                  }

                  if (gainSubclassFeature && featIdx === unlockedFeatures.findIndex((f) => f.gainSubclassFeature)) {
                    choiceCount += 1;
                    if (!activeSubclass) missingCount += 1;
                  }

                  if (isWeaponMastery) {
                    choiceCount += weaponMasteryCount;
                    missingCount += Math.max(0, weaponMasteryCount - sel.chosenWeaponMasteries.length);
                  }

                  if (matchedExpertiseTier) {
                    choiceCount += matchedExpertiseTier.count;
                    const tierSlice = sel.expertiseSkills
                      .slice(matchedExpertiseTier.offset, matchedExpertiseTier.offset + matchedExpertiseTier.count)
                      .filter(Boolean);
                    missingCount += Math.max(0, matchedExpertiseTier.count - tierSlice.length);
                  }

                  const extraSummary = getFeatureExtraChoiceSummary({
                    cls,
                    sel,
                    featureName: feat.name,
                    featureLevel: lvl,
                    entries: feat.entries,
                  });
                  choiceCount += extraSummary.choiceCount;
                  missingCount += extraSummary.missingCount;

                  if (isAsi) {
                    choiceCount += 1;
                    const asi = sel.asiChoices[lvl] || { mode: isEpicBoonFeature ? 'feat' : 'asi', abilities: {} };
                    const done =
                      asi.mode === 'feat'
                        ? Boolean(asi.featKey)
                        : ABILITY_KEYS.reduce((s, k) => s + (asi.abilities?.[k] || 0), 0) >= 2;
                    if (!done) missingCount += 1;
                  }

                  const subtitleParts = [];
                  if (choiceCount > 0) {
                    subtitleParts.push(`${choiceCount} ${choiceCount === 1 ? 'Choice' : 'Choices'}`);
                  }
                  subtitleParts.push(formatOrdinalLevel(lvl));

                  const isPrimarySubclassSlot =
                    gainSubclassFeature &&
                    featIdx === unlockedFeatures.findIndex((f) => f.gainSubclassFeature);

                  return (
                    <CollapsibleBox
                      key={`${sel.id}-feat-${lvl}-${feat.name}-${featIdx}`}
                      title={feat.name}
                      subtitle={subtitleParts.join(' · ')}
                      alertDot={missingCount > 0}
                      accent="plain"
                      defaultOpen={choiceCount > 0}
                      bodyClassName="mx-3 mb-3 p-3.5 border border-[#6b7280]/70 bg-[var(--bg-card)] space-y-3"
                    >
                      <ExpandableEntries entries={feat.entries} contextTitle={feat.name} />

                      {/* Optional Feature Progression Dropdowns (e.g. Eldritch Invocations, Metamagic) */}
                      {matchedProg && progSliceLen > 0 && (
                        <OptionalFeatureProgressionSlots
                          prog={matchedProg}
                          progOptKey={progOptKey}
                          slotStart={progSlotStart}
                          slotEnd={progSlotEnd}
                          cls={cls}
                          sel={sel}
                          character={character}
                          compendium={compendium}
                          onUpdateClass={(fn) => updateClassSel(sel.id, fn)}
                        />
                      )}

                      {/* Feat Progression Dropdowns (e.g. XPHB Fighting Style + Blessed Warrior / Druidic Warrior) */}
                      {matchedFeatProg && featProgLimit > 0 && (() => {
                        const inlineFeatSet = new Set(inlineRefFeatKeys.map((fk) => fk.toLowerCase()));
                        const candidates = compendium.feats
                          .filter((ft) => {
                            if (
                              !isSourceAllowed(
                                ft.source,
                                character.preferences.enabledSources,
                                character.preferences.ruleset,
                                ft.edition,
                              )
                            ) {
                              return false;
                            }
                            const ftKeyLow = `${ft.name}|${ft.source}`.toLowerCase();
                            const inCategory = Boolean(ft.category && matchedFeatProg.category.includes(ft.category));
                            return inCategory || inlineFeatSet.has(ftKeyLow) || inlineFeatSet.has(ft.name.toLowerCase());
                          })
                          .sort((a, b) => a.name.localeCompare(b.name));
                        return (
                          <div className="space-y-2.5 pt-1">
                            {Array.from({ length: featProgLimit }, (_, slotIdx) => {
                              const currentVal = featProgPicked[slotIdx] || '';
                              const fpSubKey = `${featProgKey}:${slotIdx}`;
                              const chosenFs = currentVal ? findFeat(compendium, currentVal) : undefined;
                              return (
                                <div key={slotIdx} className="space-y-2">
                                  <select
                                    aria-label={`${matchedFeatProg.name} Option ${slotIdx + 1}`}
                                    value={currentVal}
                                    onChange={(e) => {
                                      const picked = e.target.value;
                                      updateClassSel(sel.id, (c) => {
                                        const prevMap = c.chosenFeatProgressions || {};
                                        const next = [...(prevMap[featProgKey] || [])];
                                        next[slotIdx] = picked;
                                        const prevChoices = { ...(c.chosenFeatProgressionChoices || {}) };
                                        delete prevChoices[fpSubKey];
                                        return {
                                          ...c,
                                          chosenFeatProgressions: {
                                            ...prevMap,
                                            [featProgKey]: next.filter(Boolean),
                                          },
                                          chosenFeatProgressionChoices: prevChoices,
                                        };
                                      });
                                    }}
                                    className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                                  >
                                    <option value="">- Choose {matchedFeatProg.name} -</option>
                                    {candidates.map((ft) => {
                                      const k = makeEntityKey(ft.name, ft.source);
                                      return (
                                        <option key={k} value={k}>
                                          {ft.name} ({ft.source})
                                        </option>
                                      );
                                    })}
                                  </select>
                                  {chosenFs && (
                                    <div className="pl-3 border-l-2 border-[#1b9af0]/60 space-y-2">
                                      <FeatSubChoices
                                        feat={chosenFs}
                                        compendium={compendium}
                                        character={character}
                                        featSlot={{ classId: sel.id, fpSubKey }}
                                        choices={sel.chosenFeatProgressionChoices?.[fpSubKey]}
                                        onChangeChoices={(nextChoices) =>
                                          updateClassSel(sel.id, (c) => ({
                                            ...c,
                                            chosenFeatProgressionChoices: {
                                              ...(c.chosenFeatProgressionChoices || {}),
                                              [fpSubKey]: nextChoices,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* Inline refOptionalfeature (e.g. Classic Fighter Fighting Style) */}
                      {inlineRefOptKeys.length > 0 && (() => {
                        const chosenInlineOpt = inlinePicked[0] ? findOptionalFeature(compendium, inlinePicked[0]) : undefined;
                        return (
                          <div className="space-y-2 pt-1">
                            <select
                              aria-label={`${feat.name} Option`}
                              value={inlinePicked[0] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateClassSel(sel.id, (c) => ({
                                  ...c,
                                  chosenOptionalFeatures: {
                                    ...c.chosenOptionalFeatures,
                                    [inlineKey]: val ? [val] : [],
                                  },
                                }));
                              }}
                              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                            >
                              <option value="">- Choose a {feat.name} -</option>
                              {inlineRefOptKeys.map((ok) => (
                                <option key={ok} value={ok}>
                                  {splitEntityKey(ok).name}
                                  {splitEntityKey(ok).source ? ` (${splitEntityKey(ok).source})` : ''}
                                </option>
                              ))}
                            </select>
                            {chosenInlineOpt && (
                              <SelectedDescriptionPreview title={chosenInlineOpt.name} entries={chosenInlineOpt.entries} />
                            )}
                          </div>
                        );
                      })()}

                      {/* Inline refClassFeature (e.g. Cleric Divine Order & Blessed Strikes, Druid Primal Order & Elemental Fury) */}
                      {inlineRefCfKeys.length > 0 && (() => {
                        const resolvedOptions = inlineRefCfKeys.map((refStr) => {
                          const [oName, oCls, oSrc, oLvlStr] = refStr.split('|');
                          const oLvl = parseInt(oLvlStr || String(lvl), 10);
                          const cfMatch = compendium.classFeatures.find(
                            (cf) =>
                              cf.name.toLowerCase() === (oName || '').toLowerCase() &&
                              cf.className.toLowerCase() === (oCls || cls.name).toLowerCase() &&
                              cf.classSource.toLowerCase() === (oSrc || cls.source).toLowerCase() &&
                              cf.level === oLvl,
                          );
                          return { refStr, label: oName || refStr, cfMatch };
                        });
                        const chosenObj = resolvedOptions.find((o) => o.refStr === cfPicked)?.cfMatch;
                        return (
                          <div className="space-y-2.5 pt-1">
                            <select
                              aria-label={`${feat.name} Option`}
                              value={cfPicked}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateClassSel(sel.id, (c) => ({
                                  ...c,
                                  chosenClassFeatureOptions: {
                                    ...(c.chosenClassFeatureOptions || {}),
                                    [cfOptionKey]: val,
                                  },
                                }));
                              }}
                              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                            >
                              <option value="">- Choose {feat.name} -</option>
                              {resolvedOptions.map((opt) => (
                                <option key={opt.refStr} value={opt.refStr}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {chosenObj && (
                              <SelectedDescriptionPreview title={chosenObj.name} entries={chosenObj.entries} />
                            )}
                          </div>
                        );
                      })()}

                      {/* Subclass Dropdown */}
                      {isPrimarySubclassSlot && (() => {
                        const subIntro = activeSubclass
                          ? compendium.subclassFeatures.find(
                              (sf) =>
                                sf.className.toLowerCase() === cls.name.toLowerCase() &&
                                sf.subclassShortName.toLowerCase() === activeSubclass.shortName.toLowerCase() &&
                                sf.level === lvl &&
                                sf.name.toLowerCase() === activeSubclass.name.toLowerCase(),
                            )
                          : undefined;
                        return (
                          <div className="space-y-2 pt-1">
                            <select
                              aria-label={cls.subclassTitle || 'Subclass'}
                              value={sel.subclassName ? `${sel.subclassName}|${sel.subclassSource}` : ''}
                              onChange={(e) => {
                                const [sName, sSrc] = e.target.value.split('|');
                                updateClassSel(sel.id, (c) => ({
                                  ...c,
                                  subclassName: sName || undefined,
                                  subclassSource: sSrc || undefined,
                                }));
                              }}
                              className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                            >
                              <option value="">- Choose a {cls.subclassTitle || 'Subclass'} -</option>
                              {matchingSubclasses.map((sub) => (
                                <option key={`${sub.name}|${sub.source}`} value={`${sub.name}|${sub.source}`}>
                                  {sub.name} ({sub.source})
                                </option>
                              ))}
                            </select>
                            {subIntro && (
                              <SelectedDescriptionPreview title={subIntro.name} entries={subIntro.entries} />
                            )}
                          </div>
                        );
                      })()}

                      {/* Weapon Mastery Dropdowns + Mastery Descriptions */}
                      {isWeaponMastery && (
                        <div className="space-y-2.5 pt-1">
                          {Array.from({ length: weaponMasteryCount }, (_, slotIdx) => {
                            const currentVal = sel.chosenWeaponMasteries[slotIdx] || '';
                            const usedElsewhere = new Set(
                              sel.chosenWeaponMasteries.filter((_, i) => i !== slotIdx),
                            );
                            const weaponObj = currentVal ? findItem(compendium, currentVal) : undefined;
                            const masteryName = weaponObj?.mastery?.[0] ? splitEntityKey(weaponObj.mastery[0]).name : '';
                            const masteryObj = masteryName
                              ? compendium.itemMasteries.find((m) => m.name.toLowerCase() === masteryName.toLowerCase())
                              : undefined;
                            return (
                              <div key={slotIdx} className="space-y-1.5">
                                <select
                                  aria-label={`Weapon Mastery ${slotIdx + 1}`}
                                  value={currentVal}
                                  onChange={(e) => {
                                    const picked = e.target.value;
                                    updateClassSel(sel.id, (c) => {
                                      const next = [...c.chosenWeaponMasteries];
                                      next[slotIdx] = picked;
                                      return { ...c, chosenWeaponMasteries: next.filter(Boolean) };
                                    });
                                  }}
                                  className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                                >
                                  <option value="">- Choose a Weapon Mastery -</option>
                                  {masterableWeapons
                                    .filter((w) => {
                                      const k = makeEntityKey(w.name, w.source);
                                      return k === currentVal || !usedElsewhere.has(k);
                                    })
                                    .map((w) => {
                                      const k = makeEntityKey(w.name, w.source);
                                      return (
                                        <option key={k} value={k}>
                                          {w.name} ({splitEntityKey(w.mastery?.[0]).name})
                                        </option>
                                      );
                                    })}
                                </select>
                                {masteryObj && (
                                  <SelectedDescriptionPreview title={masteryObj.name} entries={masteryObj.entries} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Expertise Dropdowns (Rogue L1/L6, Bard L2/L9, Ranger L2/L9, Wizard L2 Scholar) */}
                      {matchedExpertiseTier && (() => {
                        const knownProfsForExp = getCharacterKnownProficiencies(character, compendium);
                        const proficientPool = [
                          ...new Set(
                            compendium.skills
                              .map((s) => s.name)
                              .filter((s) => knownProfsForExp.skills.has(s.toLowerCase())),
                          ),
                          ...sel.chosenSkills,
                          ...(bgProfState?.keptFixedSkills || []),
                          ...character.background.chosenSkills,
                          ...character.race.chosenSkills,
                          ...Object.values(sel.chosenClassFeatureSkills || {}).flat(),
                        ].sort((a, b) => a.localeCompare(b));
                        const uniquePool = [...new Set(proficientPool)].filter(
                          (sk) =>
                            !matchedExpertiseTier.pool ||
                            matchedExpertiseTier.pool.some((p) => p.toLowerCase() === sk.toLowerCase()),
                        );

                        return (
                          <div className="space-y-2 pt-1">
                            {Array.from({ length: matchedExpertiseTier.count }, (_, localIdx) => {
                              const absIdx = matchedExpertiseTier.offset + localIdx;
                              const currentVal = sel.expertiseSkills[absIdx] || '';
                              const usedElsewhere = new Set(
                                sel.expertiseSkills.filter((_, idx) => idx !== absIdx).map((s) => s.toLowerCase()),
                              );
                              return (
                                <select
                                  key={absIdx}
                                  aria-label={`${feat.name} Expertise ${localIdx + 1}`}
                                  value={currentVal}
                                  onChange={(e) => {
                                    const picked = e.target.value;
                                    updateClassSel(sel.id, (c) => {
                                      const next = [...c.expertiseSkills];
                                      while (next.length <= absIdx) next.push('');
                                      next[absIdx] = picked;
                                      return { ...c, expertiseSkills: next.map((x) => x || '').slice(0, Math.max(next.length, absIdx + 1)) };
                                    });
                                  }}
                                  className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                                >
                                  <option value="">- Choose Expertise Skill -</option>
                                  {uniquePool
                                    .filter((sk) => sk === currentVal || !usedElsewhere.has(sk.toLowerCase()))
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
                      })()}

                      {/* Additional Selectable Class Features (Thieves' Cant Language, Deft Explorer Languages, Mystic Arcanum, Spell Mastery, Signature Spells) */}
                      <ClassOrSubclassExtraControls
                        cls={cls}
                        sel={sel}
                        character={character}
                        compendium={compendium}
                        featureName={feat.name}
                        featureLevel={lvl}
                        featureEntries={feat.entries}
                        onUpdateClass={(fn) => updateClassSel(sel.id, fn)}
                      />

                      {/* ASI / Feat / Epic Boon Inline Chooser */}
                      {isAsi && (() => {
                        const asi = sel.asiChoices[lvl] || {
                          mode: isEpicBoonFeature ? 'feat' : 'asi',
                          abilities: {},
                        };
                        const chosenFeat: Feat5e | undefined = asi.featKey
                          ? findFeat(compendium, asi.featKey)
                          : undefined;
                        const pointsUsed = ABILITY_KEYS.reduce((s, k) => s + (asi.abilities?.[k] || 0), 0);
                        const orderedFeats = isEpicBoonFeature
                          ? [
                              ...availableFeats.filter((f) => f.category === 'EB'),
                              ...availableFeats.filter((f) => f.category !== 'EB'),
                            ]
                          : [
                              ...availableFeats.filter((f) => f.category !== 'EB'),
                              ...availableFeats.filter((f) => f.category === 'EB'),
                            ];

                        return (
                          <div className="p-3 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)] space-y-2.5">
                            {character.preferences.useFeats && (
                              <div className="flex rounded overflow-hidden border border-[var(--border-color)] w-fit text-[10px] font-bold">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateClassSel(sel.id, (c) => ({
                                      ...c,
                                      asiChoices: { ...c.asiChoices, [lvl]: { mode: 'asi', abilities: {} } },
                                    }))
                                  }
                                  className={`px-2.5 py-1 cursor-pointer ${
                                    asi.mode === 'asi' ? 'bg-[#1b9af0] text-white' : 'bg-[var(--bg-card)]'
                                  }`}
                                >
                                  Ability Score Increase (+2)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateClassSel(sel.id, (c) => ({
                                      ...c,
                                      asiChoices: { ...c.asiChoices, [lvl]: { mode: 'feat' } },
                                    }))
                                  }
                                  className={`px-2.5 py-1 cursor-pointer ${
                                    asi.mode === 'feat' ? 'bg-[#1b9af0] text-white' : 'bg-[var(--bg-card)]'
                                  }`}
                                >
                                  {isEpicBoonFeature ? 'Epic Boon / Feat' : 'Feat'}
                                </button>
                              </div>
                            )}

                            {asi.mode === 'asi' ? (
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                {ABILITY_KEYS.map((ab) => {
                                  const val = asi.abilities?.[ab] || 0;
                                  return (
                                    <div key={ab} className="flex items-center justify-between px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-xs">
                                      <span className="font-bold">{ABILITY_LABELS[ab].short}</span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={val <= 0}
                                          onClick={() =>
                                            updateClassSel(sel.id, (c) => ({
                                              ...c,
                                              asiChoices: {
                                                ...c.asiChoices,
                                                [lvl]: {
                                                  ...asi,
                                                  abilities: { ...asi.abilities, [ab]: Math.max(0, val - 1) },
                                                },
                                              },
                                            }))
                                          }
                                          className="w-4 h-4 rounded bg-[var(--bg-card-alt)] text-[10px] font-bold cursor-pointer disabled:opacity-30"
                                        >
                                          -
                                        </button>
                                        <span className="font-mono-num w-3 text-center">{val}</span>
                                        <button
                                          type="button"
                                          disabled={val >= 2 || pointsUsed >= 2}
                                          onClick={() =>
                                            updateClassSel(sel.id, (c) => ({
                                              ...c,
                                              asiChoices: {
                                                ...c.asiChoices,
                                                [lvl]: {
                                                  ...asi,
                                                  abilities: { ...asi.abilities, [ab]: val + 1 },
                                                },
                                              },
                                            }))
                                          }
                                          className="w-4 h-4 rounded bg-[var(--bg-card-alt)] text-[10px] font-bold cursor-pointer disabled:opacity-30"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <select
                                  aria-label={`${feat.name} Level ${lvl} Feat`}
                                  value={asi.featKey || ''}
                                  onChange={(e) =>
                                    updateClassSel(sel.id, (c) => ({
                                      ...c,
                                      asiChoices: {
                                        ...c.asiChoices,
                                        [lvl]: { mode: 'feat', featKey: e.target.value || undefined },
                                      },
                                    }))
                                  }
                                  className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium"
                                >
                                  <option value="">{isEpicBoonFeature ? '- Choose an Epic Boon or Feat -' : '- Choose a Feat -'}</option>
                                  {orderedFeats.map((ft) => (
                                    <option key={`${ft.name}|${ft.source}`} value={`${ft.name}|${ft.source}`}>
                                      {ft.name} ({ft.source}){ft.category ? ` [${ft.category}]` : ''}
                                    </option>
                                  ))}
                                </select>
                                {chosenFeat && (
                                  <FeatSubChoices
                                    feat={chosenFeat}
                                    compendium={compendium}
                                    character={character}
                                    featSlot={{ classId: sel.id, level: lvl }}
                                    showAbilityChoice
                                    choices={{
                                      abilities: asi.featAbilityChoice,
                                      skills: asi.featSkills,
                                      tools: asi.featTools,
                                      languages: asi.featLanguages,
                                      spells: asi.featSpells,
                                      spellAbility: asi.featSpellAbility,
                                      expertiseSkills: asi.featExpertiseSkills,
                                      resistances: asi.featResistances,
                                    }}
                                    onChangeChoices={(nextChoices) =>
                                      updateClassSel(sel.id, (c) => ({
                                        ...c,
                                        asiChoices: {
                                          ...c.asiChoices,
                                          [lvl]: {
                                            ...asi,
                                            featAbilityChoice: nextChoices.abilities,
                                            featSkills: nextChoices.skills,
                                            featTools: nextChoices.tools,
                                            featLanguages: nextChoices.languages,
                                            featSpells: nextChoices.spells,
                                            featSpellAbility: nextChoices.spellAbility,
                                            featExpertiseSkills: nextChoices.expertiseSkills,
                                            featResistances: nextChoices.resistances,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CollapsibleBox>
                  );
                })}

                {/* Any subclass unlocked features */}
                {activeSubclass &&
                  (activeSubclass.subclassFeatures || []).map((sfRef, sIdx) => {
                    const [sfName, sfClass, , sfSubShort, , sfLvlStr] = sfRef.split('|');
                    const sfLvl = parseInt(sfLvlStr || '3', 10);
                    if (sfLvl > sel.level) return null;
                    const sfObj = compendium.subclassFeatures.find(
                      (sf) =>
                        sf.name.toLowerCase() === sfName.toLowerCase() &&
                        sf.className.toLowerCase() === (sfClass || cls.name).toLowerCase() &&
                        sf.subclassShortName.toLowerCase() === (sfSubShort || activeSubclass.shortName).toLowerCase() &&
                        sf.level === sfLvl,
                    );
                    if (!sfObj) return null;

                    const isSubOptionsContainer =
                      sfObj.name.toLowerCase().endsWith(' options') &&
                      sfObj.entries.every(
                        (e) => typeof e === 'string' || (typeof e === 'object' && e !== null && e.type === 'options'),
                      ) &&
                      subOptProgNames.size > 0;
                    if (isSubOptionsContainer) return null;

                    // Attach subclass optionalfeatureProgression (e.g. Battle Master Maneuvers under Combat Superiority)
                    const sfLower = sfObj.name.toLowerCase();
                    const matchedSubProg = (activeSubclass.optionalfeatureProgression || []).find(
                      (p) =>
                        !attachedProgressions.has(p.name) &&
                        (p.name.toLowerCase() === sfLower ||
                          sfLower.includes(p.name.toLowerCase()) ||
                          sfLower.includes('combat superiority')),
                    );
                    const subProgLimit = matchedSubProg ? getProgressionCount(matchedSubProg.progression, sel.level) : 0;
                    const subProgKey = matchedSubProg ? `prog-${matchedSubProg.name}` : '';
                    const subProgPicked = matchedSubProg ? sel.chosenOptionalFeatures[subProgKey] || [] : [];
                    if (matchedSubProg) {
                      attachedProgressions.set(matchedSubProg.name, subProgLimit);
                    }

                    const subExtra = getFeatureExtraChoiceSummary({
                      cls,
                      sel,
                      featureName: sfObj.name,
                      featureLevel: sfLvl,
                      isSubclass: true,
                      entries: sfObj.entries,
                    });
                    const totalSubChoices = subExtra.choiceCount + subProgLimit;
                    const missingSubChoices =
                      subExtra.missingCount + Math.max(0, subProgLimit - subProgPicked.length);
                    const subSubtitleParts = [];
                    if (totalSubChoices > 0) {
                      subSubtitleParts.push(`${totalSubChoices} ${totalSubChoices === 1 ? 'Choice' : 'Choices'}`);
                    }
                    subSubtitleParts.push(`${activeSubclass.shortName} · ${formatOrdinalLevel(sfLvl)}`);

                    return (
                      <CollapsibleBox
                        key={`${sel.id}-subfeat-${sfLvl}-${sfObj.name}-${sIdx}`}
                        title={sfObj.name}
                        subtitle={subSubtitleParts.join(' · ')}
                        alertDot={missingSubChoices > 0}
                        accent="plain"
                        defaultOpen={totalSubChoices > 0}
                        bodyClassName="mx-3 mb-3 p-3.5 border border-[#6b7280]/70 bg-[var(--bg-card)] space-y-3"
                      >
                        <ExpandableEntries entries={sfObj.entries} contextTitle={sfObj.name} />
                        {matchedSubProg && subProgLimit > 0 && (
                          <OptionalFeatureProgressionSlots
                            prog={matchedSubProg}
                            progOptKey={subProgKey}
                            slotStart={0}
                            slotEnd={subProgLimit}
                            cls={cls}
                            sel={sel}
                            character={character}
                            compendium={compendium}
                            onUpdateClass={(fn) => updateClassSel(sel.id, fn)}
                          />
                        )}
                        <ClassOrSubclassExtraControls
                          cls={cls}
                          sel={sel}
                          character={character}
                          compendium={compendium}
                          featureName={sfObj.name}
                          featureLevel={sfLvl}
                          featureEntries={sfObj.entries}
                          isSubclass
                          onUpdateClass={(fn) => updateClassSel(sel.id, fn)}
                        />
                      </CollapsibleBox>
                    );
                  })}

                {/* Fallback for any optionalfeatureProgression not matched by feature name (e.g. Pact Boon at L3 in 2014) */}
                {optProgressions
                  .filter((p) => !attachedProgressions.has(p.name))
                  .map((prog) => {
                    const limit = getProgressionCount(prog.progression, sel.level);
                    const optKey = `prog-${prog.name}`;
                    const picked = sel.chosenOptionalFeatures[optKey] || [];
                    return (
                      <CollapsibleBox
                        key={optKey}
                        title={prog.name}
                        subtitle={`${limit} ${limit === 1 ? 'Choice' : 'Choices'}`}
                        alertDot={picked.length < limit}
                        accent="plain"
                        defaultOpen
                        bodyClassName="mx-3 mb-3 p-3.5 border border-[#6b7280]/70 bg-[var(--bg-card)] space-y-2"
                      >
                        <OptionalFeatureProgressionSlots
                          prog={prog}
                          progOptKey={optKey}
                          slotStart={0}
                          slotEnd={limit}
                          cls={cls}
                          sel={sel}
                          character={character}
                          compendium={compendium}
                          onUpdateClass={(fn) => updateClassSel(sel.id, fn)}
                        />
                      </CollapsibleBox>
                    );
                  })}

                {/* Collapsible "Available at Higher Levels" */}
                {higherLevelFeatures.length > 0 && (
                  <div className="pt-2">
                    <CollapsibleBox
                      title="Available at Higher Levels"
                      subtitle={`${higherLevelFeatures.length} upcoming features (Levels ${sel.level + 1}–20)`}
                      accent="muted"
                      defaultOpen={false}
                    >
                      <div className="space-y-2">
                        {higherLevelFeatures.map(({ lvl, feat }, idx) => (
                          <CollapsibleBox
                            key={`${sel.id}-higher-${feat.name}-${lvl}-${idx}`}
                            title={feat.name}
                            subtitle={formatOrdinalLevel(lvl)}
                            accent="plain"
                            defaultOpen={false}
                            bodyClassName="mx-3 mb-3 p-3.5 border border-[#6b7280]/70 bg-[var(--bg-card)]"
                          >
                            <ExpandableEntries entries={feat.entries} contextTitle={feat.name} />
                          </CollapsibleBox>
                        ))}
                      </div>
                    </CollapsibleBox>
                  </div>
                )}
              </div>
            )}

            {/* SPELLS Sub-tab */}
            {currentSubTab === 'spells' && classSpells.length > 0 && (
              <ClassSpellsPanel
                sel={sel}
                spells={classSpells}
                allCompendiumSpells={compendium.spells}
                books={compendium.books}
                cantripLimit={cantripLimit}
                preparedLimit={preparedLimit}
                knownLimit={knownLimit}
                maxSpellLevel={maxSpellLevel}
                onUpdateSelection={(fn) => updateClassSel(sel.id, fn)}
              />
            )}
          </div>
        );
      })}

      {/* Add Another Class CTA (Multiclassing) */}
      {character.classes.length > 0 && character.preferences.allowMulticlassing && totalLevels < 20 && !showAddBrowser && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowAddBrowser(true)}
            className="px-5 py-2.5 ddb-btn-blue text-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Another Class (Multiclass)
          </button>
        </div>
      )}

      {/* Class Selection Browser (Core & Books) */}
      {showBrowser && (
        <div className="ddb-card ddb-card-accent p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#e40712]" />
                {character.classes.length === 0 ? 'Choose a Class' : 'Add Another Class'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Select any class below to preview its hit die, proficiencies, and level progression.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  placeholder="Search classes..."
                  className="w-full pl-9 pr-3 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs"
                />
              </div>
              {character.classes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddBrowser(false)}
                  className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Core Rules Section */}
          {groupedClasses.core.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#e40712] border-b border-[var(--border-color)] pb-1">
                Core Rules
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedClasses.core.map((cls) => (
                  <button
                    key={`${cls.name}|${cls.source}`}
                    type="button"
                    onClick={() => setPreviewClass(cls)}
                    className="p-4 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-[#1b9af0] text-left transition cursor-pointer group flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-base group-hover:text-[#1b9af0]">
                        {cls.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border-color)]">
                        {cls.source}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                      <div>Hit Die: d{cls.hd?.faces} · Saves: {cls.proficiency?.map((s) => s.toUpperCase()).join(', ')}</div>
                      {cls.casterProgression && (
                        <div className="text-[#1b9af0] font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Spellcaster ({cls.spellcastingAbility?.toUpperCase()})
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Other Books / Supplements */}
          {groupedClasses.byBook.map((grp) => (
            <div key={grp.source} className="space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-1">
                {grp.bookName} ({grp.source})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grp.items.map((cls) => (
                  <button
                    key={`${cls.name}|${cls.source}`}
                    type="button"
                    onClick={() => setPreviewClass(cls)}
                    className="p-4 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-[#1b9af0] text-left transition cursor-pointer group flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-base group-hover:text-[#1b9af0]">
                        {cls.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border-color)]">
                        {cls.source}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      Hit Die: d{cls.hd?.faces} · Saves: {cls.proficiency?.map((s) => s.toUpperCase()).join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* D&D Beyond "CONFIRM ADD CLASS" Modal */}
      {previewClass && (() => {
        const previewBook = compendium.books.find((b) => b.source === previewClass.source);
        const fluffMatch =
          compendium.classFluff?.find(
            (fl) =>
              fl.name.toLowerCase() === previewClass.name.toLowerCase() &&
              fl.source.toLowerCase() === previewClass.source.toLowerCase(),
          ) ||
          compendium.classFluff?.find((fl) => fl.name.toLowerCase() === previewClass.name.toLowerCase());
        const introSummary =
          extractClassSummaryText(fluffMatch?.entries) ||
          `${previewClass.name}s wield a ${previewClass.hd?.faces ? `d${previewClass.hd.faces}` : 'd8'} Hit Die and excel with ${getClassPrimaryAbilityText(previewClass)}.`;

        const allModalFeatures = resolveClassFeatures(previewClass);
        const coreTraitEntries: EntryNode[] = [
          `{@b Hit Point Die:} d${previewClass.hd?.faces || 8} per ${previewClass.name} level`,
          `{@b Primary Ability:} ${getClassPrimaryAbilityText(previewClass)}`,
          `{@b Saving Throw Proficiencies:} ${previewClass.proficiency?.map((p) => ABILITY_LABELS[p].full).join(', ') || 'None'}`,
          `{@b Armor Training:} ${previewClass.startingProficiencies?.armor?.join(', ') || 'None'}`,
          `{@b Weapon Proficiencies:} ${previewClass.startingProficiencies?.weapons?.join(', ') || 'None'}`,
          ...(previewClass.startingProficiencies?.skills?.[0]?.choose
            ? [
                `{@b Skill Proficiencies:} Choose ${previewClass.startingProficiencies.skills[0].choose.count || 2} from ${previewClass.startingProficiencies.skills[0].choose.from.join(', ')}`,
              ]
            : []),
        ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Confirm Add ${previewClass.name}`}>
            <div className="fixed inset-0 bg-black/75" onClick={() => setPreviewClass(null)} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-lg max-h-[90vh] rounded bg-[var(--bg-page)] border border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 bg-[#1d2226] text-white flex items-center justify-between border-b border-[var(--border-color)]">
                <h3 className="font-bold text-base uppercase tracking-wide">CONFIRM ADD CLASS</h3>
                <button
                  type="button"
                  onClick={() => setPreviewClass(null)}
                  className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-2xl font-normal text-[var(--text-primary)] leading-tight">
                      {previewClass.name}
                    </h4>
                    <div className="text-xs italic text-[var(--text-secondary)] mt-1">
                      {previewBook?.name || previewClass.source}
                    </div>
                  </div>
                  <ClassEmblem className={previewClass.name} />
                </div>

                <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                  {introSummary}
                </p>

                <div className="space-y-1 text-sm text-[var(--text-primary)]">
                  <div>
                    <strong className="font-bold">Primary Ability:</strong> {getClassPrimaryAbilityText(previewClass)}
                  </div>
                  <div>
                    <strong className="font-bold">Hit Point Die:</strong> D{previewClass.hd?.faces || 8}
                  </div>
                  <div>
                    <strong className="font-bold">Saves:</strong>{' '}
                    {previewClass.proficiency?.map((p) => ABILITY_LABELS[p].full).join(' & ') || 'None'}
                  </div>
                </div>

                <div className="border-y border-[var(--border-color)] py-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      openDrawer({
                        title: `${previewClass.name} Details`,
                        subtitle: previewBook?.name || previewClass.source,
                        source: previewClass.source,
                        page: previewClass.page,
                        metaRows: [
                          { label: 'Primary Ability', value: getClassPrimaryAbilityText(previewClass) },
                          { label: 'Hit Die', value: `d${previewClass.hd?.faces || 8}` },
                          {
                            label: 'Saves',
                            value: previewClass.proficiency?.map((p) => ABILITY_LABELS[p].full).join(', ') || 'None',
                          },
                          {
                            label: 'Subclass Title',
                            value: previewClass.subclassTitle || 'Subclass',
                          },
                        ],
                        entries: fluffMatch?.entries || coreTraitEntries,
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ddb-blue)] hover:underline cursor-pointer"
                  >
                    {previewClass.name} Details Page
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <CollapsibleBox
                    title={`Core ${previewClass.name} Traits`}
                    subtitle="1st level"
                    accent="plain"
                    defaultOpen={false}
                    bodyClassName="mx-3 mb-3 p-3.5 border border-[#6b7280]/70 bg-[var(--bg-card)]"
                  >
                    <ExpandableEntries entries={coreTraitEntries} contextTitle={`Core ${previewClass.name} Traits`} />
                  </CollapsibleBox>

                  {allModalFeatures.map(({ lvl, feat }, idx) => (
                    <CollapsibleBox
                      key={`modal-feat-${lvl}-${feat.name}-${idx}`}
                      title={feat.name}
                      subtitle={formatOrdinalLevel(lvl)}
                      accent="plain"
                      defaultOpen={false}
                      bodyClassName="mx-3 mb-3 p-3.5 border border-[#6b7280]/70 bg-[var(--bg-card)]"
                    >
                      <ExpandableEntries entries={feat.entries} contextTitle={feat.name} />
                    </CollapsibleBox>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setPreviewClass(null)}
                  className="py-3.5 bg-[#6e767e] hover:bg-[#5c636a] text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer transition"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => confirmChooseClass(previewClass)}
                  className="py-3.5 bg-[#5cb85c] hover:bg-[#4ca64c] text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer transition"
                >
                  ADD CLASS
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
