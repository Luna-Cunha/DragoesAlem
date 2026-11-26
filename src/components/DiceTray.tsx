import { useState } from 'react';
import { Dices, History, Trash2, X, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DIE_FACES = [4, 6, 8, 10, 12, 20, 100];

export function DiceTray() {
  const {
    rollMode,
    setRollMode,
    rollHistory,
    activeToast,
    dismissToast,
    clearHistory,
    rollExpression,
  } = useApp();

  const [trayOpen, setTrayOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [customExpr, setCustomExpr] = useState('1d20+5');

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2 no-print">
      {/* Roll Toast */}
      {activeToast && (
        <div className="w-72 rounded-xl bg-[var(--bg-card)] border-2 border-[var(--accent)] shadow-2xl p-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {activeToast.context || 'Dice Roll'}
                {activeToast.mode !== 'normal' && ` (${activeToast.mode.toUpperCase()})`}
              </div>
              <div className="font-bold text-sm truncate text-[var(--text-primary)]">
                {activeToast.label}
              </div>
            </div>
            <button
              type="button"
              onClick={dismissToast}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              aria-label="Dismiss roll notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between bg-[var(--bg-card-alt)] rounded-lg px-3 py-2 border border-[var(--border-color)]">
            <div className="text-xs text-[var(--text-secondary)] font-mono-num">
              {activeToast.terms.map((t, idx) => (
                <span key={idx} className="mr-1.5">
                  d{t.sides}[
                  <span className="font-bold text-[var(--text-primary)]">{t.kept.join(', ')}</span>
                  {t.dropped && t.dropped.length > 0 && (
                    <span className="line-through text-[var(--text-muted)] ml-1">{t.dropped.join(', ')}</span>
                  )}
                  ]
                </span>
              ))}
              {activeToast.modifier !== 0 && (
                <span>{activeToast.modifier > 0 ? `+ ${activeToast.modifier}` : `- ${Math.abs(activeToast.modifier)}`}</span>
              )}
              {activeToast.damageType && (
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {activeToast.damageType}
                </div>
              )}
            </div>
            <div
              className={`font-mono-num text-2xl font-extrabold ${
                activeToast.isCrit
                  ? 'text-emerald-600'
                  : activeToast.isFumble
                    ? 'text-red-600'
                    : 'text-[var(--text-primary)]'
              }`}
            >
              {activeToast.total}
            </div>
          </div>
          {activeToast.isCrit && (
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 mt-1 text-right">
              Natural 20! Critical!
            </div>
          )}
          {activeToast.isFumble && (
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 mt-1 text-right">
              Natural 1! Fumble!
            </div>
          )}
        </div>
      )}

      {/* Roll History Panel */}
      {logOpen && (
        <div className="w-80 max-h-80 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-[var(--bg-card-alt)] border-b border-[var(--border-color)] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Roll History</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearHistory}
                className="text-xs text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                title="Clear History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLogOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
            {rollHistory.length === 0 ? (
              <div className="p-4 text-xs text-center text-[var(--text-muted)]">No rolls yet.</div>
            ) : (
              rollHistory.map((r) => (
                <div key={r.id} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{r.label}</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">
                      {r.expression} {r.damageType ? `(${r.damageType})` : ''}
                    </div>
                  </div>
                  <div
                    className={`font-mono-num text-base font-bold ${
                      r.isCrit ? 'text-emerald-400' : r.isFumble ? 'text-red-500' : ''
                    }`}
                  >
                    {r.total}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Quick Dice Tray Popover */}
      {trayOpen && (
        <div className="w-72 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Quick Dice</span>
            <div className="flex rounded-md overflow-hidden border border-[var(--border-color)] text-[10px] font-bold">
              {(['normal', 'advantage', 'disadvantage'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRollMode(m)}
                  className={`px-2 py-1 uppercase cursor-pointer ${
                    rollMode === m
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-card-alt)] text-[var(--text-secondary)]'
                  }`}
                >
                  {m === 'normal' ? 'Norm' : m === 'advantage' ? 'Adv' : 'Dis'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {DIE_FACES.map((faces) => (
              <button
                key={faces}
                type="button"
                onClick={() => rollExpression(`1d${faces}`, `d${faces}`, 'Dice Tray')}
                className="py-2 rounded-lg font-mono-num text-xs font-bold bg-[var(--bg-card-alt)] border border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition cursor-pointer"
              >
                d{faces}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customExpr.trim()) rollExpression(customExpr.trim(), customExpr.trim(), 'Custom Roll');
            }}
            className="flex gap-1.5"
          >
            <input
              type="text"
              value={customExpr}
              onChange={(e) => setCustomExpr(e.target.value)}
              placeholder="2d6+4"
              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-mono-num bg-[var(--bg-input)] border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white cursor-pointer"
            >
              Roll
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTrayOpen((v) => !v)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition"
        >
          <Dices className="w-4 h-4" />
          Dice
          {rollMode !== 'normal' && (
            <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px]">
              {rollMode === 'advantage' ? 'ADV' : 'DIS'}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setLogOpen((v) => !v)}
          className="p-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent)] shadow-lg cursor-pointer"
          title="Roll History"
          aria-label="Toggle Roll History"
        >
          <History className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
