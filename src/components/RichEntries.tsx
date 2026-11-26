import React, { useState } from 'react';
import type { EntryNode } from '../types/5etools';
import { extractPlainTextFromEntries, parseFiveToolsText, stripFiveToolsTags } from '../services/fiveToolsText';
import { useApp } from '../context/AppContext';

export function InlineFormattedText({
  text,
  contextTitle,
}: {
  text: string;
  contextTitle?: string;
}) {
  const { rollExpression, openReferenceByTag } = useApp();
  const segments = parseFiveToolsText(text);

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'bold') {
          return (
            <strong key={i} className="font-semibold">
              {seg.text}
            </strong>
          );
        }
        if (seg.type === 'italic') {
          return (
            <em key={i} className="italic">
              {seg.text}
            </em>
          );
        }
        if (seg.type === 'dc') {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]"
            >
              {seg.text}
            </span>
          );
        }
        if ((seg.type === 'dice' || seg.type === 'hit') && seg.diceExpr) {
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                rollExpression(seg.diceExpr!, seg.text, contextTitle);
              }}
              title={`Click to roll ${seg.diceExpr}`}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono-num font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] hover:bg-[var(--accent)] hover:text-white transition cursor-pointer"
            >
              {seg.text}
            </button>
          );
        }
        if (seg.type === 'ref' && seg.refKind && seg.refName) {
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openReferenceByTag(seg.refKind!, seg.refName!, seg.refSource);
              }}
              className="underline decoration-dotted underline-offset-2 text-[var(--accent)] hover:opacity-80 cursor-pointer font-medium"
            >
              {seg.text}
            </button>
          );
        }
        return <React.Fragment key={i}>{seg.text}</React.Fragment>;
      })}
    </>
  );
}

export function RichEntries({
  entries,
  contextTitle,
  depth = 0,
}: {
  entries: EntryNode[] | undefined;
  contextTitle?: string;
  depth?: number;
}) {
  const { compendium } = useApp();

  if (!entries || entries.length === 0) return null;

  return (
    <div className="space-y-2 text-sm leading-relaxed text-[var(--text-primary)]">
      {entries.map((node, idx) => {
        if (typeof node === 'string') {
          return (
            <p key={idx}>
              <InlineFormattedText text={node} contextTitle={contextTitle} />
            </p>
          );
        }

        if (!node || typeof node !== 'object') return null;

        if (node.type === 'list' && Array.isArray(node.items)) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1">
              {node.items.map((item, itemIdx) => {
                if (typeof item === 'string') {
                  return (
                    <li key={itemIdx}>
                      <InlineFormattedText text={item} contextTitle={contextTitle} />
                    </li>
                  );
                }
                if (item && typeof item === 'object') {
                  return (
                    <li key={itemIdx}>
                      {item.name && <strong className="font-semibold mr-1">{item.name}</strong>}
                      {item.entry && typeof item.entry === 'string' && (
                        <InlineFormattedText text={item.entry} contextTitle={contextTitle} />
                      )}
                      {Array.isArray(item.entries) && (
                        <RichEntries entries={item.entries} contextTitle={contextTitle} depth={depth + 1} />
                      )}
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          );
        }

        if (node.type === 'table' && Array.isArray(node.rows)) {
          return (
            <div key={idx} className="overflow-x-auto rounded border border-[var(--border-color)] my-2">
              {node.caption && (
                <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[var(--bg-card-alt)] border-b border-[var(--border-color)]">
                  {node.caption}
                </div>
              )}
              <table className="w-full text-xs text-left border-collapse">
                {Array.isArray(node.colLabels) && (
                  <thead>
                    <tr className="bg-[var(--bg-card-alt)] border-b border-[var(--border-color)]">
                      {node.colLabels.map((lbl, cIdx) => (
                        <th key={cIdx} className="px-2.5 py-1.5 font-semibold text-[var(--text-secondary)]">
                          {stripFiveToolsTags(lbl)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {node.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-[var(--border-color)] last:border-0">
                      {row.map((cell, cIdx) => {
                        const cellText =
                          typeof cell === 'string' || typeof cell === 'number'
                            ? String(cell)
                            : cell && typeof cell === 'object' && cell.roll
                              ? cell.roll.exact !== undefined
                                ? String(cell.roll.exact)
                                : `${cell.roll.min ?? ''}–${cell.roll.max ?? ''}`
                              : '';
                        return (
                          <td key={cIdx} className="px-2.5 py-1.5 align-top">
                            <InlineFormattedText text={cellText} contextTitle={contextTitle} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (node.type === 'refOptionalfeature' && node.optionalfeature && compendium) {
          const [optName, optSrc] = node.optionalfeature.split('|');
          const opt =
            compendium.optionalFeatures.find(
              (o) =>
                o.name.toLowerCase() === optName.toLowerCase() &&
                (!optSrc || o.source.toLowerCase() === optSrc.toLowerCase()),
            ) || compendium.optionalFeatures.find((o) => o.name.toLowerCase() === optName.toLowerCase());
          if (!opt) return null;
          return (
            <div key={idx} className="pl-3 border-l-2 border-[var(--accent-border)] py-0.5">
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">{opt.name}</div>
              <RichEntries entries={opt.entries} contextTitle={opt.name} depth={depth + 1} />
            </div>
          );
        }

        if (node.type === 'options' && Array.isArray(node.entries)) {
          return (
            <div key={idx} className="space-y-2 mt-1">
              <RichEntries entries={node.entries} contextTitle={contextTitle} depth={depth + 1} />
            </div>
          );
        }

        if (node.type === 'inset' || node.type === 'insetReadaloud' || node.type === 'quote') {
          return (
            <div
              key={idx}
              className="p-3 rounded-md bg-[var(--bg-card-alt)] border-l-4 border-[var(--accent)] text-xs space-y-1.5"
            >
              {node.name && <div className="font-bold text-sm">{node.name}</div>}
              {node.entries && <RichEntries entries={node.entries} contextTitle={node.name || contextTitle} depth={depth + 1} />}
              {node.by && <div className="text-right italic text-[var(--text-muted)]">— {node.by}</div>}
            </div>
          );
        }

        if (node.type === 'item') {
          return (
            <div key={idx}>
              {node.name && <strong className="font-semibold mr-1">{node.name}</strong>}
              {typeof node.entry === 'string' && (
                <InlineFormattedText text={node.entry} contextTitle={contextTitle} />
              )}
              {node.entries && <RichEntries entries={node.entries} contextTitle={contextTitle} depth={depth + 1} />}
            </div>
          );
        }

        return (
          <div key={idx} className="space-y-1.5">
            {node.name && (
              <h4 className={depth === 0 ? 'font-bold text-sm text-[var(--text-primary)] pt-1' : 'font-semibold text-xs uppercase tracking-wide text-[var(--text-secondary)] pt-1'}>
                {node.name}
              </h4>
            )}
            {typeof node.entry === 'string' && (
              <p>
                <InlineFormattedText text={node.entry} contextTitle={node.name || contextTitle} />
              </p>
            )}
            {Array.isArray(node.entries) && (
              <RichEntries entries={node.entries} contextTitle={node.name || contextTitle} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ExpandableEntries({
  entries,
  contextTitle,
  charThreshold = 210,
}: {
  entries: EntryNode[] | undefined;
  contextTitle?: string;
  charThreshold?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!entries || entries.length === 0) return null;

  const plainLen = extractPlainTextFromEntries(entries).length;
  const isLong = plainLen > charThreshold || entries.length > 2;

  return (
    <div className="space-y-2">
      <div className={!expanded && isLong ? 'max-h-[5.5rem] overflow-hidden relative' : ''}>
        <RichEntries entries={entries} contextTitle={contextTitle} />
        {!expanded && isLong && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
        )}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-[var(--text-primary)] hover:text-[#88bcd6] cursor-pointer"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
}
