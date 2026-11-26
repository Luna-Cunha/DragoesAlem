import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Compass,
  Eye,
  Flame,
  FlaskConical,
  Heart,
  Shield,
  Skull,
  Sparkles,
} from 'lucide-react';
import type { Book5e, EntryNode, Spell5e } from '../../types/5etools';
import { formatSpellMetadata } from '../../services/spellFormatting';
import { InlineFormattedText, RichEntries } from '../RichEntries';

function SpellSchoolIcon({ school }: { school: string }) {
  const cls = 'w-4 h-4 text-white';
  switch (school) {
    case 'A':
      return <Shield className={cls} />;
    case 'C':
      return <Sparkles className={cls} />;
    case 'D':
      return <Compass className={cls} />;
    case 'E':
      return <Heart className={cls} />;
    case 'V':
      return <Flame className={cls} />;
    case 'I':
      return <Eye className={cls} />;
    case 'N':
      return <Skull className={cls} />;
    case 'T':
      return <FlaskConical className={cls} />;
    default:
      return <Sparkles className={cls} />;
  }
}

function HigherLevelBlock({
  entries,
  spellName,
}: {
  entries: EntryNode[];
  spellName: string;
}) {
  return (
    <div className="space-y-2">
      {entries.map((node, idx) => {
        if (
          node &&
          typeof node === 'object' &&
          node.name &&
          Array.isArray(node.entries) &&
          node.entries.length === 1 &&
          typeof node.entries[0] === 'string'
        ) {
          return (
            <p key={idx} className="text-sm leading-relaxed text-[var(--text-primary)]">
              <strong className="font-bold italic">{node.name}.</strong>{' '}
              <InlineFormattedText text={node.entries[0]} contextTitle={spellName} />
            </p>
          );
        }
        return <RichEntries key={idx} entries={[node]} contextTitle={spellName} />;
      })}
    </div>
  );
}

export function SpellAccordionCard({
  spell,
  books,
  actionLabel,
  isSelected,
  disabled,
  onAction,
}: {
  spell: Spell5e;
  books?: Book5e[];
  actionLabel: string;
  isSelected: boolean;
  disabled?: boolean;
  onAction: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = formatSpellMetadata(spell, books);

  const subtitleParts = [
    meta.levelHeaderText,
    ...(meta.isConcentration ? ['Concentration'] : []),
    ...(meta.isRitual ? ['Ritual'] : []),
  ];

  const italicClassification =
    spell.level === 0
      ? `${meta.schoolName} Cantrip`
      : `${meta.levelOrdinal}-Level ${meta.schoolName}${meta.isRitual ? ' (Ritual)' : ''}`;

  const actionButtonClasses = `px-3 py-1 rounded-[2px] border text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
    isSelected
      ? 'border-[#5cb85c] bg-[#5cb85c]/15 text-[#78df78] hover:bg-[#5cb85c]/25'
      : 'border-[#6b7280] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[#5dbbf7] hover:text-[#5dbbf7]'
  }`;

  return (
    <div className="rounded-[2px] border border-[var(--border-color)] bg-[var(--bg-card-alt)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-white/[0.025] transition">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex-1 flex items-center gap-3 text-left min-w-0 cursor-pointer"
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-1 ring-white/25 shadow-sm"
            style={{ backgroundColor: meta.schoolBg }}
            title={meta.schoolName}
          >
            <SpellSchoolIcon school={spell.school} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold italic text-[14px] text-[var(--text-primary)] leading-tight">
                {spell.name}
              </span>
              {meta.isConcentration && (
                <span
                  title="Concentration"
                  className="w-4 h-4 rounded-full bg-[#3a3d42] border border-[#5a5e66] text-[#e5e7eb] text-[9px] font-extrabold inline-flex items-center justify-center shrink-0"
                >
                  C
                </span>
              )}
              {meta.isRitual && (
                <span
                  title="Ritual"
                  className="w-4 h-4 rounded-full bg-[#3a3d42] border border-[#5a5e66] text-[#e5e7eb] text-[9px] font-extrabold inline-flex items-center justify-center shrink-0"
                >
                  R
                </span>
              )}
            </span>
            <span className="block text-[11px] text-[var(--text-muted)] truncate mt-0.5">
              {subtitleParts.join(' • ')}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={disabled && !isSelected}
            onClick={onAction}
            className={actionButtonClasses}
          >
            {actionLabel}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={`Toggle ${spell.name} details`}
            aria-expanded={expanded}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mx-3 mb-3 p-4 border border-[#999999]/55 bg-[var(--bg-card)] space-y-3 text-sm">
          <div className="italic text-[var(--text-primary)]">{italicClassification}</div>

          <hr className="border-[var(--border-color)]" />

          <div className="space-y-0.5 text-[13px] text-[var(--text-primary)]">
            <div>
              <strong className="font-bold">Casting Time:</strong> {meta.castingTime}
            </div>
            <div>
              <strong className="font-bold">Range/Area:</strong> {meta.range}
            </div>
            <div>
              <strong className="font-bold">Components:</strong> {meta.components}
            </div>
            <div>
              <strong className="font-bold">Duration:</strong> {meta.duration}
            </div>
            <div>
              <strong className="font-bold">Source:</strong>{' '}
              <span className="italic">{meta.sourceBookName}</span>
              {spell.page ? `, pg. ${spell.page}` : ''}
            </div>
          </div>

          <hr className="border-[var(--border-color)]" />

          <div className="space-y-2.5">
            <RichEntries entries={spell.entries} contextTitle={spell.name} />
            {spell.entriesHigherLevel && spell.entriesHigherLevel.length > 0 && (
              <HigherLevelBlock entries={spell.entriesHigherLevel} spellName={spell.name} />
            )}
          </div>

          <hr className="border-[var(--border-color)]" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              TAGS:
            </span>
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-card-alt)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]"
              >
                {tag}
              </span>
            ))}
          </div>

          <hr className="border-[var(--border-color)]" />

          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              disabled={disabled && !isSelected}
              onClick={onAction}
              className={actionButtonClasses}
            >
              {actionLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
