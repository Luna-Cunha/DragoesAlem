import type { EntryNode } from '../types/5etools';

export interface ParsedTextSegment {
  type: 'text' | 'bold' | 'italic' | 'dice' | 'dc' | 'hit' | 'ref';
  text: string;
  refKind?: string;
  refName?: string;
  refSource?: string;
  diceExpr?: string;
}

const TAG_REGEX = /\{@(\w+)\s+([^}]+)\}/g;

const ATTACK_LABELS: Record<string, string> = {
  mw: 'Melee Weapon Attack:',
  rw: 'Ranged Weapon Attack:',
  ms: 'Melee Spell Attack:',
  rs: 'Ranged Spell Attack:',
  'mw,rw': 'Melee or Ranged Weapon Attack:',
  'ms,rs': 'Melee or Ranged Spell Attack:',
  m: 'Melee Attack:',
  r: 'Ranged Attack:',
};

export function parseFiveToolsText(input: string): ParsedTextSegment[] {
  if (!input || typeof input !== 'string') return [];
  const segments: ParsedTextSegment[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(TAG_REGEX)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      segments.push({ type: 'text', text: input.slice(lastIndex, idx) });
    }

    const tag = match[1];
    const body = match[2];
    const parts = body.split('|');

    switch (tag) {
      case 'b':
      case 'bold':
        segments.push({ type: 'bold', text: parts[0] });
        break;
      case 'i':
      case 'italic':
        segments.push({ type: 'italic', text: parts[0] });
        break;
      case 'dice':
      case 'damage':
      case 'd20':
      case 'scaledamage':
      case 'scaledice': {
        const expr = tag.startsWith('scale') ? parts[2] || parts[0] : parts[0];
        const display = tag.startsWith('scale') ? parts[2] || parts[0] : parts[1] || parts[0];
        segments.push({
          type: 'dice',
          text: display,
          diceExpr: expr.replace(/×/g, '*'),
        });
        break;
      }
      case 'hit': {
        const val = Number(parts[0]);
        const signed = !Number.isNaN(val) ? (val >= 0 ? `+${val}` : `${val}`) : parts[0];
        segments.push({
          type: 'hit',
          text: signed,
          diceExpr: `1d20${signed}`,
        });
        break;
      }
      case 'dc':
        segments.push({ type: 'dc', text: `DC ${parts[0]}` });
        break;
      case 'atk':
        segments.push({ type: 'italic', text: ATTACK_LABELS[parts[0]] || `${parts[0]}:` });
        break;
      case 'h':
        segments.push({ type: 'italic', text: 'Hit: ' });
        break;
      case 'recharge':
        segments.push({ type: 'bold', text: parts[0] ? `(Recharge ${parts[0]}–6)` : '(Recharge 6)' });
        break;
      case 'spell':
      case 'item':
      case 'condition':
      case 'feat':
      case 'skill':
      case 'sense':
      case 'action':
      case 'variantrule':
      case 'optfeature':
      case 'race':
      case 'background':
      case 'class':
      case 'status': {
        const display = parts[2] || parts[0];
        segments.push({
          type: 'ref',
          text: display,
          refKind: tag,
          refName: parts[0],
          refSource: parts[1],
        });
        break;
      }
      case 'filter':
      case 'book':
      case '5etools':
      case 'note':
      case 'chance': {
        const display = tag === 'chance' ? `${parts[1] || parts[0]}%` : parts[0];
        segments.push({ type: tag === 'note' ? 'italic' : 'text', text: display });
        break;
      }
      default:
        segments.push({ type: 'text', text: parts[2] || parts[0] });
        break;
    }

    lastIndex = idx + match[0].length;
  }

  if (lastIndex < input.length) {
    segments.push({ type: 'text', text: input.slice(lastIndex) });
  }

  return segments;
}

export function stripFiveToolsTags(input: string): string {
  return parseFiveToolsText(input)
    .map((s) => s.text)
    .join('');
}

export function extractPlainTextFromEntries(entries: EntryNode[] | undefined): string {
  if (!entries || !Array.isArray(entries)) return '';
  const chunks: string[] = [];

  for (const node of entries) {
    if (typeof node === 'string') {
      chunks.push(stripFiveToolsTags(node));
    } else if (node && typeof node === 'object') {
      if (node.name) chunks.push(node.name);
      if (node.entry) chunks.push(extractPlainTextFromEntries([node.entry]));
      if (node.entries) chunks.push(extractPlainTextFromEntries(node.entries));
      if (node.items) chunks.push(extractPlainTextFromEntries(node.items));
    }
  }

  return chunks.filter(Boolean).join('\n');
}
