import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Database,
  FolderOpen,
  Globe,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { importFromLocalFiles, importFromUrl, type ImportProgress } from '../services/fiveToolsImporter';
import { normalizeFiveToolsDataUrl } from '../services/fiveToolsUrl';
import { getSavedDataUrl, setSavedDataUrl } from '../services/storage';

const EXAMPLE_MIRROR_URL = 'https://github.com/5etools-mirror-3/5etools-src/tree/main/data';

export function SetupPage() {
  const { compendium, setCompendiumData, resetCompendium } = useApp();
  const navigate = useNavigate();
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [urlInput, setUrlInput] = useState(() => getSavedDataUrl() || compendium?.meta.sourceUrl || '');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  let normalizedPreview = '';
  try {
    if (urlInput.trim()) normalizedPreview = normalizeFiveToolsDataUrl(urlInput);
  } catch {
    normalizedPreview = '';
  }

  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setImporting(true);
    setProgress({ phase: 'Starting', current: 0, total: 100, detail: 'Connecting to repository...' });
    try {
      const data = await importFromUrl(urlInput, setProgress);
      setSavedDataUrl(urlInput.trim());
      await setCompendiumData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data from URL.');
    } finally {
      setImporting(false);
    }
  };

  const handleFolderImport = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setImporting(true);
    setProgress({ phase: 'Reading files', current: 0, total: 100, detail: `Inspecting ${files.length} files...` });
    try {
      const data = await importFromLocalFiles(files, setProgress);
      await setCompendiumData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import local folder.');
    } finally {
      setImporting(false);
    }
  };

  const pct = progress && progress.total > 0 ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* D&D Beyond Dark Banner */}
      <div className="bg-[#242527] text-white border-b border-slate-700 py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-[#e40712] flex items-center justify-center shrink-0 shadow">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-wide">
              Compendium Data Importer
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Provide a 5etools-compatible <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 text-xs">/data</code> link to import classes, species, backgrounds, feats, spells, and equipment locally into IndexedDB.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="ddb-card ddb-card-accent p-6 space-y-5">
          <form onSubmit={handleImportUrl} className="space-y-4">
            <div>
              <label htmlFor="data-url-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                5etools Data Repository Link
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="data-url-input"
                    type="url"
                    required
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={EXAMPLE_MIRROR_URL}
                    disabled={importing}
                    className="w-full pl-9 pr-3 py-2.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm focus:outline-none focus:border-[#1b9af0]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={importing || !urlInput.trim()}
                  className="px-5 py-2.5 ddb-btn-primary disabled:opacity-50 text-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {compendium ? 'Re-Import Data' : 'Import Data'}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setUrlInput(EXAMPLE_MIRROR_URL)}
                  className="inline-flex items-center gap-1 text-[#1b9af0] hover:underline font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Use 5etools-mirror-3 data URL
                </button>
                {normalizedPreview && (
                  <span className="text-[11px] text-[var(--text-muted)] truncate max-w-full">
                    Resolved: <code className="text-[var(--text-secondary)]">{normalizedPreview}</code>
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[var(--text-secondary)]">
                Or upload a local <code className="px-1 py-0.5 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">data/</code> folder from disk:
              </span>
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is supported in modern browsers
                webkitdirectory=""
                multiple
                className="hidden"
                onChange={(e) => handleFolderImport(e.target.files)}
              />
              <button
                type="button"
                disabled={importing}
                onClick={() => folderInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-[#1b9af0] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Select Local Data Folder
              </button>
            </div>
          </form>

          {importing && progress && (
            <div className="p-4 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)] space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#e40712]">{progress.phase}</span>
                <span className="font-mono-num">{pct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#e40712] transition-all duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">{progress.detail}</div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded bg-red-500/10 border border-red-500/40 flex items-start gap-3 text-xs text-red-400">
              <ShieldAlert className="w-5 h-5 text-[#e40712] shrink-0" />
              <div>
                <div className="font-bold">Import Error</div>
                <div className="mt-0.5">{error}</div>
              </div>
            </div>
          )}
        </div>

        {compendium && (
          <div className="ddb-card border-t-4 border-t-emerald-600 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="font-bold text-base">Compendium Ready in IndexedDB</h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Imported {new Date(compendium.meta.importedAt).toLocaleString()} from {compendium.meta.sourceUrl}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetCompendium}
                className="px-3 py-1.5 rounded border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Cache
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Books / Sources', val: compendium.meta.counts.books },
                { label: 'Classes', val: compendium.meta.counts.classes },
                { label: 'Subclasses', val: compendium.meta.counts.subclasses },
                { label: 'Species / Races', val: compendium.meta.counts.races },
                { label: 'Backgrounds', val: compendium.meta.counts.backgrounds },
                { label: 'Feats', val: compendium.meta.counts.feats },
                { label: 'Spells', val: compendium.meta.counts.spells },
                { label: 'Items & Gear', val: compendium.meta.counts.items },
                { label: 'Class Options', val: compendium.meta.counts.optionalFeatures },
                { label: 'Conditions', val: compendium.meta.counts.conditions },
                { label: 'Actions', val: compendium.meta.counts.actions },
                { label: 'Languages', val: compendium.meta.counts.languages },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
                  <div className="font-mono-num text-xl font-extrabold">{stat.val}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/characters')}
                className="px-5 py-2.5 ddb-btn-blue text-xs flex items-center gap-2 cursor-pointer"
              >
                Open My Characters
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/characters/builder')}
                className="px-5 py-2.5 ddb-btn-primary text-xs flex items-center gap-2 cursor-pointer"
              >
                Create New Character
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
