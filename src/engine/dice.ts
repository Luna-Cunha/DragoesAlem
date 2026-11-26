import type { DiceRollTerm, RollRecord } from '../types/character';

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function roll4d6DropLowest(): { rolls: number[]; kept: number[]; dropped: number; total: number } {
  const rolls = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)];
  const sorted = [...rolls].sort((a, b) => a - b);
  const dropped = sorted[0];
  const kept = sorted.slice(1);
  return {
    rolls,
    kept,
    dropped,
    total: kept.reduce((s, n) => s + n, 0),
  };
}

export function rollDiceExpression(
  expression: string,
  options?: {
    label?: string;
    context?: string;
    mode?: 'normal' | 'advantage' | 'disadvantage';
    damageType?: string;
  },
): RollRecord {
  const clean = expression.replace(/\s+/g, '').replace(/−/g, '-').replace(/×/g, '*');
  const mode = options?.mode ?? 'normal';
  const terms: DiceRollTerm[] = [];
  let modifier = 0;

  // Tokenize +/- terms
  const tokens = clean.match(/[+-]?[^+-]+/g) || [];
  for (const token of tokens) {
    const diceMatch = token.match(/^([+-]?)(\d*)d(\d+)(?:dl(\d+))?(?:\*(\d+))?$/i);
    if (diceMatch) {
      const sign = diceMatch[1] === '-' ? -1 : 1;
      const count = diceMatch[2] ? parseInt(diceMatch[2], 10) : 1;
      const sides = parseInt(diceMatch[3], 10);
      const dropLowest = diceMatch[4] ? parseInt(diceMatch[4], 10) : 0;
      const mult = diceMatch[5] ? parseInt(diceMatch[5], 10) : 1;

      if (sides === 20 && count === 1 && (mode === 'advantage' || mode === 'disadvantage')) {
        const r1 = rollDie(20);
        const r2 = rollDie(20);
        const keptVal = mode === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
        const droppedVal = mode === 'advantage' ? Math.min(r1, r2) : Math.max(r1, r2);
        terms.push({
          sides: 20,
          rolls: [r1, r2],
          kept: [keptVal * sign * mult],
          dropped: [droppedVal],
          isCrit: keptVal === 20,
          isFumble: keptVal === 1,
        });
      } else {
        const rolls = Array.from({ length: count }, () => rollDie(sides));
        let kept = [...rolls];
        let dropped: number[] | undefined;
        if (dropLowest > 0 && dropLowest < rolls.length) {
          const sorted = [...rolls].sort((a, b) => a - b);
          dropped = sorted.slice(0, dropLowest);
          kept = sorted.slice(dropLowest);
        }
        terms.push({
          sides,
          rolls,
          kept: kept.map((v) => v * sign * mult),
          dropped,
          isCrit: sides === 20 && count === 1 && kept[0] === 20,
          isFumble: sides === 20 && count === 1 && kept[0] === 1,
        });
      }
    } else {
      const num = parseInt(token, 10);
      if (!Number.isNaN(num)) {
        modifier += num;
      }
    }
  }

  const diceSum = terms.reduce((sum, t) => sum + t.kept.reduce((s, v) => s + v, 0), 0);
  const total = diceSum + modifier;

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `roll-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    label: options?.label || expression,
    context: options?.context,
    mode,
    expression,
    terms,
    modifier,
    total,
    damageType: options?.damageType,
    isCrit: terms.some((t) => t.isCrit),
    isFumble: terms.some((t) => t.isFumble),
  };
}

export function rollD20Check(
  bonus: number,
  options?: {
    label: string;
    context?: string;
    mode?: 'normal' | 'advantage' | 'disadvantage';
  },
): RollRecord {
  const sign = bonus >= 0 ? `+${bonus}` : `${bonus}`;
  return rollDiceExpression(`1d20${bonus === 0 ? '' : sign}`, options);
}
