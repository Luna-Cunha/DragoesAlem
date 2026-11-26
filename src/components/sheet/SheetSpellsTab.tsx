import { useState } from 'react';
import { Flame, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Spell5e } from '../../types/5etools';
import type { Character, ComputedCharacter } from '../../types/character';
import { findSpell, formatSigned, makeEntityKey } from '../../engine/rules';

export function SheetSpellsTab({
  character,
  computed,
  onChange,
}: {
  character: Character;
  computed: ComputedCharacter;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const { compendium, openReferenceByTag, rollD20, rollExpression } = useApp();
  const [manageOpen, setManageOpen] = useState(false);
  const [search, setSearch] = useState('');

  if (!compendium) return null;

  const toggleSlot = (lvl: number, idx: number) => {
    onChange((p) => {
      const curr = p.playState.spellSlotsUsed[lvl] || 0;
      const next = idx < curr ? idx : idx + 1;
      return {
        ...p,
        playState: {
          ...p.playState,
          spellSlotsUsed: { ...p.playState.spellSlotsUsed, [lvl]: next },
        },
      };
    });
  };

  const togglePactSlot = (idx: number) => {
    onChange((p) => {
      const curr = p.playState.pactSlotsUsed || 0;
      const next = idx < curr ? idx : idx + 1;
      return { ...p, playState: { ...p.playState, pactSlotsUsed: next } };
    });
  };

  const castSpell = (sp: Spell5e, spellAttackBonus: number) => {
    const isConc = sp.duration?.some((d) => d.concentration);
    onChange((p) => {
      const nextSlots = { ...p.playState.spellSlotsUsed };
      let nextPact = p.playState.pactSlotsUsed || 0;

      if (sp.level > 0) {
        const maxLvlSlots = computed.spellSlots[sp.level] || 0;
        const usedLvlSlots = nextSlots[sp.level] || 0;
        if (usedLvlSlots < maxLvlSlots) {
          nextSlots[sp.level] = usedLvlSlots + 1;
        } else if (computed.pactSlots && sp.level <= computed.pactSlots.level && nextPact < computed.pactSlots.count) {
          nextPact += 1;
        }
      }

      return {
        ...p,
        playState: {
          ...p.playState,
          spellSlotsUsed: nextSlots,
          pactSlotsUsed: nextPact,
          concentratingOn: isConc ? sp.name : p.playState.concentratingOn,
        },
      };
    });

    if (sp.spellAttack?.length) {
      rollD20(spellAttackBonus, `${sp.name} (Spell Attack)`, 'Spellcast');
    } else {
      const txt = JSON.stringify(sp.entries);
      const dmgMatch = txt.match(/\{@damage ([^}|]+)/);
      if (dmgMatch) {
        rollExpression(dmgMatch[1], `${sp.name} Damage`, 'Spellcast');
      }
    }
  };

  // Collect all active spells grouped by level
  const collected: { spell: Spell5e; sourceLabel: string; attackBonus: number; uses?: string }[] = [];
  const seenKeys = new Set<string>();

  for (const grp of computed.spellGroups) {
    const clsSel = character.classes.find((c) => c.id === grp.classId);
    const list = [
      ...(clsSel?.cantrips || []).map((k) => ({ k, label: grp.className })),
      ...(clsSel?.preparedSpells || []).map((k) => ({ k, label: grp.className })),
      ...(clsSel?.knownSpells || []).map((k) => ({ k, label: grp.className })),
      ...grp.alwaysPreparedKeys.map((k) => ({ k, label: `${grp.subclassName || grp.className} (Always)` })),
      ...grp.innateSpells.map((i) => ({ k: i.spellKey, label: `${grp.className} (${i.uses})` })),
    ];

    for (const item of list) {
      const sp = findSpell(compendium, item.k);
      if (!sp) continue;
      const uniq = `${grp.classId}-${sp.name.toLowerCase()}`;
      if (seenKeys.has(uniq)) continue;
      seenKeys.add(uniq);
      collected.push({
        spell: sp,
        sourceLabel: item.label,
        attackBonus: grp.spellAttackBonus,
      });
    }
  }

  const byLevel = new Map<number, typeof collected>();
  for (const entry of collected) {
    const arr = byLevel.get(entry.spell.level) || [];
    arr.push(entry);
    byLevel.set(entry.spell.level, arr);
  }
  const sortedLevels = [...byLevel.keys()].sort((a, b) => a - b);

  const hasSlots = Object.values(computed.spellSlots).some((n) => n > 0) || Boolean(computed.pactSlots);

  return (
    <div className="space-y-4">
      {/* Spellcasting Header Stats */}
      {computed.spellGroups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {computed.spellGroups.map((grp) => (
            <div
              key={grp.classId}
              className="p-3 rounded-lg bg-[var(--bg-card-alt)] border border-[var(--border-color)] flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
                  {grp.className} ({grp.ability.toUpperCase()})
                </div>
                <div className="text-xs font-semibold text-[#d1d5db]">
                  Save DC <strong className="font-mono-num text-white">{grp.spellSaveDc}</strong> · Atk{' '}
                  <strong className="font-mono-num text-white">{formatSigned(grp.spellAttackBonus)}</strong>
                </div>
              </div>
              {grp.classId !== 'innate-origin' && (
                <button
                  type="button"
                  onClick={() => setManageOpen((v) => !v)}
                  className="px-2.5 py-1 rounded bg-white/[0.04] border border-white/15 hover:border-white/40 text-white text-[10px] font-bold uppercase cursor-pointer"
                >
                  {manageOpen ? 'Done' : 'Manage'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Concentration Indicator */}
      {character.playState.concentratingOn && (
        <div className="px-3 py-2 rounded-[4px] bg-white/[0.06] border border-white/25 flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-semibold text-white">
            <Flame className="w-4 h-4 text-[#d1d5db]" />
            Concentrating on: <strong>{character.playState.concentratingOn}</strong>
          </span>
          <button
            type="button"
            onClick={() =>
              onChange((p) => ({ ...p, playState: { ...p.playState, concentratingOn: undefined } }))
            }
            className="text-[#9ca3af] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Spell Slots Tracker */}
      {hasSlots && (
        <div className="p-3.5 rounded-xl bg-[var(--bg-card-alt)] border border-[var(--border-color)] space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Spell Slots
          </div>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((lvl) => {
              const count = computed.spellSlots[lvl] || 0;
              if (count === 0) return null;
              const used = character.playState.spellSlotsUsed[lvl] || 0;
              return (
                <div key={lvl} className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <div className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">
                    Level {lvl} ({Math.max(0, count - used)}/{count})
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: count }, (_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleSlot(lvl, idx)}
                        aria-label={`Toggle Level ${lvl} slot ${idx + 1}`}
                        className={`w-4 h-4 rounded-[2px] border cursor-pointer transition ${
                          idx < used
                            ? 'bg-transparent border-[#4b5563]'
                            : 'bg-[#7f292e] border-[#a8464c]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {computed.pactSlots && computed.pactSlots.count > 0 && (
              <div className="px-2.5 py-1.5 rounded-[4px] bg-white/[0.04] border border-white/20">
                <div className="text-[10px] font-bold uppercase text-[#d1d5db] mb-1">
                  Pact L{computed.pactSlots.level} (
                  {Math.max(0, computed.pactSlots.count - (character.playState.pactSlotsUsed || 0))}/
                  {computed.pactSlots.count})
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: computed.pactSlots.count }, (_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => togglePactSlot(idx)}
                      className={`w-4 h-4 rounded-[2px] border cursor-pointer transition ${
                        idx < (character.playState.pactSlotsUsed || 0)
                          ? 'bg-transparent border-[#4b5563]'
                          : 'bg-[#7f292e] border-[#a8464c]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage / Prepare Spells Drawer Inline */}
      {manageOpen && (
        <div className="p-4 rounded-[4px] bg-white/[0.04] border border-white/20 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Manage / Prepare Spells
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search spell list..."
              className="px-2.5 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs"
            />
          </div>

          {computed.spellGroups
            .filter((g) => g.classId !== 'innate-origin')
            .map((grp) => {
              const clsSel = character.classes.find((c) => c.id === grp.classId);
              if (!clsSel) return null;
              return (
                <div key={grp.classId} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[var(--text-secondary)]">
                    {grp.className} List
                  </div>
                  <div className="max-h-52 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
                    {grp.availableSpellKeys
                      .filter((k) => !search.trim() || k.toLowerCase().includes(search.trim().toLowerCase()))
                      .map((sk) => {
                        const sp = findSpell(compendium, sk);
                        if (!sp) return null;
                        const key = makeEntityKey(sp.name, sp.source);
                        const isCantrip = sp.level === 0;
                        const selected = isCantrip
                          ? clsSel.cantrips.includes(key)
                          : grp.preparedLimit > 0
                            ? clsSel.preparedSpells.includes(key)
                            : clsSel.knownSpells.includes(key);

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              onChange((p) => ({
                                ...p,
                                classes: p.classes.map((c) => {
                                  if (c.id !== clsSel.id) return c;
                                  if (isCantrip) {
                                    return {
                                      ...c,
                                      cantrips: selected
                                        ? c.cantrips.filter((x) => x !== key)
                                        : [...c.cantrips, key],
                                    };
                                  }
                                  if (grp.preparedLimit > 0) {
                                    return {
                                      ...c,
                                      preparedSpells: selected
                                        ? c.preparedSpells.filter((x) => x !== key)
                                        : [...c.preparedSpells, key],
                                    };
                                  }
                                  return {
                                    ...c,
                                    knownSpells: selected
                                      ? c.knownSpells.filter((x) => x !== key)
                                      : [...c.knownSpells, key],
                                  };
                                }),
                              }))
                            }
                            className={`px-2.5 py-1 rounded border text-left text-xs flex items-center justify-between cursor-pointer ${
                              selected
                                ? 'bg-[var(--accent-soft)] border-[var(--accent)] font-bold'
                                : 'bg-[var(--bg-card)] border-[var(--border-color)]'
                            }`}
                          >
                            <span className="truncate">{sp.name}</span>
                            <span className="text-[10px] font-mono-num">{sp.level === 0 ? 'C' : `L${sp.level}`}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Active Spells List */}
      {sortedLevels.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-xl">
          <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40" />
          No spells prepared or known yet. Add spells in the Class step or click Manage above.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedLevels.map((lvl) => (
            <div key={lvl} className="space-y-1.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-white/10 pb-1">
                {lvl === 0 ? 'Cantrips (At Will)' : `Level ${lvl} Spells`}
              </div>
              <div className="divide-y divide-white/[0.08] rounded-[4px] border border-white/15 overflow-hidden">
                {byLevel.get(lvl)!.map((entry) => {
                  const sp = entry.spell;
                  const isConc = sp.duration?.some((d) => d.concentration);
                  const isRitual = sp.meta?.ritual;
                  const timeStr = sp.time?.map((t) => `${t.number} ${t.unit}`).join(', ') || '1 action';
                  const rangeStr = sp.range?.distance?.amount
                    ? `${sp.range.distance.amount} ft.`
                    : sp.range?.type || 'Self';

                  return (
                    <div
                      key={`${lvl}-${sp.name}-${entry.sourceLabel}`}
                      className="px-3 py-2 bg-white/[0.03] flex items-center justify-between gap-3 text-xs hover:bg-white/[0.06] transition"
                    >
                      <button
                        type="button"
                        onClick={() => openReferenceByTag('spell', sp.name, sp.source)}
                        className="min-w-0 text-left flex-1 cursor-pointer group"
                      >
                        <div className="font-bold text-white group-hover:underline flex items-center gap-1.5 truncate">
                          {sp.name}
                          {isConc && (
                            <span className="px-1 rounded-[2px] text-[9px] bg-white/10 text-[#d1d5db] border border-white/20">
                              C
                            </span>
                          )}
                          {isRitual && (
                            <span className="px-1 rounded-[2px] text-[9px] bg-white/10 text-[#d1d5db] border border-white/20">
                              R
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#9ca3af] truncate">
                          {timeStr} · {rangeStr} · {entry.sourceLabel}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => castSpell(sp, entry.attackBonus)}
                        className="px-2.5 py-1 sheet-roll-box text-[11px] font-bold uppercase cursor-pointer shrink-0"
                      >
                        Cast
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
