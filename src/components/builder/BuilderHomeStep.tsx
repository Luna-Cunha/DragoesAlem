import { useMemo, useState } from 'react';
import { BookOpen, Check, Image as ImageIcon, Search, Settings2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_SOURCES_BY_RULESET } from '../../engine/rules';
import type { Character, RulesetMode } from '../../types/character';
import { PortraitAvatar } from '../PortraitAvatar';
import { CollapsibleBox } from '../CollapsibleBox';

export function BuilderHomeStep({
  character,
  onChange,
}: {
  character: Character;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const { compendium } = useApp();
  const [bookSearch, setBookSearch] = useState('');

  const books = useMemo(() => {
    if (!compendium) return [];
    const q = bookSearch.trim().toLowerCase();
    return compendium.books
      .filter((b) => !q || b.name.toLowerCase().includes(q) || b.source.toLowerCase().includes(q))
      .sort((a, b) => (a.group === 'core' ? -1 : b.group === 'core' ? 1 : a.name.localeCompare(b.name)));
  }, [compendium, bookSearch]);

  const setRuleset = (ruleset: RulesetMode) => {
    onChange((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ruleset,
        enabledSources: [...DEFAULT_SOURCES_BY_RULESET[ruleset]],
      },
      race: {
        ...prev.race,
        abilityMode: ruleset === '2024' ? 'none' : 'fixed',
      },
      background: {
        ...prev.background,
        abilityMode: ruleset === '2024' ? 'weighted_2_1' : 'none',
      },
    }));
  };

  const toggleSource = (src: string) => {
    onChange((prev) => {
      const exists = prev.preferences.enabledSources.includes(src);
      const next = exists
        ? prev.preferences.enabledSources.filter((s) => s !== src)
        : [...prev.preferences.enabledSources, src];
      return {
        ...prev,
        preferences: { ...prev.preferences, enabledSources: next },
      };
    });
  };

  return (
    <div className="space-y-4">
      <div className="ddb-card ddb-card-accent p-5 space-y-4">
        <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#e40712]" />
          Character Preferences &amp; Identity
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <PortraitAvatar
            url={character.portraitUrl}
            name={character.name}
            frame={character.theme.frame}
            size="lg"
          />
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Character Name
              </label>
              <input
                type="text"
                value={character.name}
                onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Kaelen Duskblade"
                className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm font-semibold focus:outline-none focus:border-[#1b9af0]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Portrait Image URL (optional)
              </label>
              <input
                type="url"
                value={character.portraitUrl}
                onChange={(e) => onChange((p) => ({ ...p, portraitUrl: e.target.value }))}
                placeholder="https://... (leave blank for monogram crest)"
                className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm focus:outline-none focus:border-[#1b9af0]"
              />
            </div>
          </div>
        </div>
      </div>

      <CollapsibleBox
        title="Sources &amp; Ruleset Edition"
        subtitle={`Current: ${character.preferences.ruleset === 'all' ? 'Mixed' : character.preferences.ruleset} Rules`}
        defaultOpen
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: '2024' as const,
                title: '2024 Core Rules (5.5e)',
                desc: 'XPHB classes, Origin feats, background ASIs, Weapon Mastery',
              },
              {
                id: '2014' as const,
                title: '2014 Classic 5e',
                desc: 'PHB, Xanathar, Tasha, classic racial ability bonuses',
              },
              {
                id: 'all' as const,
                title: 'All / Mixed Sources',
                desc: 'Show both 2024 and 2014 options side by side',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRuleset(opt.id)}
                className={`p-3 rounded border text-left transition cursor-pointer ${
                  character.preferences.ruleset === opt.id
                    ? 'border-[#1b9af0] bg-[#1b9af0]/10'
                    : 'border-[var(--border-color)] bg-[var(--bg-card-alt)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="font-bold text-sm flex items-center justify-between">
                  {opt.title}
                  {character.preferences.ruleset === opt.id && (
                    <Check className="w-4 h-4 text-[#1b9af0]" />
                  )}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--border-color)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#e40712]" />
                Enabled Sourcebooks ({character.preferences.enabledSources.length})
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChange((p) => ({
                      ...p,
                      preferences: {
                        ...p.preferences,
                        enabledSources: [...DEFAULT_SOURCES_BY_RULESET[p.preferences.ruleset]],
                      },
                    }))
                  }
                  className="px-2.5 py-1 rounded border border-[var(--border-color)] text-xs font-semibold hover:border-[#1b9af0] cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange((p) => ({
                      ...p,
                      preferences: { ...p.preferences, enabledSources: [] },
                    }))
                  }
                  className="px-2.5 py-1 rounded border border-[var(--border-color)] text-xs font-semibold hover:border-[#1b9af0] cursor-pointer"
                >
                  Allow All Books
                </button>
              </div>
            </div>

            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Filter sourcebooks..."
                className="w-full pl-9 pr-3 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {books.map((book) => {
                const active =
                  character.preferences.enabledSources.length === 0 ||
                  character.preferences.enabledSources.includes(book.source);
                return (
                  <label
                    key={book.source}
                    className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer ${
                      active
                        ? 'border-[#1b9af0]/50 bg-[#1b9af0]/8'
                        : 'border-[var(--border-color)] bg-[var(--bg-card-alt)] opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={character.preferences.enabledSources.includes(book.source)}
                      onChange={() => toggleSource(book.source)}
                      className="accent-[#1b9af0]"
                    />
                    <span className="font-mono-num font-bold text-[10px] px-1.5 py-0.5 rounded bg-black/10">
                      {book.source}
                    </span>
                    <span className="truncate font-medium">{book.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </CollapsibleBox>

      <CollapsibleBox
        title="Character Preferences"
        subtitle="Advancement Type, Hit Point Type, Encumbrance &amp; Optional Rules"
        defaultOpen
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <Settings2 className="w-3.5 h-3.5" /> Advancement Type
              </label>
              <select
                value={character.preferences.advancement}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    preferences: { ...p.preferences, advancement: e.target.value as 'milestone' | 'xp' },
                  }))
                }
                className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm"
              >
                <option value="milestone">Milestone</option>
                <option value="xp">XP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Hit Point Type
              </label>
              <select
                value={character.preferences.hpMode}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    preferences: { ...p.preferences, hpMode: e.target.value as 'fixed' | 'manual' },
                  }))
                }
                className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm"
              >
                <option value="fixed">Fixed</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Encumbrance Type
              </label>
              <select
                value={character.preferences.encumbrance}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    preferences: {
                      ...p.preferences,
                      encumbrance: e.target.value as 'standard' | 'variant' | 'none',
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-sm"
              >
                <option value="standard">Use Encumbrance</option>
                <option value="variant">Variant Encumbrance</option>
                <option value="none">No Encumbrance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-color)]">
            {[
              { key: 'useFeats' as const, label: 'Use Feats' },
              { key: 'allowMulticlassing' as const, label: 'Multiclass Prerequisites &amp; Support' },
              { key: 'ignoreCoinWeight' as const, label: 'Ignore Coin Weight' },
              { key: 'tashaOriginAbilityOverride' as const, label: 'Customize Your Origin (+2/+1 anywhere)' },
            ].map((flag) => (
              <label
                key={flag.key}
                className="flex items-center justify-between p-2.5 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)] text-xs font-semibold cursor-pointer"
              >
                <span>{flag.label}</span>
                <input
                  type="checkbox"
                  checked={character.preferences[flag.key]}
                  onChange={(e) =>
                    onChange((p) => ({
                      ...p,
                      preferences: { ...p.preferences, [flag.key]: e.target.checked },
                    }))
                  }
                  className="accent-[#1b9af0] w-4 h-4"
                />
              </label>
            ))}
          </div>
        </div>
      </CollapsibleBox>
    </div>
  );
}
