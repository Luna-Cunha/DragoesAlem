import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Backpack,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Dices,
  Eye,
  Home,
  Palette,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeCharacter, createBlankCharacter, splitEntityKey } from '../engine/rules';
import type {
  BackdropId,
  Character,
  PortraitFrameId,
  SheetThemeId,
} from '../types/character';
import { BuilderHomeStep } from '../components/builder/BuilderHomeStep';
import { BuilderClassStep } from '../components/builder/BuilderClassStep';
import { BuilderBackgroundStep } from '../components/builder/BuilderBackgroundStep';
import { BuilderSpeciesStep } from '../components/builder/BuilderSpeciesStep';
import { BuilderAbilitiesStep } from '../components/builder/BuilderAbilitiesStep';
import { BuilderEquipmentStep } from '../components/builder/BuilderEquipmentStep';
import { PortraitAvatar } from '../components/PortraitAvatar';

const STEPS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'class', label: '1. Class', icon: BookOpen },
  { id: 'background', label: '2. Background', icon: ScrollText },
  { id: 'species', label: '3. Species', icon: Sparkles },
  { id: 'abilities', label: '4. Abilities', icon: Dices },
  { id: 'equipment', label: '5. Equipment', icon: Backpack },
  { id: 'next', label: "What's Next", icon: CheckCircle2 },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export function CharacterBuilderPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { compendium, characters, upsertCharacter, siteDarkMode } = useApp();

  const [step, setStep] = useState<StepId>('home');
  const [character, setCharacter] = useState<Character>(() => createBlankCharacter('2024'));
  const [initializedId, setInitializedId] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (id && initializedId !== id) {
      const existing = characters.find((c) => c.id === id);
      if (existing) {
        dirtyRef.current = false;
        setCharacter(JSON.parse(JSON.stringify(existing)) as Character);
        setInitializedId(id);
      }
    } else if (!id && initializedId !== 'new') {
      dirtyRef.current = false;
      const blank = createBlankCharacter('2024');
      setCharacter(blank);
      setInitializedId('new');
    }
  }, [id, characters, initializedId]);

  useEffect(() => {
    if (!dirtyRef.current) return;
    void upsertCharacter(character);
  }, [character, upsertCharacter]);

  if (!compendium) return null;

  const updateCharacter = (updater: (prev: Character) => Character) => {
    dirtyRef.current = true;
    setCharacter(updater);
  };

  const handleOpenSheet = async () => {
    await upsertCharacter(character);
    navigate(`/characters/${character.id}`);
  };

  const computed = computeCharacter(character, compendium);
  const currentIdx = STEPS.findIndex((s) => s.id === step);
  const classSummary =
    character.classes.length > 0
      ? character.classes.map((c) => `${c.className} ${c.level}`).join(' / ')
      : 'No Class';
  const raceSummary = splitEntityKey(character.race.raceKey).name || 'No Species';

  return (
    <div
      data-mode={siteDarkMode ? 'dark' : 'light'}
      data-accent="crimson"
      className="min-h-[calc(100vh-3.5rem)] bg-[var(--bg-page)] text-[var(--text-primary)] pb-24"
    >
      {/* D&D Beyond Builder Subheader */}
      <div className="bg-[#242527] text-white border-b border-slate-700 sticky top-14 z-20 shadow">
        <div className="max-w-7xl mx-auto px-4 pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <PortraitAvatar
                url={character.portraitUrl}
                name={character.name}
                frame={character.theme.frame}
                size="sm"
              />
              <div className="min-w-0">
                <div className="font-display text-base sm:text-lg font-extrabold truncate">
                  {character.name || 'Unnamed Adventurer'}
                </div>
                <div className="text-[11px] text-slate-300 font-medium truncate">
                  Level {computed.totalLevel} · {raceSummary} · {classSummary}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenSheet}
              className="px-4 py-2 ddb-btn-blue text-xs flex items-center gap-1.5 shadow cursor-pointer shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              View Character Sheet
            </button>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map((st) => {
              const Icon = st.icon;
              const active = step === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStep(st.id)}
                  className={`px-3.5 py-2.5 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap cursor-pointer border-b-3 transition ${
                    active
                      ? 'border-[#e40712] text-white bg-white/5'
                      : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Centered Builder Content with D&D Beyond Left/Right Step Chevrons */}
      <div className="max-w-6xl mx-auto px-4 py-6 relative">
        <div className="flex items-start gap-3">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setStep(STEPS[currentIdx - 1].id)}
            aria-label="Previous Builder Step"
            className="hidden xl:flex sticky top-48 p-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[#88bcd6] disabled:opacity-30 cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 space-y-6">
            {step === 'home' && <BuilderHomeStep character={character} onChange={updateCharacter} />}
            {step === 'class' && <BuilderClassStep character={character} onChange={updateCharacter} />}
            {step === 'background' && <BuilderBackgroundStep character={character} onChange={updateCharacter} />}
            {step === 'species' && <BuilderSpeciesStep character={character} onChange={updateCharacter} />}
            {step === 'abilities' && <BuilderAbilitiesStep character={character} onChange={updateCharacter} />}
            {step === 'equipment' && <BuilderEquipmentStep character={character} onChange={updateCharacter} />}

            {step === 'next' && (
              <div className="space-y-4">
                <div className="ddb-card ddb-card-accent p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl font-extrabold">
                        What&apos;s Next — {character.name || 'Unnamed Adventurer'}
                      </h2>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Level {computed.totalLevel} {raceSummary} · {classSummary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenSheet}
                      className="px-6 py-3 ddb-btn-primary text-xs flex items-center gap-2 shadow cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      View Character Sheet
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
                      <div className="text-[11px] uppercase text-[var(--text-muted)] font-bold">Armor Class</div>
                      <div className="font-mono-num text-2xl font-extrabold">{computed.ac.value}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">{computed.ac.breakdown}</div>
                    </div>
                    <div className="p-3 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
                      <div className="text-[11px] uppercase text-[var(--text-muted)] font-bold">Max Hit Points</div>
                      <div className="font-mono-num text-2xl font-extrabold text-emerald-600">{computed.maxHp}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        Hit Dice: {computed.hitDicePools.map((h) => `${h.total}d${h.faces}`).join(' + ') || '1d8'}
                      </div>
                    </div>
                    <div className="p-3 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
                      <div className="text-[11px] uppercase text-[var(--text-muted)] font-bold">Initiative</div>
                      <div className="font-mono-num text-2xl font-extrabold">
                        {computed.initiative >= 0 ? `+${computed.initiative}` : computed.initiative}
                      </div>
                    </div>
                    <div className="p-3 rounded bg-[var(--bg-card-alt)] border border-[var(--border-color)]">
                      <div className="text-[11px] uppercase text-[var(--text-muted)] font-bold">Proficiency</div>
                      <div className="font-mono-num text-2xl font-extrabold">+{computed.proficiencyBonus}</div>
                    </div>
                  </div>

                  {computed.validationWarnings.length > 0 ? (
                    <div className="p-4 rounded bg-amber-500/10 border border-amber-500/40 space-y-1.5">
                      <div className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Builder Checklist Reminders
                      </div>
                      <ul className="list-disc pl-5 text-xs text-[var(--text-primary)] space-y-1">
                        {computed.validationWarnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/40 text-xs font-semibold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Character is complete and ready for adventure!
                    </div>
                  )}
                </div>

                {/* Sheet Appearance Customization */}
                <div className="ddb-card p-5 space-y-4">
                  <h3 className="font-display text-base font-bold flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#e40712]" />
                    Sheet Appearance
                  </h3>
                  <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={character.theme.darkMode}
                      onChange={(e) =>
                        updateCharacter((p) => ({ ...p, theme: { ...p.theme, darkMode: e.target.checked } }))
                      }
                      className="accent-[#1b9af0] w-4 h-4"
                    />
                    Underdark Mode (Dark Character Sheet)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1.5">Accent Theme</div>
                      <select
                        value={character.theme.accentTheme}
                        onChange={(e) =>
                          updateCharacter((p) => ({
                            ...p,
                            theme: { ...p.theme, accentTheme: e.target.value as SheetThemeId },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs font-semibold capitalize"
                      >
                        {(['crimson', 'arcane', 'emerald', 'amber', 'violet', 'obsidian'] as SheetThemeId[]).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1.5">Backdrop</div>
                      <select
                        value={character.theme.backdrop}
                        onChange={(e) =>
                          updateCharacter((p) => ({
                            ...p,
                            theme: { ...p.theme, backdrop: e.target.value as BackdropId },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs font-semibold capitalize"
                      >
                        {(['obsidian', 'astral', 'tavern', 'feywild', 'bloodmoon'] as BackdropId[]).map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1.5">Portrait Frame</div>
                      <select
                        value={character.theme.frame}
                        onChange={(e) =>
                          updateCharacter((p) => ({
                            ...p,
                            theme: { ...p.theme, frame: e.target.value as PortraitFrameId },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-xs font-semibold capitalize"
                      >
                        {(['gold-filigree', 'iron-crest', 'arcane-ring', 'crimson-seal', 'minimal'] as PortraitFrameId[]).map((f) => (
                          <option key={f} value={f}>{f.replace('-', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile / Footer Prev & Next Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setStep(STEPS[currentIdx - 1].id)}
                className="px-4 py-2 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold uppercase disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              {currentIdx < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(STEPS[currentIdx + 1].id)}
                  className="px-5 py-2 ddb-btn-blue text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  Next: {STEPS[currentIdx + 1].label}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenSheet}
                  className="px-5 py-2 ddb-btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  View Character Sheet
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={currentIdx >= STEPS.length - 1}
            onClick={() => setStep(STEPS[currentIdx + 1].id)}
            aria-label="Next Builder Step"
            className="hidden xl:flex sticky top-48 p-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[#88bcd6] disabled:opacity-30 cursor-pointer shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
