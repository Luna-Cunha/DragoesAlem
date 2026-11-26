import { X, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RichEntries } from './RichEntries';

export function ReferenceDrawer() {
  const { drawer, closeDrawer } = useApp();

  if (!drawer) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside className="relative z-10 w-full max-w-md h-full bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col">
        <div className="p-4 border-b border-[var(--border-color)] flex items-start justify-between gap-3 bg-[var(--bg-card-alt)]">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <h2 className="font-display text-lg font-bold leading-tight">{drawer.title}</h2>
            </div>
            {drawer.subtitle && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{drawer.subtitle}</p>
            )}
            {drawer.badges && drawer.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {drawer.badges.map((b) => (
                  <span
                    key={b}
                    className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-1.5 rounded hover:bg-[var(--border-color)] text-[var(--text-secondary)] cursor-pointer"
            aria-label="Close detail drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {drawer.metaRows && drawer.metaRows.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
              {drawer.metaRows.map((row) => (
                <div key={row.label}>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                    {row.label}
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">{row.value}</div>
                </div>
              ))}
            </div>
          )}

          {drawer.entries && drawer.entries.length > 0 && (
            <RichEntries entries={drawer.entries} contextTitle={drawer.title} />
          )}

          {drawer.entriesHigherLevel && drawer.entriesHigherLevel.length > 0 && (
            <div className="pt-2 border-t border-[var(--border-color)]">
              <RichEntries entries={drawer.entriesHigherLevel} contextTitle={drawer.title} />
            </div>
          )}
        </div>

        {drawer.source && (
          <div className="px-4 py-2.5 border-t border-[var(--border-color)] text-[11px] text-[var(--text-muted)] bg-[var(--bg-card-alt)] flex justify-between">
            <span>Source: {drawer.source}</span>
            {drawer.page ? <span>p. {drawer.page}</span> : null}
          </div>
        )}
      </aside>
    </div>
  );
}
