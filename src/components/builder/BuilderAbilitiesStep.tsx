import { Dices, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { roll4d6DropLowest } from '../../engine/dice';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  POINT_BUY_COSTS,
  STANDARD_ARRAY,
  calculatePointBuySpent,
  computeCharacter,
  formatSigned,
} from '../../engine/rules';
import type { AbilityGenMode, Character } from '../../types/character';
import type { AbilityKey } from '../../types/5etools';
import { CollapsibleBox } from '../CollapsibleBox';

export function BuilderAbilitiesStep({
  character,
  onChange,
}: {
  character: Character;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const { compendium } = useApp();
  if (!compendium) return null;

  const computed = computeCharacter(character, compendium);
  const mode = character.preferences.abilityGenMode;
  const pointBuyUsed = calculatePointBuySpent(character.abilities.base);
  const pointBuyRemaining = 27 - pointBuyUsed;

  const setGenMode = (nextMode: AbilityGenMode) => {
    onChange((p) => {
      let nextBase = { ...p.abilities.base };
      if (nextMode === 'standard' || nextMode === 'pointBuy') {
        nextBase = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
      }
      return {
        ...p,
        preferences: { ...p.preferences, abilityGenMode: nextMode },
        abilities: { ...p.abilities, base: nextBase },
      };
    });
  };

  const assignStandardArray = (targetAbility: AbilityKey, nextVal: number) => {
    onChange((p) => {
      const prevVal = p.abilities.base[targetAbility];
      const nextBase = { ...p.abilities.base };
      const swapKey = ABILITY_KEYS.find((k) => k !== targetAbility && nextBase[k] === nextVal);
      if (swapKey) nextBase[swapKey] = prevVal;
      nextBase[targetAbility] = nextVal;
      return { ...p, abilities: { ...p.abilities, base: nextBase } };
    });
  };

  const rollAllStats = () => {
    const rolled: Record<AbilityKey, number> = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    for (const k of ABILITY_KEYS) {
      rolled[k] = roll4d6DropLowest().total;
    }
    onChange((p) => ({
      ...p,
      preferences: { ...p.preferences, abilityGenMode: 'manual' },
      abilities: { ...p.abilities, base: rolled },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="ddb-card ddb-card-accent p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold">Ability Scores</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Choose a generation method below and adjust your character&apos;s six core abilities.
            </p>
          </div>
          <select
            value={mode}
            onChange={(e) => setGenMode(e.target.value as AbilityGenMode)}
            className="px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm font-bold"
          >
            <option value="standard">Standard Array</option>
            <option value="pointBuy">Point Buy (27 pts)</option>
            <option value="manual">Manual / Rolled</option>
          </select>
        </div>

        {mode === 'pointBuy' && (
          <div className="flex items-center justify-between p-3 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
            <span className="text-xs font-bold uppercase tracking-wider">Point Buy Budget (8–15)</span>
            <span
              className={`font-mono-num text-sm font-extrabold ${
                pointBuyRemaining < 0 ? 'text-red-600' : 'text-[#1b9af0]'
              }`}
            >
              {pointBuyRemaining} / 27 Points Remaining
            </span>
          </div>
        )}

        {mode === 'manual' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={rollAllStats}
              className="px-3.5 py-2 ddb-btn-blue text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Dices className="w-4 h-4" />
              Roll All (4d6 Drop Lowest)
            </button>
            <button
              type="button"
              onClick={() =>
                onChange((p) => ({
                  ...p,
                  abilities: {
                    ...p.abilities,
                    base: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
                  },
                }))
              }
              className="px-3 py-2 rounded border border-[var(--border-color)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to 10s
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ABILITY_KEYS.map((ab) => {
            const baseVal = character.abilities.base[ab] ?? 10;
            const summary = computed.abilityScores[ab];
            const nextPointCost = (POINT_BUY_COSTS[baseVal + 1] ?? 99) - (POINT_BUY_COSTS[baseVal] ?? 0);

            return (
              <div
                key={ab}
                className="p-4 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                      {ABILITY_LABELS[ab].short}
                    </div>
                    <div className="font-display font-bold text-base">{ABILITY_LABELS[ab].full}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-num text-2xl font-extrabold text-[#e40712]">
                      {formatSigned(summary.modifier)}
                    </div>
                    <div className="text-[11px] font-mono-num text-[var(--text-secondary)]">
                      Total: <strong>{summary.total}</strong>
                    </div>
                  </div>
                </div>

                {mode === 'standard' && (
                  <select
                    value={baseVal}
                    onChange={(e) => assignStandardArray(ab, parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] font-mono-num text-sm font-bold"
                  >
                    {STANDARD_ARRAY.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}

                {mode === 'pointBuy' && (
                  <div className="flex items-center justify-between bg-[var(--bg-input)] border border-[var(--border-color)] rounded px-2 py-1.5">
                    <button
                      type="button"
                      disabled={baseVal <= 8}
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          abilities: {
                            ...p.abilities,
                            base: { ...p.abilities.base, [ab]: Math.max(8, baseVal - 1) },
                          },
                        }))
                      }
                      className="w-7 h-7 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)] font-bold cursor-pointer disabled:opacity-30"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <div className="font-mono-num text-base font-bold">{baseVal}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {POINT_BUY_COSTS[baseVal] ?? 0} pts
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={baseVal >= 15 || pointBuyRemaining < nextPointCost}
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          abilities: {
                            ...p.abilities,
                            base: { ...p.abilities.base, [ab]: Math.min(15, baseVal + 1) },
                          },
                        }))
                      }
                      className="w-7 h-7 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)] font-bold cursor-pointer disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                )}

                {mode === 'manual' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={baseVal}
                      onChange={(e) => {
                        const n = Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1));
                        onChange((p) => ({
                          ...p,
                          abilities: { ...p.abilities, base: { ...p.abilities.base, [ab]: n } },
                        }));
                      }}
                      className="flex-1 px-3 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] font-mono-num text-sm font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const rolled = roll4d6DropLowest().total;
                        onChange((p) => ({
                          ...p,
                          abilities: { ...p.abilities, base: { ...p.abilities.base, [ab]: rolled } },
                        }));
                      }}
                      className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#1b9af0] cursor-pointer"
                      title="Roll 4d6 drop lowest"
                    >
                      <Dices className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <CollapsibleBox
        title="Score Calculations &amp; Overrides"
        subtitle="Breakdown of Base, Species, Background, Feat/ASI, and Override values"
        defaultOpen
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px]">
                <th className="py-2 pr-3">Ability</th>
                <th className="py-2 px-2">Base</th>
                <th className="py-2 px-2">Species</th>
                <th className="py-2 px-2">Background</th>
                <th className="py-2 px-2">ASI/Feat</th>
                <th className="py-2 px-2">Misc Bonus</th>
                <th className="py-2 px-2">Override</th>
                <th className="py-2 pl-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {ABILITY_KEYS.map((ab) => {
                const s = computed.abilityScores[ab];
                return (
                  <tr key={ab}>
                    <td className="py-2 pr-3 font-bold">{ABILITY_LABELS[ab].full}</td>
                    <td className="py-2 px-2 font-mono-num">{s.base}</td>
                    <td className="py-2 px-2 font-mono-num">{s.speciesBonus ? `+${s.speciesBonus}` : '—'}</td>
                    <td className="py-2 px-2 font-mono-num">{s.backgroundBonus ? `+${s.backgroundBonus}` : '—'}</td>
                    <td className="py-2 px-2 font-mono-num">{s.asiFeatBonus ? `+${s.asiFeatBonus}` : '—'}</td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={character.abilities.miscBonus[ab] ?? 0}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10) || 0;
                          onChange((p) => ({
                            ...p,
                            abilities: { ...p.abilities, miscBonus: { ...p.abilities.miscBonus, [ab]: v } },
                          }));
                        }}
                        className="w-14 px-1.5 py-0.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] font-mono-num"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        placeholder="-"
                        value={character.abilities.override[ab] ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const v = raw ? parseInt(raw, 10) : undefined;
                          onChange((p) => ({
                            ...p,
                            abilities: { ...p.abilities, override: { ...p.abilities.override, [ab]: v } },
                          }));
                        }}
                        className="w-14 px-1.5 py-0.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] font-mono-num"
                      />
                    </td>
                    <td className="py-2 pl-2 text-right font-mono-num font-extrabold text-[#e40712]">
                      {s.total} ({formatSigned(s.modifier)})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CollapsibleBox>
    </div>
  );
}
