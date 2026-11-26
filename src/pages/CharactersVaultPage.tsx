import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Copy,
  Download,
  Edit3,
  Eye,
  FileDown,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeCharacter, splitEntityKey } from '../engine/rules';
import { exportCharacterToPdf } from '../services/pdfSheetExporter';
import { PortraitAvatar } from '../components/PortraitAvatar';
import type { Character } from '../types/character';

export function CharactersVaultPage() {
  const { compendium, characters, upsertCharacter, removeCharacter } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  if (!compendium) {
    return null;
  }

  const filtered = characters.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const classStr = c.classes.map((cl) => cl.className).join(' ').toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      classStr.includes(q) ||
      (c.race.raceKey || '').toLowerCase().includes(q)
    );
  });

  const handleExport = (char: Character) => {
    const blob = new Blob([JSON.stringify(char, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${char.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'character'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDuplicate = async (char: Character) => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : `char-${Date.now()}`;
    const copy: Character = {
      ...JSON.parse(JSON.stringify(char)),
      id: newId,
      name: `${char.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    await upsertCharacter(copy);
  };

  const handleImportJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Character;
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.classes)) {
        alert('Invalid character JSON file.');
        return;
      }
      const newId = parsed.id || (crypto.randomUUID ? crypto.randomUUID() : `char-${Date.now()}`);
      await upsertCharacter({ ...parsed, id: newId });
    } catch {
      alert('Failed to read character JSON file.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* D&D Beyond My Characters Page Banner */}
      <div className="bg-[#242527] text-white border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-wide">
              My Characters
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Manage your active roster or forge a new hero using imported compendium rules.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => handleImportJson(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import JSON
            </button>
            <Link
              to="/characters/builder"
              className="px-4 py-2 ddb-btn-blue text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              Create a Character
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
        {characters.length > 0 && (
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter characters by name, class, or species..."
              className="w-full pl-9 pr-3 py-2 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-sm focus:outline-none focus:border-[#1b9af0]"
            />
          </div>
        )}

        {characters.length === 0 ? (
          <div className="ddb-card p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#e40712]" />
            </div>
            <h2 className="font-display text-xl font-bold">No Characters Yet</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              Your compendium is loaded. Create your first character in the D&amp;D Beyond-style Character Builder.
            </p>
            <button
              type="button"
              onClick={() => navigate('/characters/builder')}
              className="inline-flex items-center gap-2 px-5 py-2.5 ddb-btn-blue text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create a Character
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((char) => {
              const computed = computeCharacter(char, compendium);
              const raceName = splitEntityKey(char.race.raceKey).name || 'Unknown Species';
              const classSummary =
                char.classes.length > 0
                  ? char.classes
                      .map(
                        (c) =>
                          `${c.className}${c.subclassName ? ` (${c.subclassName})` : ''} ${c.level}`,
                      )
                      .join(' / ')
                  : 'No Class Selected';

              return (
                <div
                  key={char.id}
                  className="ddb-card overflow-hidden hover:border-[#1b9af0] transition flex flex-col"
                >
                  <div className={`h-20 px-4 flex items-center gap-3.5 backdrop-${char.theme.backdrop} text-white border-b-2 border-[#e40712]`}>
                    <PortraitAvatar url={char.portraitUrl} name={char.name} frame={char.theme.frame} size="md" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-lg truncate">
                        {char.name || 'Unnamed Adventurer'}
                      </h3>
                      <p className="text-xs text-slate-200 truncate">
                        Level {computed.totalLevel} {raceName}
                      </p>
                      <p className="text-[11px] text-amber-300 truncate font-semibold">
                        {classSummary}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center justify-center gap-1">
                          <Shield className="w-3 h-3" /> AC
                        </div>
                        <div className="font-mono-num text-base font-extrabold">{computed.ac.value}</div>
                      </div>
                      <div className="p-2 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">HP</div>
                        <div className="font-mono-num text-base font-extrabold text-emerald-600">
                          {computed.effectiveCurrentHp}/{computed.maxHp}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Rules</div>
                        <div className="font-mono-num text-xs font-bold mt-1">
                          {char.preferences.ruleset === 'all' ? 'Mixed' : char.preferences.ruleset}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/characters/${char.id}`}
                        className="flex-1 py-2 px-3 ddb-btn-blue text-xs flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                      <Link
                        to={`/characters/builder/${char.id}`}
                        className="py-2 px-3 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-[#1b9af0] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(char)}
                        className="p-2 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-[#1b9af0] cursor-pointer"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void exportCharacterToPdf(char, computed, compendium).catch((err) =>
                            alert(err instanceof Error ? err.message : 'Failed to export PDF.'),
                          );
                        }}
                        className="p-2 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-[#1b9af0] cursor-pointer"
                        title="Export PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport(char)}
                        className="p-2 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-[#1b9af0] cursor-pointer"
                        title="Export JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete ${char.name}?`)) removeCharacter(char.id);
                        }}
                        className="p-2 rounded border border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-red-500 hover:text-red-600 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
