import { useState } from 'react';
import { Download, FileDown, Loader2, Moon, Printer, Sun, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportCharacterToPdf } from '../../services/pdfSheetExporter';
import type { BackdropId, Character, ComputedCharacter, PortraitFrameId, SheetThemeId } from '../../types/character';

export function SheetCustomizeModal({
  open,
  onClose,
  character,
  computed,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  character: Character;
  computed: ComputedCharacter;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const { compendium } = useApp();
  const [exportingPdf, setExportingPdf] = useState(false);

  if (!open) return null;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'character'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!compendium || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportCharacterToPdf(character, computed, compendium);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h2 className="font-display text-lg font-bold">Customize Sheet</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-card-alt)] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Underdark Mode */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider">Sheet Lighting</span>
          <button
            type="button"
            onClick={() =>
              onChange((p) => ({ ...p, theme: { ...p.theme, darkMode: !p.theme.darkMode } }))
            }
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-card-alt)] border border-[var(--border-color)] text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            {character.theme.darkMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            {character.theme.darkMode ? 'Underdark Mode (Dark)' : 'Daylight Mode (Light)'}
          </button>
        </div>

        {/* Accent Theme */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Theme Color</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['crimson', 'arcane', 'emerald', 'amber', 'violet', 'obsidian'] as SheetThemeId[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange((p) => ({ ...p, theme: { ...p.theme, accentTheme: t } }))}
                className={`py-1.5 px-2 rounded-lg border text-xs font-bold capitalize cursor-pointer ${
                  character.theme.accentTheme === t
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-card-alt)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Backdrop */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Banner Backdrop</div>
          <div className="flex flex-wrap gap-1.5">
            {(['astral', 'tavern', 'feywild', 'bloodmoon', 'obsidian'] as BackdropId[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => onChange((p) => ({ ...p, theme: { ...p.theme, backdrop: b } }))}
                className={`py-1 px-2.5 rounded-lg border text-xs font-semibold capitalize cursor-pointer ${
                  character.theme.backdrop === b
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-card-alt)]'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Portrait Frame */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Portrait Frame</div>
          <div className="flex flex-wrap gap-1.5">
            {(['gold-filigree', 'iron-crest', 'arcane-ring', 'crimson-seal', 'minimal'] as PortraitFrameId[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onChange((p) => ({ ...p, theme: { ...p.theme, frame: f } }))}
                className={`py-1 px-2.5 rounded-lg border text-xs font-semibold capitalize cursor-pointer ${
                  character.theme.frame === f
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-card-alt)]'
                }`}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={exportJson}
            className="flex-1 py-2 px-2 rounded-lg bg-[var(--bg-card-alt)] border border-[var(--border-color)] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            type="button"
            disabled={exportingPdf}
            onClick={handleExportPdf}
            className="flex-1 py-2 px-2 rounded-lg bg-[#2a191b] hover:bg-[#382124] border border-[#8c3439] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            Export PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="py-2 px-3 rounded-lg bg-[var(--bg-card-alt)] border border-[var(--border-color)] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            title="Print Web Sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
