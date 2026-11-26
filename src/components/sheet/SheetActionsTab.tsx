import { useState } from 'react';
import { Sparkles, Swords } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatSigned } from '../../engine/rules';
import type { Character, ComputedCharacter, ComputedFeatureEntry } from '../../types/character';
import { RichEntries } from '../RichEntries';

type ActionSubFilter = 'all' | 'attack' | 'action' | 'bonus' | 'reaction' | 'other' | 'limited';

const FILTER_TABS: { id: ActionSubFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'attack', label: 'Attack' },
  { id: 'action', label: 'Action' },
  { id: 'bonus', label: 'Bonus Action' },
  { id: 'reaction', label: 'Reaction' },
  { id: 'other', label: 'Other' },
  { id: 'limited', label: 'Limited Use' },
];

const STANDARD_ACTION_NAMES = new Set([
  'Attack',
  'Dash',
  'Disengage',
  'Dodge',
  'Grapple',
  'Help',
  'Hide',
  'Improvise',
  'Influence',
  'Magic',
  'Ready',
  'Search',
  'Shove',
  'Study',
  'Utilize',
]);

function LimitedUseControls({
  feature,
  used,
  onSetUsed,
}: {
  feature: ComputedFeatureEntry;
  used: number;
  onSetUsed: (nextUsed: number) => void;
}) {
  const lu = feature.limitedUse;
  if (!lu) return null;

  if (lu.max <= 8) {
    return (
      <div className="flex items-center gap-1 shrink-0" title={`${lu.max - used}/${lu.max} remaining (${lu.resetOn} rest)`}>
        {Array.from({ length: lu.max }, (_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`${feature.name} use ${idx + 1}`}
            onClick={() => onSetUsed(idx < used ? idx : idx + 1)}
            className={`w-3.5 h-3.5 rounded-[2px] border cursor-pointer transition ${
              idx < used
                ? 'bg-transparent border-[#4b5563]'
                : 'bg-[#7f292e] border-[#a8464c]'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => onSetUsed(Math.max(0, used - 1))}
        className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/15 font-bold cursor-pointer text-white text-xs"
      >
        -
      </button>
      <span className="font-mono-num font-bold text-white text-xs">
        {lu.max - used}/{lu.max}
      </span>
      <button
        type="button"
        onClick={() => onSetUsed(Math.min(lu.max, used + 1))}
        className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/15 font-bold cursor-pointer text-white text-xs"
      >
        +
      </button>
    </div>
  );
}

function FeatureActionBlock({
  feature,
  used,
  onSetUsed,
  onInspect,
}: {
  feature: ComputedFeatureEntry;
  used: number;
  onSetUsed: (nextUsed: number) => void;
  onInspect: () => void;
}) {
  return (
    <div className="py-2.5 border-b border-white/[0.07] last:border-b-0 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onInspect}
          className="text-left group cursor-pointer"
        >
          <span className="font-bold text-xs text-white group-hover:underline">
            {feature.name}
          </span>
          <span className="ml-2 text-[10px] text-[#9ca3af]">
            {feature.sourceLabel}
            {feature.limitedUse ? ` · ${feature.limitedUse.max}/${feature.limitedUse.resetOn === 'short' ? 'Short Rest' : 'Long Rest'}` : ''}
          </span>
        </button>

        {feature.limitedUse && (
          <LimitedUseControls feature={feature} used={used} onSetUsed={onSetUsed} />
        )}
      </div>

      <div className="text-xs text-[#d1d5db] leading-relaxed">
        <RichEntries entries={feature.entries as never} contextTitle={feature.name} />
      </div>
    </div>
  );
}

export function SheetActionsTab({
  character,
  computed,
  onChange,
}: {
  character: Character;
  computed: ComputedCharacter;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const { compendium, rollD20, rollExpression, openDrawer } = useApp();
  const [filter, setFilter] = useState<ActionSubFilter>('all');

  if (!compendium) return null;

  const attacksPerAction = computed.features.some((f) => /extra attack/i.test(f.name)) ? 2 : 1;

  const actionFeatures = computed.features.filter((f) => f.actionType === 'action');
  const bonusFeatures = computed.features.filter((f) => f.actionType === 'bonus');
  const reactionFeatures = computed.features.filter((f) => f.actionType === 'reaction');
  const otherFeatures = computed.features.filter((f) => f.actionType === 'other');
  const limitedFeatures = computed.features.filter((f) => Boolean(f.limitedUse));

  const standardCombatActions = compendium.actions
    .filter((a, idx, arr) => arr.findIndex((x) => x.name === a.name) === idx)
    .filter((a) => STANDARD_ACTION_NAMES.has(a.name) || a.time?.some((t) => t.unit === 'action'))
    .slice(0, 18);

  const twoWeaponAction = compendium.actions.find((a) => /two-weapon fighting/i.test(a.name));
  const oppAttackAction = compendium.actions.find((a) => /opportunity attack/i.test(a.name));

  const setFeatureUsed = (featureId: string, nextUsed: number) => {
    onChange((p) => ({
      ...p,
      playState: {
        ...p.playState,
        featureUses: { ...p.playState.featureUses, [featureId]: nextUsed },
      },
    }));
  };

  const openFeatureDrawer = (f: ComputedFeatureEntry) =>
    openDrawer({
      title: f.name,
      subtitle: f.sourceLabel,
      source: f.source,
      page: f.page,
      entries: f.entries as never,
    });

  return (
    <div className="space-y-3">
      {/* Sub-filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`px-2.5 py-1 rounded-[3px] text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition ${
              filter === t.id
                ? 'bg-[#7f292e] border-[#a8464c] text-white'
                : 'bg-[#191c22] border-white/15 text-[#b4bcc6] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable Actions Content */}
      <div className="max-h-[580px] overflow-y-auto pr-2 space-y-5">
        {/* ACTIONS SECTION */}
        {(filter === 'all' || filter === 'attack' || filter === 'action') && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/15 pb-1">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                <span className="text-[#c96f74]">Actions</span>
                <span className="text-[#9ca3af] font-normal">
                  · Attacks per Action: <strong className="text-white">{attacksPerAction}</strong>
                </span>
              </div>
            </div>

            {/* Attacks & Cantrips Table */}
            {(filter === 'all' || filter === 'attack') && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#d1d5db] flex items-center gap-1.5 pb-1">
                  <Swords className="w-3 h-3 text-[#9ca3af]" />
                  Attacks &amp; Cantrips
                </div>
                <div className="grid grid-cols-[1.5fr_64px_60px_84px_1fr] gap-2 px-1.5 text-[9px] font-bold uppercase tracking-wider text-[#9ca3af]">
                  <span>Attack</span>
                  <span>Range</span>
                  <span className="text-center">Hit / DC</span>
                  <span>Damage</span>
                  <span className="hidden sm:block">Notes</span>
                </div>
                <div className="divide-y divide-white/[0.07]">
                  {computed.attacks.map((atk) => (
                    <div
                      key={atk.id}
                      className="py-2 px-1.5 grid grid-cols-[1.5fr_64px_60px_84px] sm:grid-cols-[1.5fr_64px_60px_84px_1fr] items-center gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white italic truncate">
                          {atk.sourceSpellKey ? (
                            <button
                              type="button"
                              onClick={() =>
                                openDrawer({
                                  title: atk.name,
                                  subtitle: atk.attackType,
                                  metaRows: [
                                    { label: 'Range', value: atk.range },
                                    { label: 'Damage', value: `${atk.damageDice} ${atk.damageType}` },
                                  ],
                                })
                              }
                              className="hover:underline cursor-pointer text-left text-white italic"
                            >
                              {atk.name}
                            </button>
                          ) : (
                            atk.name
                          )}
                        </div>
                        <div className="text-[10px] text-[#9ca3af] truncate">{atk.attackType}</div>
                      </div>

                      <div className="text-[11px] font-semibold text-[#e5e7eb] truncate">
                        {atk.range}
                      </div>

                      <div className="flex justify-center">
                        {atk.toHit !== null ? (
                          <button
                            type="button"
                            onClick={() => rollD20(atk.toHit!, `${atk.name} To Hit`, 'Attack Roll')}
                            className="sheet-roll-box px-2 py-0.5 font-mono-num font-bold text-xs cursor-pointer"
                            title="Roll Attack"
                          >
                            {formatSigned(atk.toHit)}
                          </button>
                        ) : atk.saveDc ? (
                          <span className="px-1.5 py-0.5 rounded-[3px] bg-white/[0.04] border border-white/15 font-mono-num text-[11px] font-bold text-[#e5e7eb]">
                            DC {atk.saveDc}
                          </span>
                        ) : (
                          <span className="text-[#6b7280]">—</span>
                        )}
                      </div>

                      <div>
                        {atk.damageDice && atk.damageDice !== '—' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const expr =
                                atk.damageBonus !== 0
                                  ? `${atk.damageDice}${formatSigned(atk.damageBonus)}`
                                  : atk.damageDice;
                              rollExpression(expr, `${atk.name} Damage`, 'Damage Roll', atk.damageType);
                            }}
                            className="sheet-roll-box px-2 py-0.5 font-mono-num font-bold text-[11px] cursor-pointer truncate max-w-full"
                            title={`Roll ${atk.damageDice} ${atk.damageType}`}
                          >
                            {atk.damageDice}
                            {atk.damageBonus !== 0 ? formatSigned(atk.damageBonus) : ''}
                          </button>
                        ) : (
                          <span className="text-[#6b7280]">—</span>
                        )}
                      </div>

                      <div className="hidden sm:block text-[10px] text-[#9ca3af] truncate">
                        {[...atk.properties, ...(atk.mastery || []).map((m) => `Mastery: ${m}`)].join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions in Combat & Feature Actions */}
            {(filter === 'all' || filter === 'action') && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <div className="text-[11px] font-bold text-white mb-1">Actions in Combat</div>
                  <div className="border-l-2 border-[#7f292e] pl-3 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#d1d5db]">
                    {standardCombatActions.map((act, idx) => (
                      <button
                        key={`${act.name}|${act.source}`}
                        type="button"
                        onClick={() =>
                          openDrawer({
                            title: act.name,
                            subtitle: 'Combat Action',
                            source: act.source,
                            page: act.page,
                            entries: act.entries,
                          })
                        }
                        className="hover:text-white hover:underline cursor-pointer"
                      >
                        {act.name}
                        {idx < standardCombatActions.length - 1 ? ',' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {actionFeatures.map((f) => (
                  <FeatureActionBlock
                    key={f.id}
                    feature={f}
                    used={character.playState.featureUses[f.id] || 0}
                    onSetUsed={(val) => setFeatureUsed(f.id, val)}
                    onInspect={() => openFeatureDrawer(f)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* BONUS ACTIONS SECTION */}
        {(filter === 'all' || filter === 'bonus') && (
          <section className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#c96f74] border-b border-white/15 pb-1">
              Bonus Actions
            </div>
            <div>
              <div className="text-[11px] font-bold text-white mb-1">Actions in Combat</div>
              <div className="border-l-2 border-[#7f292e] pl-3 text-xs text-[#d1d5db]">
                <button
                  type="button"
                  onClick={() =>
                    openDrawer({
                      title: 'Two-Weapon Fighting',
                      subtitle: 'Bonus Action in Combat',
                      source: twoWeaponAction?.source || 'XPHB',
                      entries:
                        twoWeaponAction?.entries || [
                          'When you take the Attack action with a Light weapon, you can make one extra attack as a Bonus Action later on the same turn with a different Light weapon.',
                        ],
                    })
                  }
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  Two-Weapon Fighting
                </button>
              </div>
            </div>

            {bonusFeatures.length === 0 ? (
              filter === 'bonus' && (
                <div className="text-xs text-[#9ca3af]">No additional Bonus Action features.</div>
              )
            ) : (
              bonusFeatures.map((f) => (
                <FeatureActionBlock
                  key={f.id}
                  feature={f}
                  used={character.playState.featureUses[f.id] || 0}
                  onSetUsed={(val) => setFeatureUsed(f.id, val)}
                  onInspect={() => openFeatureDrawer(f)}
                />
              ))
            )}
          </section>
        )}

        {/* REACTIONS SECTION */}
        {(filter === 'all' || filter === 'reaction') && (
          <section className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#c96f74] border-b border-white/15 pb-1">
              Reactions
            </div>
            <div>
              <div className="text-[11px] font-bold text-white mb-1">Actions in Combat</div>
              <div className="border-l-2 border-[#7f292e] pl-3 text-xs text-[#d1d5db]">
                <button
                  type="button"
                  onClick={() =>
                    openDrawer({
                      title: 'Opportunity Attack',
                      subtitle: 'Reaction in Combat',
                      source: oppAttackAction?.source || 'XPHB',
                      entries:
                        oppAttackAction?.entries || [
                          'You can make an Opportunity Attack when a hostile creature you can see leaves your reach using its Action, Bonus Action, Reaction, or Speed.',
                        ],
                    })
                  }
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  Opportunity Attack
                </button>
              </div>
            </div>

            {reactionFeatures.length === 0 ? (
              filter === 'reaction' && (
                <div className="text-xs text-[#9ca3af]">No additional Reaction features.</div>
              )
            ) : (
              reactionFeatures.map((f) => (
                <FeatureActionBlock
                  key={f.id}
                  feature={f}
                  used={character.playState.featureUses[f.id] || 0}
                  onSetUsed={(val) => setFeatureUsed(f.id, val)}
                  onInspect={() => openFeatureDrawer(f)}
                />
              ))
            )}
          </section>
        )}

        {/* OTHER SECTION */}
        {(filter === 'other' || (filter === 'all' && otherFeatures.length > 0)) && (
          <section className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#c96f74] border-b border-white/15 pb-1">
              Other
            </div>
            {otherFeatures.length === 0 ? (
              <div className="text-xs text-[#9ca3af]">No special triggered traits.</div>
            ) : (
              otherFeatures.map((f) => (
                <FeatureActionBlock
                  key={f.id}
                  feature={f}
                  used={character.playState.featureUses[f.id] || 0}
                  onSetUsed={(val) => setFeatureUsed(f.id, val)}
                  onInspect={() => openFeatureDrawer(f)}
                />
              ))
            )}
          </section>
        )}

        {/* LIMITED USE SECTION */}
        {filter === 'limited' && (
          <section className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#c96f74] border-b border-white/15 pb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#c96f74]" />
              Limited Use
            </div>
            {limitedFeatures.length === 0 ? (
              <div className="text-xs text-[#9ca3af]">
                No limited-use abilities from your species, class, or background yet.
              </div>
            ) : (
              <div className="space-y-2">
                {limitedFeatures.map((f) => {
                  const lu = f.limitedUse!;
                  const used = character.playState.featureUses[f.id] || 0;
                  return (
                    <div
                      key={f.id}
                      className="p-2.5 rounded-[4px] bg-white/[0.03] border border-white/15 flex items-center justify-between gap-3 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => openFeatureDrawer(f)}
                        className="text-left hover:underline cursor-pointer min-w-0"
                      >
                        <div className="font-bold text-white truncate">{f.name}</div>
                        <div className="text-[10px] text-[#9ca3af]">
                          {f.sourceLabel} · {lu.max} / {lu.resetOn === 'short' ? 'Short Rest' : 'Long Rest'}
                        </div>
                      </button>
                      <LimitedUseControls
                        feature={f}
                        used={used}
                        onSetUsed={(val) => setFeatureUsed(f.id, val)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
