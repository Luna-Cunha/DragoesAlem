import { useMemo } from 'react';
import type { AbilityKey, CompiledCompendium, Feat5e } from '../../types/5etools';
import type { Character, OriginFeatChoicesData } from '../../types/character';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  GENERAL_TOOL_LIST,
  MUSICAL_INSTRUMENT_LIST,
  STANDARD_SKILLS,
  extractFeatProficiencyConfig,
  findFeat,
  getAvailableSpellsForClass,
  getCharacterKnownProficiencies,
  groupBySourceCategory,
  isSourceAllowed,
  makeEntityKey,
  type FeatSlotIdentifier,
} from '../../engine/rules';
import { RichEntries } from '../RichEntries';

const RESISTANCE_DAMAGE_POOL = [
  'Acid',
  'Cold',
  'Fire',
  'Lightning',
  'Necrotic',
  'Poison',
  'Psychic',
  'Radiant',
  'Thunder',
];

export type OriginFeatChoiceState = OriginFeatChoicesData;

export function FeatSubChoices({
  feat,
  compendium,
  character,
  choices,
  featSlot,
  extraExcludedSkills,
  showAbilityChoice = false,
  onChangeChoices,
}: {
  feat: Feat5e;
  compendium: CompiledCompendium;
  character: Character;
  choices?: OriginFeatChoicesData;
  featSlot?: FeatSlotIdentifier;
  extraExcludedSkills?: Set<string>;
  showAbilityChoice?: boolean;
  onChangeChoices: (next: OriginFeatChoicesData) => void;
}) {
  const languageNames = useMemo(
    () =>
      compendium.languages
        .filter((l) => isSourceAllowed(l.source, character.preferences.enabledSources, character.preferences.ruleset))
        .map((l) => l.name)
        .sort((a, b) => a.localeCompare(b)),
    [compendium.languages, character.preferences],
  );

  const known = useMemo(
    () => getCharacterKnownProficiencies(character, compendium, { excludeFeatSlot: featSlot }),
    [character, compendium, featSlot],
  );

  const excludedSkills = useMemo(() => {
    if (!extraExcludedSkills?.size) return known.skills;
    return new Set([...known.skills, ...extraExcludedSkills]);
  }, [known.skills, extraExcludedSkills]);

  const cfg = useMemo(() => {
    const parsed = extractFeatProficiencyConfig(feat, languageNames);
    if (parsed.mixedCount === 0 && feat.name.toLowerCase() === 'skilled') {
      return {
        ...parsed,
        mixedCount: 3,
        mixedSkillsPool: STANDARD_SKILLS.map((s) => s.name),
        mixedToolsPool: GENERAL_TOOL_LIST,
      };
    }
    return parsed;
  }, [feat, languageNames]);

  const abilityChooseBlock = showAbilityChoice ? feat.ability?.find((a) => a.choose)?.choose : undefined;
  const currentAbilityKey = choices?.abilities
    ? (Object.keys(choices.abilities).find((k) => (choices.abilities?.[k as AbilityKey] || 0) > 0) || '')
    : '';

  const instrumentSet = new Set(MUSICAL_INSTRUMENT_LIST);
  const allInstruments = cfg.toolPool.length > 0 && cfg.toolPool.every((t) => instrumentSet.has(t));

  // Combined slot representation for mixed Skills OR Tools (e.g. Skilled)
  const mixedTokens: string[] = [
    ...(choices?.skills || []).map((s) => `skill:${s}`),
    ...(choices?.tools || []).map((t) => `tool:${t}`),
  ];

  const updateMixedSlot = (slotIdx: number, token: string) => {
    const padded = Array.from({ length: cfg.mixedCount }, (_, i) => mixedTokens[i] || '');
    padded[slotIdx] = token;
    const nextSkills: string[] = [];
    const nextTools: string[] = [];
    for (const tok of padded) {
      if (tok.startsWith('skill:')) nextSkills.push(tok.slice(6));
      else if (tok.startsWith('tool:')) nextTools.push(tok.slice(5));
    }
    onChangeChoices({ ...choices, skills: nextSkills, tools: nextTools });
  };

  return (
    <div className="space-y-3">
      {abilityChooseBlock && (
        <select
          aria-label={`${feat.name} Ability Score Increase`}
          value={currentAbilityKey}
          onChange={(e) => {
            const k = e.target.value as AbilityKey;
            onChangeChoices({ ...choices, abilities: k ? { [k]: abilityChooseBlock.amount || 1 } : undefined });
          }}
          className="px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-xs font-medium focus:outline-none"
        >
          <option value="">-- +{abilityChooseBlock.amount || 1} Ability Choice --</option>
          {(abilityChooseBlock.from || ABILITY_KEYS).map((ab) => (
            <option key={ab} value={ab}>
              {ABILITY_LABELS[ab].full}
            </option>
          ))}
        </select>
      )}

      {/* Skill Choices (e.g. Keen Mind, Observant, Skill Expert, Purple Dragon Rook, Prodigy) */}
      {cfg.skillCount > 0 && cfg.skillPool.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-[var(--text-secondary)]">
            {feat.name}: Choose {cfg.skillCount} Skill{cfg.skillCount > 1 ? 's' : ''} ({(choices?.skills || []).length}/{cfg.skillCount})
          </div>
          {Array.from({ length: cfg.skillCount }, (_, slotIdx) => {
            const currSkills = choices?.skills || [];
            const currentVal = currSkills[slotIdx] || '';
            const usedElsewhere = new Set(currSkills.filter((_, i) => i !== slotIdx));
            return (
              <select
                key={`fsk-${slotIdx}`}
                aria-label={`${feat.name} Skill Choice ${slotIdx + 1}`}
                value={currentVal}
                onChange={(e) => {
                  const next = [...currSkills];
                  next[slotIdx] = e.target.value;
                  onChangeChoices({ ...choices, skills: next.filter(Boolean) });
                }}
                className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
              >
                <option value="">- Choose a Skill Proficiency -</option>
                {cfg.skillPool
                  .filter((opt) => opt === currentVal || (!usedElsewhere.has(opt) && !excludedSkills.has(opt.toLowerCase())))
                  .map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
            );
          })}
        </div>
      )}

      {/* Tool / Musical Instrument Choices (e.g. Musician, Crafter, Harper Agent, Artificer Initiate) */}
      {cfg.toolCount > 0 && cfg.toolPool.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-[var(--text-secondary)]">
            {feat.name}: Choose {cfg.toolCount}{' '}
            {allInstruments ? `Musical Instrument${cfg.toolCount > 1 ? 's' : ''}` : `Tool${cfg.toolCount > 1 ? 's' : ''}`} (
            {(choices?.tools || []).length}/{cfg.toolCount})
          </div>
          {Array.from({ length: cfg.toolCount }, (_, slotIdx) => {
            const currTools = choices?.tools || [];
            const currentVal = currTools[slotIdx] || '';
            const usedElsewhere = new Set(currTools.filter((_, i) => i !== slotIdx));
            return (
              <select
                key={`ftl-${slotIdx}`}
                aria-label={`${feat.name} Tool Choice ${slotIdx + 1}`}
                value={currentVal}
                onChange={(e) => {
                  const next = [...currTools];
                  next[slotIdx] = e.target.value;
                  onChangeChoices({ ...choices, tools: next.filter(Boolean) });
                }}
                className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
              >
                <option value="">
                  {allInstruments ? '- Choose a Musical Instrument -' : '- Choose a Tool Proficiency -'}
                </option>
                {cfg.toolPool
                  .filter((opt) => opt === currentVal || (!usedElsewhere.has(opt) && !known.tools.has(opt.toLowerCase())))
                  .map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
            );
          })}
        </div>
      )}

      {/* Mixed Skill or Tool Choices (e.g. Skilled: 3 Skills or Tools) */}
      {cfg.mixedCount > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-[var(--text-secondary)]">
            {feat.name}: Choose {cfg.mixedCount} Skills or Tools ({mixedTokens.filter(Boolean).length}/{cfg.mixedCount})
          </div>
          {Array.from({ length: cfg.mixedCount }, (_, slotIdx) => {
            const currentTok = mixedTokens[slotIdx] || '';
            const usedTokens = new Set(mixedTokens.filter((_, i) => i !== slotIdx));
            const availSkills = cfg.mixedSkillsPool.filter((sk) => {
              const tok = `skill:${sk}`;
              return tok === currentTok || (!usedTokens.has(tok) && !excludedSkills.has(sk.toLowerCase()));
            });
            const availTools = cfg.mixedToolsPool.filter((tl) => {
              const tok = `tool:${tl}`;
              return tok === currentTok || (!usedTokens.has(tok) && !known.tools.has(tl.toLowerCase()));
            });
            return (
              <select
                key={`fmix-${slotIdx}`}
                aria-label={`${feat.name} Proficiency Choice ${slotIdx + 1}`}
                value={currentTok}
                onChange={(e) => updateMixedSlot(slotIdx, e.target.value)}
                className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
              >
                <option value="">- Choose a Skill or Tool -</option>
                {availSkills.length > 0 && (
                  <optgroup label="Skills">
                    {availSkills.map((sk) => (
                      <option key={`skill:${sk}`} value={`skill:${sk}`}>
                        {sk}
                      </option>
                    ))}
                  </optgroup>
                )}
                {availTools.length > 0 && (
                  <optgroup label="Tools">
                    {availTools.map((tl) => (
                      <option key={`tool:${tl}`} value={`tool:${tl}`}>
                        {tl}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            );
          })}
        </div>
      )}

      {/* Language Choices (e.g. Linguist, Cult of the Dragon Initiate, Prodigy) */}
      {cfg.languageCount > 0 && cfg.languagePool.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-[var(--text-secondary)]">
            {feat.name}: Choose {cfg.languageCount} Language{cfg.languageCount > 1 ? 's' : ''} (
            {(choices?.languages || []).length}/{cfg.languageCount})
          </div>
          {Array.from({ length: cfg.languageCount }, (_, slotIdx) => {
            const currLangs = choices?.languages || [];
            const currentVal = currLangs[slotIdx] || '';
            const usedElsewhere = new Set(currLangs.filter((_, i) => i !== slotIdx));
            return (
              <select
                key={`flang-${slotIdx}`}
                aria-label={`${feat.name} Language Choice ${slotIdx + 1}`}
                value={currentVal}
                onChange={(e) => {
                  const next = [...currLangs];
                  next[slotIdx] = e.target.value;
                  onChangeChoices({ ...choices, languages: next.filter(Boolean) });
                }}
                className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
              >
                <option value="">- Choose a Language -</option>
                {cfg.languagePool
                  .filter((opt) => opt === currentVal || (!usedElsewhere.has(opt) && !known.languages.has(opt.toLowerCase())))
                  .map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
            );
          })}
        </div>
      )}

      {/* Magic Initiate Spells */}
      {feat.name.toLowerCase().includes('magic initiate') && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold">Spell List:</span>
            <select
              value={choices?.spellList || 'Wizard'}
              onChange={(e) =>
                onChangeChoices({
                  ...choices,
                  spellList: e.target.value,
                  spells: [],
                })
              }
              className="px-2 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-color)]"
            >
              {['Cleric', 'Druid', 'Wizard'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="font-bold">Spell Ability:</span>
            <select
              value={choices?.spellAbility || 'int'}
              onChange={(e) =>
                onChangeChoices({
                  ...choices,
                  spellAbility: e.target.value as AbilityKey,
                })
              }
              className="px-2 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-color)]"
            >
              <option value="int">Intelligence</option>
              <option value="wis">Wisdom</option>
              <option value="cha">Charisma</option>
            </select>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Pick 2 Cantrips and 1 Level 1 Spell ({choices?.spells?.length || 0}/3 selected):
          </div>
          <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 pr-1">
            {getAvailableSpellsForClass(
              compendium,
              choices?.spellList || 'Wizard',
              character.preferences.ruleset === '2014' ? 'PHB' : 'XPHB',
              undefined,
              undefined,
              1,
              character.preferences.enabledSources,
              character.preferences.ruleset,
            ).map((sp) => {
              const spKey = makeEntityKey(sp.name, sp.source);
              const chosen = choices?.spells || [];
              const isPicked = chosen.includes(spKey);
              return (
                <button
                  key={spKey}
                  type="button"
                  onClick={() => {
                    const next = isPicked
                      ? chosen.filter((x) => x !== spKey)
                      : chosen.length < 3
                        ? [...chosen, spKey]
                        : chosen;
                    onChangeChoices({ ...choices, spells: next });
                  }}
                  className={`px-2 py-1 rounded border text-left text-[11px] flex justify-between cursor-pointer ${
                    isPicked
                      ? 'bg-[#1b9af0]/15 border-[#1b9af0] font-bold'
                      : 'bg-[var(--bg-card-alt)] border-[var(--border-color)]'
                  }`}
                >
                  <span className="truncate">{sp.name}</span>
                  <span className="font-mono-num text-[10px]">{sp.level === 0 ? 'C' : 'L1'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feat Expertise (e.g. Skill Expert, Boon of Skill) */}
      {(feat.name.toLowerCase() === 'skill expert' || feat.name.toLowerCase() === 'boon of skill') && (() => {
        const expPool =
          feat.name.toLowerCase() === 'boon of skill'
            ? STANDARD_SKILLS.map((s) => s.name)
            : STANDARD_SKILLS.map((s) => s.name).filter((n) => known.skills.has(n.toLowerCase()) || (choices?.skills || []).includes(n));
        const val = choices?.expertiseSkills?.[0] || '';
        return (
          <div className="space-y-1">
            <div className="text-xs text-[var(--text-secondary)]">
              {feat.name}: Choose 1 Skill for Expertise
            </div>
            <select
              aria-label={`${feat.name} Expertise Choice`}
              value={val}
              onChange={(e) => onChangeChoices({ ...choices, expertiseSkills: e.target.value ? [e.target.value] : [] })}
              className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
            >
              <option value="">- Choose Expertise Skill -</option>
              {expPool.map((sk) => (
                <option key={sk} value={sk}>
                  {sk}
                </option>
              ))}
            </select>
          </div>
        );
      })()}

      {/* Energy Resistance Choice (e.g. Boon of Energy Resistance) */}
      {feat.name.toLowerCase() === 'boon of energy resistance' && (
        <div className="space-y-2">
          <div className="text-xs text-[var(--text-secondary)]">
            {feat.name}: Choose 2 Damage Resistances ({(choices?.resistances || []).length}/2)
          </div>
          {Array.from({ length: 2 }, (_, slotIdx) => {
            const curr = choices?.resistances || [];
            const val = curr[slotIdx] || '';
            const usedElsewhere = new Set(curr.filter((_, i) => i !== slotIdx));
            return (
              <select
                key={`fres-${slotIdx}`}
                aria-label={`${feat.name} Resistance ${slotIdx + 1}`}
                value={val}
                onChange={(e) => {
                  const next = [...curr];
                  next[slotIdx] = e.target.value;
                  onChangeChoices({ ...choices, resistances: next.filter(Boolean) });
                }}
                className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
              >
                <option value="">- Choose Damage Resistance -</option>
                {RESISTANCE_DAMAGE_POOL.filter((d) => d === val || !usedElsewhere.has(d)).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            );
          })}
        </div>
      )}

      {/* Fighting Style Feat Spells (Blessed Warrior / Druidic Warrior) */}
      {(feat.name.toLowerCase() === 'blessed warrior' || feat.name.toLowerCase() === 'druidic warrior') && (() => {
        const listCls = feat.name.toLowerCase() === 'blessed warrior' ? 'Cleric' : 'Druid';
        const cantrips = getAvailableSpellsForClass(
          compendium,
          listCls,
          character.preferences.ruleset === '2014' ? 'PHB' : 'XPHB',
          undefined,
          undefined,
          0,
          character.preferences.enabledSources,
          character.preferences.ruleset,
        );
        const picked = choices?.spells || [];
        return (
          <div className="space-y-2">
            <div className="text-xs text-[var(--text-secondary)]">
              {feat.name}: Choose 2 {listCls} Cantrips ({picked.length}/2)
            </div>
            {Array.from({ length: 2 }, (_, slotIdx) => {
              const cur = picked[slotIdx] || '';
              const usedElsewhere = new Set(picked.filter((_, i) => i !== slotIdx));
              return (
                <select
                  key={`fcan-${slotIdx}`}
                  aria-label={`${feat.name} Cantrip ${slotIdx + 1}`}
                  value={cur}
                  onChange={(e) => {
                    const next = [...picked];
                    next[slotIdx] = e.target.value;
                    onChangeChoices({ ...choices, spells: next.filter(Boolean) });
                  }}
                  className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-medium focus:outline-none"
                >
                  <option value="">- Choose {listCls} Cantrip -</option>
                  {cantrips
                    .filter((sp) => {
                      const k = makeEntityKey(sp.name, sp.source);
                      return k === cur || !usedElsewhere.has(k);
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

      <RichEntries entries={feat.entries} contextTitle={feat.name} />
    </div>
  );
}

export function OriginFeatSelector({
  compendium,
  character,
  featKey,
  featChoices,
  allowAnyCategory = false,
  featSlot,
  excludedSkills,
  excludedFeatKeys,
  selectAriaLabel = 'Choose Origin Feat',
  placeholder = '-- Select Origin Feat --',
  onChangeFeatKey,
  onChangeFeatChoices,
}: {
  compendium: CompiledCompendium;
  character: Character;
  featKey?: string;
  featChoices?: OriginFeatChoiceState;
  allowAnyCategory?: boolean;
  featSlot?: FeatSlotIdentifier;
  excludedSkills?: Set<string>;
  excludedFeatKeys?: Set<string>;
  selectAriaLabel?: string;
  placeholder?: string;
  onChangeFeatKey: (nextKey: string | undefined) => void;
  onChangeFeatChoices: (nextChoices: OriginFeatChoiceState) => void;
}) {
  const feats = useMemo(() => {
    const excludedLower = new Set([...(excludedFeatKeys || [])].map((k) => k.toLowerCase()));
    const currentLower = (featKey || '').toLowerCase();
    return compendium.feats
      .filter((f) => {
        if (!allowAnyCategory) {
          const validOrigin =
            f.category === 'O' || (!f.category && character.preferences.ruleset !== '2024');
          if (!validOrigin) return false;
        }
        if (
          !isSourceAllowed(
            f.source,
            character.preferences.enabledSources,
            character.preferences.ruleset,
            f.edition,
          )
        ) {
          return false;
        }
        const k = `${f.name}|${f.source}`.toLowerCase();
        if (k !== currentLower && !f.repeatable && (excludedLower.has(k) || excludedLower.has(f.name.toLowerCase()))) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [compendium.feats, allowAnyCategory, character.preferences, excludedFeatKeys, featKey]);

  const groupedFeats = useMemo(
    () => groupBySourceCategory(feats, compendium.books),
    [feats, compendium.books],
  );

  const activeFeat: Feat5e | undefined = featKey
    ? findFeat(compendium, featKey.includes('|') ? featKey : `${featKey}|XPHB`) ||
      compendium.feats.find((f) => featKey.toLowerCase().startsWith(f.name.toLowerCase()))
    : undefined;

  return (
    <div className="space-y-3">
      <select
        aria-label={selectAriaLabel}
        value={featKey || ''}
        onChange={(e) => onChangeFeatKey(e.target.value || undefined)}
        className="w-full sm:max-w-md px-3 py-2 rounded bg-[var(--bg-input)] border border-[#1b9af0] text-sm font-semibold focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {groupedFeats.map((grp) => (
          <optgroup key={grp.id} label={grp.label}>
            {grp.items.map((ft) => (
              <option key={`${ft.name}|${ft.source}`} value={`${ft.name}|${ft.source}`}>
                {ft.name} ({ft.source})
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {activeFeat && (
        <FeatSubChoices
          feat={activeFeat}
          compendium={compendium}
          character={character}
          choices={featChoices}
          featSlot={featSlot}
          extraExcludedSkills={excludedSkills}
          onChangeChoices={onChangeFeatChoices}
        />
      )}
    </div>
  );
}
