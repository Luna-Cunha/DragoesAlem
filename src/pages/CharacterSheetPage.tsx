import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  BedDouble,
  Edit3,
  FileDown,
  Flame,
  Loader2,
  Palette,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import sheetBackdropUrl from '../assets/sheet-backdrop.svg';
import { exportCharacterToPdf } from '../services/pdfSheetExporter';
import { useApp } from '../context/AppContext';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  XP_THRESHOLDS,
  computeCharacter,
  formatSigned,
  splitEntityKey,
} from '../engine/rules';
import type { Character } from '../types/character';
import { PortraitAvatar } from '../components/PortraitAvatar';
import { SheetActionsTab } from '../components/sheet/SheetActionsTab';
import { SheetFeaturesTab } from '../components/sheet/SheetFeaturesTab';
import { SheetSpellsTab } from '../components/sheet/SheetSpellsTab';
import { SheetInventoryTab } from '../components/sheet/SheetInventoryTab';
import { SheetCustomizeModal } from '../components/sheet/SheetCustomizeModal';
import {
  AbilityCrestCard,
  AcShieldBadge,
  InitiativeHexBadge,
  SculptedPanel,
} from '../components/sheet/SheetFrames';

type SheetTab = 'actions' | 'spells' | 'inventory' | 'features' | 'description' | 'extras';

export function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>();
  const {
    compendium,
    characters,
    upsertCharacter,
    rollD20,
    rollExpression,
    openDrawer,
    openReferenceByTag,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SheetTab>('actions');
  const [hpInput, setHpInput] = useState('1');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [shortRestOpen, setShortRestOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterMax, setNewCounterMax] = useState(1);

  const character = characters.find((c) => c.id === id);

  const computed = useMemo(() => {
    if (!character || !compendium) return null;
    return computeCharacter(character, compendium);
  }, [character, compendium]);

  if (!compendium) return null;

  if (!character || !computed) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#0c1016] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-white">Character Not Found</h1>
        <p className="text-sm text-[#9ca3af]">
          This character does not exist in your local IndexedDB vault.
        </p>
        <div className="flex gap-3">
          <Link
            to="/characters"
            className="px-4 py-2 rounded bg-[#1d2026] hover:bg-[#2a2e36] border border-[#4c525e] text-white text-xs font-bold uppercase"
          >
            Back to Vault
          </Link>
          <Link
            to="/characters/builder"
            className="px-4 py-2 rounded bg-[#7f292e] hover:bg-[#943339] text-white text-xs font-bold uppercase"
          >
            Create Character
          </Link>
        </div>
      </div>
    );
  }

  const updateChar = (updater: (prev: Character) => Character) => {
    const next = updater(character);
    void upsertCharacter(next);
  };

  const applyHpDelta = (delta: number) => {
    updateChar((p) => {
      const current = computed.effectiveCurrentHp;
      let temp = p.playState.tempHp || 0;
      let nextHp = current;

      if (delta < 0) {
        const dmg = Math.abs(delta);
        const absorbed = Math.min(temp, dmg);
        temp -= absorbed;
        nextHp = Math.max(0, current - (dmg - absorbed));
      } else {
        nextHp = Math.min(computed.maxHp, current + delta);
      }

      return {
        ...p,
        playState: {
          ...p.playState,
          currentHp: nextHp,
          tempHp: temp,
          deathSaves: nextHp > 0 ? { successes: 0, failures: 0 } : p.playState.deathSaves,
        },
      };
    });
  };

  const performLongRest = () => {
    updateChar((p) => {
      const nextHitDiceUsed: Record<number, number> = {};
      for (const pool of computed.hitDicePools) {
        const regain = Math.max(1, Math.floor(pool.total / 2));
        nextHitDiceUsed[pool.faces] = Math.max(0, pool.used - regain);
      }
      const nextFeatures = { ...p.playState.featureUses };
      for (const f of computed.features) {
        if (f.limitedUse) delete nextFeatures[f.id];
      }
      return {
        ...p,
        playState: {
          ...p.playState,
          currentHp: computed.maxHp,
          tempHp: 0,
          hitDiceUsed: nextHitDiceUsed,
          deathSaves: { successes: 0, failures: 0 },
          spellSlotsUsed: {},
          pactSlotsUsed: 0,
          featureUses: nextFeatures,
          customCounters: p.playState.customCounters.map((c) =>
            c.resetOn === 'short' || c.resetOn === 'long' ? { ...c, used: 0 } : c,
          ),
        },
      };
    });
  };

  const performShortRest = () => {
    updateChar((p) => {
      const nextFeatures = { ...p.playState.featureUses };
      for (const f of computed.features) {
        if (f.limitedUse?.resetOn === 'short') delete nextFeatures[f.id];
      }
      return {
        ...p,
        playState: {
          ...p.playState,
          pactSlotsUsed: 0,
          featureUses: nextFeatures,
          customCounters: p.playState.customCounters.map((c) =>
            c.resetOn === 'short' ? { ...c, used: 0 } : c,
          ),
        },
      };
    });
    setShortRestOpen(false);
  };

  const spendHitDieToHeal = (faces: number) => {
    const rec = rollExpression(
      `1d${faces}${formatSigned(computed.abilityScores.con.modifier)}`,
      `Hit Die (d${faces})`,
      'Short Rest Healing',
    );
    const heal = Math.max(1, rec.total);
    updateChar((p) => ({
      ...p,
      playState: {
        ...p.playState,
        currentHp: Math.min(computed.maxHp, computed.effectiveCurrentHp + heal),
        hitDiceUsed: {
          ...p.playState.hitDiceUsed,
          [faces]: (p.playState.hitDiceUsed[faces] || 0) + 1,
        },
      },
    }));
  };

  const raceName = splitEntityKey(character.race.raceKey).name || 'Adventurer';
  const classLine =
    character.classes.length > 0
      ? character.classes
          .map((c) => `${c.className}${c.subclassName ? ` (${c.subclassName})` : ''} ${c.level}`)
          .join(' / ')
      : 'Classless';
  const nextXpGoal = XP_THRESHOLDS[Math.min(19, computed.totalLevel)] || 355000;

  const isDark = character.theme.darkMode;
  const overlayGradient = isDark
    ? 'linear-gradient(to bottom, rgba(14, 18, 24, 0.36), rgba(10, 12, 16, 0.56))'
    : 'linear-gradient(to bottom, rgba(241, 245, 249, 0.55), rgba(226, 232, 240, 0.72))';

  return (
    <div
      data-mode={isDark ? 'dark' : 'light'}
      data-accent={character.theme.accentTheme}
      className="sheet-root min-h-[calc(100vh-3.5rem)] text-[var(--text-primary)] pb-24"
      style={{
        backgroundImage: `${overlayGradient}, url(${sheetBackdropUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Stylized Translucent D&D Beyond Sheet Top Bar */}
      <div className="bg-[#101216]/92 backdrop-blur-md text-white border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <PortraitAvatar
              url={character.portraitUrl}
              name={character.name}
              frame={character.theme.frame}
              size="md"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white truncate">
                  {character.name || 'Unnamed Adventurer'}
                </h1>
                <Link
                  to={`/characters/builder/${character.id}`}
                  className="px-2 py-0.5 rounded-[3px] bg-[#1c1f26] hover:bg-[#282c36] border border-[#4c525e] text-[10px] font-bold uppercase tracking-wider text-[#d1d5db] flex items-center gap-1 transition no-print"
                >
                  <Edit3 className="w-3 h-3" />
                  Manage
                </Link>
              </div>
              <div className="text-xs text-[#9ca3af] font-medium mt-0.5">
                {raceName} · {classLine} · Level {computed.totalLevel}
              </div>
              {character.preferences.advancement === 'xp' && (
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <input
                    type="number"
                    min={0}
                    value={character.xp}
                    onChange={(e) =>
                      updateChar((p) => ({ ...p, xp: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                    }
                    className="w-20 px-1.5 py-0.5 rounded bg-black/40 border border-white/20 font-mono-num text-xs text-white"
                  />
                  <span className="text-[#9ca3af]">/ {nextXpGoal.toLocaleString()} XP</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={() => setShortRestOpen((v) => !v)}
              className="px-3 py-1.5 rounded-[3px] bg-[#191c22]/90 hover:bg-[#252932] border border-[#454a54] text-[#e5e7eb] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition"
            >
              <Flame className="w-3.5 h-3.5 text-[#b8c0cc]" />
              Short Rest
            </button>
            <button
              type="button"
              onClick={performLongRest}
              className="px-3 py-1.5 rounded-[3px] bg-[#191c22]/90 hover:bg-[#252932] border border-[#454a54] text-[#e5e7eb] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition"
            >
              <BedDouble className="w-3.5 h-3.5 text-[#b8c0cc]" />
              Long Rest
            </button>
            <button
              type="button"
              disabled={exportingPdf}
              onClick={async () => {
                if (exportingPdf) return;
                setExportingPdf(true);
                try {
                  await exportCharacterToPdf(character, computed, compendium);
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Failed to export character PDF.');
                } finally {
                  setExportingPdf(false);
                }
              }}
              className="px-3 py-1.5 rounded-[3px] bg-[#191c22]/90 hover:bg-[#252932] border border-[#454a54] text-[#e5e7eb] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
            >
              {exportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#b8c0cc]" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-[#b8c0cc]" />
              )}
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => setCustomizeOpen(true)}
              className="px-3 py-1.5 rounded-[3px] bg-[#191c22]/90 hover:bg-[#252932] border border-[#454a54] text-[#e5e7eb] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition"
            >
              <Palette className="w-3.5 h-3.5 text-[#b8c0cc]" />
              Customize
            </button>
          </div>
        </div>

        {/* Short Rest Inline Bar */}
        {shortRestOpen && (
          <div className="max-w-[1440px] mx-auto px-4 pb-3">
            <div className="p-3 rounded-[4px] bg-[#181b21] border border-[#4c525e] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white">Short Rest · Spend Hit Dice:</span>
                {computed.hitDicePools.map((pool) => {
                  const rem = pool.total - pool.used;
                  return (
                    <button
                      key={pool.faces}
                      type="button"
                      disabled={rem <= 0}
                      onClick={() => spendHitDieToHeal(pool.faces)}
                      className="px-2.5 py-1 rounded bg-[#22262f] border border-[#525866] hover:border-white/60 text-white font-mono-num font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Roll d{pool.faces} ({rem}/{pool.total})
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={performShortRest}
                  className="px-3 py-1 rounded bg-[#2c4a38] hover:bg-[#375c46] border border-[#4d755d] text-white font-bold uppercase cursor-pointer"
                >
                  Complete Short Rest
                </button>
                <button
                  type="button"
                  onClick={() => setShortRestOpen(false)}
                  className="px-2.5 py-1 rounded bg-white/10 text-[#d1d5db] hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Sheet Container */}
      <div className="max-w-[1440px] mx-auto px-4 py-4 space-y-4">
        {/* TOP STRIP: 6 Abilities + Proficiency/Speed/Inspiration + Wide Hit Points */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
          {/* 6 Abilities */}
          <div className="xl:col-span-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ABILITY_KEYS.map((ab) => {
              const info = computed.abilityScores[ab];
              return (
                <AbilityCrestCard
                  key={ab}
                  label={ABILITY_LABELS[ab].full}
                  modifierText={formatSigned(info.modifier)}
                  scoreTotal={info.total}
                  onRollCheck={() =>
                    rollD20(info.modifier, `${ABILITY_LABELS[ab].full} Check`, 'Ability Check')
                  }
                  onInspectScore={() =>
                    openDrawer({
                      title: `${ABILITY_LABELS[ab].full} Score`,
                      subtitle: `Total: ${info.total} (${formatSigned(info.modifier)})`,
                      metaRows: [
                        { label: 'Base Score', value: String(info.base) },
                        { label: 'Species Bonus', value: formatSigned(info.speciesBonus) },
                        { label: 'Background Bonus', value: formatSigned(info.backgroundBonus) },
                        { label: 'ASI / Feat Bonus', value: formatSigned(info.asiFeatBonus) },
                        { label: 'Misc Bonus', value: formatSigned(info.miscBonus) },
                        ...(info.override ? [{ label: 'Override', value: String(info.override) }] : []),
                      ],
                    })
                  }
                />
              );
            })}
          </div>

          {/* Proficiency, Speed, Heroic Inspiration & Prominent Hit Points */}
          <div className="xl:col-span-6 grid grid-cols-12 gap-2.5 items-stretch">
            <SculptedPanel
              className="col-span-4 sm:col-span-2"
              innerClassName="p-2 flex flex-col items-center justify-center text-center"
            >
              <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
                Proficiency
              </div>
              <div className="font-mono-num text-2xl font-extrabold text-white my-0.5 leading-none">
                +{computed.proficiencyBonus}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
                Bonus
              </div>
            </SculptedPanel>

            <SculptedPanel
              className="col-span-4 sm:col-span-3"
              innerClassName="p-2 flex flex-col items-center justify-center text-center"
            >
              <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
                Walking
              </div>
              <div className="font-mono-num text-2xl font-extrabold text-white my-0.5 leading-none">
                {computed.speeds.walk}{' '}
                <span className="text-xs font-medium text-[#b5bcc7]">ft.</span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] truncate max-w-full">
                {[
                  computed.speeds.fly ? `Fly ${computed.speeds.fly}` : '',
                  computed.speeds.swim ? `Swim ${computed.speeds.swim}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Speed'}
              </div>
            </SculptedPanel>

            <div className="col-span-4 sm:col-span-2 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={() =>
                  updateChar((p) => ({
                    ...p,
                    playState: {
                      ...p.playState,
                      heroicInspiration: !p.playState.heroicInspiration,
                    },
                  }))
                }
                aria-pressed={character.playState.heroicInspiration}
                title="Toggle Heroic Inspiration"
                className="w-full h-full min-h-[76px] flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <div
                  className={`sheet-chamfer-sm w-12 h-11 flex items-center justify-center border transition ${
                    character.playState.heroicInspiration
                      ? 'bg-[#2a2e38] border-[#d1d5db] text-white'
                      : 'bg-[#121418]/90 border-[var(--sheet-frame,#7f292e)]/80 text-[#6b7280] group-hover:text-[#d1d5db]'
                  }`}
                >
                  <Star
                    className={`w-5 h-5 ${character.playState.heroicInspiration ? 'fill-white text-white' : ''}`}
                  />
                </div>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#d1d5db] leading-tight">
                  Heroic
                  <br />
                  Inspiration
                </span>
              </button>
            </div>

            {/* Wide Hit Points Panel with Large Current / Max HP */}
            <SculptedPanel
              className="col-span-12 sm:col-span-5"
              innerClassName="px-3 py-2 flex items-center justify-between gap-2.5"
            >
              {/* Left Heal / Amount / Damage Stack */}
              <div className="w-[74px] flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => applyHpDelta(parseInt(hpInput, 10) || 1)}
                  className="w-full py-0.5 rounded-[2px] bg-[#1e3126] hover:bg-[#2a4435] border border-[#3e614d] text-[#e5e7eb] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition"
                  title="Heal HP"
                >
                  Heal
                </button>
                <input
                  type="number"
                  min={1}
                  aria-label="HP Adjustment Amount"
                  value={hpInput}
                  onChange={(e) => setHpInput(e.target.value)}
                  className="w-full py-0.5 rounded-[2px] bg-[#0e1014] border border-[#454a54] font-mono-num text-xs text-center font-bold text-white focus:outline-none focus:border-[#9ca3af]"
                />
                <button
                  type="button"
                  onClick={() => applyHpDelta(-(parseInt(hpInput, 10) || 1))}
                  className="w-full py-0.5 rounded-[2px] bg-[#361c1f] hover:bg-[#492529] border border-[#6e363b] text-[#e5e7eb] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition"
                  title="Apply Damage"
                >
                  Damage
                </button>
              </div>

              {/* Right Big Current / Max / Temp Display */}
              <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-x-1.5 text-center w-full">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-0.5">
                      Current
                    </div>
                    <div
                      data-testid="current-hp-value"
                      className="font-mono-num text-3xl sm:text-4xl font-extrabold text-white leading-none"
                    >
                      {computed.effectiveCurrentHp}
                    </div>
                  </div>
                  <div className="font-mono-num text-2xl sm:text-3xl font-normal text-[#6b7280] leading-none pb-0.5">
                    /
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-0.5">
                      Max
                    </div>
                    <div
                      data-testid="max-hp-value"
                      className="font-mono-num text-3xl sm:text-4xl font-extrabold text-white leading-none"
                    >
                      {computed.maxHp}
                    </div>
                  </div>
                  <div className="pl-1">
                    <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-0.5">
                      Temp
                    </div>
                    <input
                      type="number"
                      min={0}
                      placeholder="--"
                      aria-label="Temporary HP"
                      value={character.playState.tempHp === 0 ? '' : character.playState.tempHp}
                      onChange={(e) =>
                        updateChar((p) => ({
                          ...p,
                          playState: {
                            ...p.playState,
                            tempHp: Math.max(0, parseInt(e.target.value, 10) || 0),
                          },
                        }))
                      }
                      className="w-10 text-center bg-transparent border-b border-white/15 font-mono-num text-xl font-bold text-[#d1d5db] placeholder:text-[#6b7280] leading-none focus:outline-none focus:border-white/50"
                    />
                  </div>
                </div>
                <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#b4bcc6]">
                  Hit Points
                </div>
              </div>
            </SculptedPanel>
          </div>
        </div>

        {/* MAIN 3-COLUMN SHEET GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* LEFT COLUMN (Saving Throws, Senses, Proficiencies & Languages, Death Saves) */}
          <div className="lg:col-span-3 space-y-3.5">
            {/* Saving Throws */}
            <SculptedPanel showFooterNotch innerClassName="p-3.5 space-y-2.5">
              <div className="grid grid-cols-2 gap-1.5">
                {ABILITY_KEYS.map((ab) => {
                  const sv = computed.savingThrows[ab];
                  return (
                    <button
                      key={ab}
                      type="button"
                      onClick={() => rollD20(sv.bonus, `${ABILITY_LABELS[ab].full} Save`, 'Saving Throw')}
                      className="px-2.5 py-1.5 rounded-[4px] bg-white/[0.03] border border-white/15 hover:border-white/40 hover:bg-white/[0.08] flex items-center justify-between text-xs cursor-pointer transition"
                    >
                      <span className="flex items-center gap-1.5 font-bold text-[#d1d5db]">
                        <span
                          className={`w-2.5 h-2.5 rounded-full border ${
                            sv.proficient
                              ? 'bg-[#a63a40] border-[#d1d5db]/60'
                              : 'border-[#6b7280]'
                          }`}
                        />
                        {ABILITY_LABELS[ab].short}
                      </span>
                      <span className="sheet-roll-box px-1.5 py-0.5 font-mono-num font-bold text-xs">
                        {formatSigned(sv.bonus)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="pt-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#d1d5db]">
                Saving Throws
              </div>
            </SculptedPanel>

            {/* Senses */}
            <SculptedPanel showFooterNotch innerClassName="p-3.5 space-y-2">
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'Passive Perception', val: computed.passivePerception },
                  { label: 'Passive Investigation', val: computed.passiveInvestigation },
                  { label: 'Passive Insight', val: computed.passiveInsight },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] bg-white/[0.03] border border-white/15"
                  >
                    <span className="sheet-roll-box px-2 py-0.5 font-mono-num text-xs font-extrabold min-w-[30px] text-center">
                      {s.val}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#b4bcc6]">
                      {s.label}
                    </span>
                  </div>
                ))}
                {computed.senses.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {computed.senses.map((sn) => (
                      <button
                        key={sn.name}
                        type="button"
                        onClick={() => openReferenceByTag('sense', sn.name)}
                        className="px-2.5 py-1 rounded-[3px] bg-white/[0.06] border border-white/15 hover:border-white/40 text-[#e5e7eb] font-semibold text-xs cursor-pointer transition"
                      >
                        {sn.name} {sn.range ? `${sn.range} ft.` : ''}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-[11px] italic text-[#8a939e] pt-1">
                    Additional Sense Types
                  </div>
                )}
              </div>
              <div className="pt-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#d1d5db]">
                Senses
              </div>
            </SculptedPanel>

            {/* Proficiencies & Languages */}
            <SculptedPanel innerClassName="p-3.5 space-y-2.5 text-xs">
              <div className="border-b border-white/10 pb-2">
                <span className="font-bold text-[#9ca3af] uppercase tracking-wider text-[10px] block mb-0.5">
                  Armor
                </span>
                <span className="text-[#e5e7eb]">{computed.armorProficiencies.join(', ') || 'None'}</span>
              </div>
              <div className="border-b border-white/10 pb-2">
                <span className="font-bold text-[#9ca3af] uppercase tracking-wider text-[10px] block mb-0.5">
                  Weapons
                </span>
                <span className="text-[#e5e7eb]">{computed.weaponProficiencies.join(', ') || 'None'}</span>
              </div>
              <div className="border-b border-white/10 pb-2">
                <span className="font-bold text-[#9ca3af] uppercase tracking-wider text-[10px] block mb-0.5">
                  Tools
                </span>
                <span className="capitalize text-[#e5e7eb]">
                  {computed.toolProficiencies.join(', ') || 'None'}
                </span>
              </div>
              <div>
                <span className="font-bold text-[#9ca3af] uppercase tracking-wider text-[10px] block mb-0.5">
                  Languages
                </span>
                <span className="text-[#e5e7eb]">{computed.languages.join(', ') || 'Common'}</span>
              </div>
              <div className="pt-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#d1d5db]">
                Proficiencies &amp; Languages
              </div>
            </SculptedPanel>

            {/* Death Saves & Mage Armor */}
            <SculptedPanel innerClassName="p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#d1d5db]">
                  Death Saves
                </span>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-10 text-[#9ca3af] font-bold">SUCC</span>
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          updateChar((p) => ({
                            ...p,
                            playState: {
                              ...p.playState,
                              deathSaves: {
                                ...p.playState.deathSaves,
                                successes: p.playState.deathSaves.successes === n ? n - 1 : n,
                              },
                            },
                          }))
                        }
                        className={`w-3.5 h-3.5 rounded-full border cursor-pointer ${
                          character.playState.deathSaves.successes >= n
                            ? 'bg-[#4f7c60] border-[#82ad91]'
                            : 'border-[#6b7280]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-10 text-[#9ca3af] font-bold">FAIL</span>
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          updateChar((p) => ({
                            ...p,
                            playState: {
                              ...p.playState,
                              deathSaves: {
                                ...p.playState.deathSaves,
                                failures: p.playState.deathSaves.failures === n ? n - 1 : n,
                              },
                            },
                          }))
                        }
                        className={`w-3.5 h-3.5 rounded-full border cursor-pointer ${
                          character.playState.deathSaves.failures >= n
                            ? 'bg-[#8f3439] border-[#c46c71]'
                            : 'border-[#6b7280]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-center justify-between text-xs pt-2 border-t border-white/10 cursor-pointer text-[#d1d5db]">
                <span className="font-medium">Mage Armor Active (13 + DEX)</span>
                <input
                  type="checkbox"
                  checked={character.playState.mageArmorActive}
                  onChange={(e) =>
                    updateChar((p) => ({
                      ...p,
                      playState: { ...p.playState, mageArmorActive: e.target.checked },
                    }))
                  }
                  className="accent-[#7f292e]"
                />
              </label>
            </SculptedPanel>
          </div>

          {/* CENTER COLUMN: SKILLS */}
          <SculptedPanel showFooterNotch className="lg:col-span-3" innerClassName="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] pb-1.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-4 text-center">Prof</span>
                <span className="w-7">Mod</span>
                <span>Skill</span>
              </div>
              <span>Bonus</span>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {computed.skills.map((sk) => (
                <div key={sk.name} className="py-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-4 flex items-center justify-center shrink-0"
                      title={
                        sk.proficiency === 2
                          ? 'Expertise (2x PB)'
                          : sk.proficiency === 1
                            ? 'Proficient'
                            : sk.proficiency === 0.5
                              ? 'Half Proficiency'
                              : 'Not Proficient'
                      }
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full border ${
                          sk.proficiency === 2
                            ? 'bg-white border-white ring-2 ring-[#8f292e]'
                            : sk.proficiency === 1
                              ? 'bg-[#a63a40] border-[#d1d5db]/60'
                              : sk.proficiency === 0.5
                                ? 'bg-[#6b7280] border-[#9ca3af]'
                                : 'border-[#6b7280]'
                        }`}
                      />
                    </span>
                    <span className="text-[10px] font-bold uppercase text-[#8e96a2] w-7">
                      {sk.ability}
                    </span>
                    <button
                      type="button"
                      onClick={() => openReferenceByTag('skill', sk.name)}
                      className="truncate font-medium text-[#e5e7eb] hover:text-white cursor-pointer text-left"
                    >
                      {sk.name}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => rollD20(sk.bonus, `${sk.name} (${sk.ability.toUpperCase()})`, 'Skill Check')}
                    className="sheet-roll-box px-2 py-0.5 font-mono-num text-xs font-bold cursor-pointer shrink-0 min-w-[34px] text-center"
                  >
                    {formatSigned(sk.bonus)}
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-2 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#d1d5db]">
              Skills
            </div>
          </SculptedPanel>

          {/* RIGHT MAIN COLUMN: Initiative + AC + Defenses/Conditions + Tabbed Box */}
          <div className="lg:col-span-6 space-y-3.5">
            {/* Initiative, Armor Class & Defenses/Conditions Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center justify-center gap-3 shrink-0">
                <InitiativeHexBadge
                  initiativeText={formatSigned(computed.initiative)}
                  onRoll={() => rollD20(computed.initiative, 'Initiative', 'Combat Start')}
                />
                <AcShieldBadge
                  ac={computed.ac.value}
                  onClick={() =>
                    openDrawer({
                      title: `Armor Class: ${computed.ac.value}`,
                      subtitle: 'AC Formula Breakdown',
                      metaRows: [
                        { label: 'Calculation', value: computed.ac.breakdown },
                        { label: 'Equipped Armor', value: computed.ac.equippedArmorName || 'Unarmored' },
                        { label: 'Shield', value: computed.ac.hasShield ? 'Yes (+2+)' : 'No' },
                      ],
                    })
                  }
                />
              </div>

              <SculptedPanel className="flex-1" innerClassName="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 sm:border-r sm:border-white/10 sm:pr-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#d1d5db] flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#9ca3af]" />
                    Defenses
                  </div>
                  {computed.resistances.length === 0 && computed.immunities.length === 0 ? (
                    <div className="text-[11px] text-[#9ca3af]">
                      Resistances, Immunities, or Vulnerabilities
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-[11px] text-[#d1d5db]">
                      {computed.resistances.length > 0 && (
                        <div>
                          <span className="text-[#9ca3af] font-semibold">Resist: </span>
                          <span className="capitalize">{computed.resistances.join(', ')}</span>
                        </div>
                      )}
                      {computed.immunities.length > 0 && (
                        <div>
                          <span className="text-[#9ca3af] font-semibold">Immune: </span>
                          <span className="capitalize">{computed.immunities.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#d1d5db]">
                    Conditions
                  </div>
                  <select
                    aria-label="Add Active Condition"
                    value=""
                    onChange={(e) => {
                      const name = e.target.value;
                      if (!name) return;
                      updateChar((p) => {
                        const exists = p.playState.activeConditions.some((c) => c.name === name);
                        if (exists) return p;
                        return {
                          ...p,
                          playState: {
                            ...p.playState,
                            activeConditions: [...p.playState.activeConditions, { name }],
                          },
                        };
                      });
                    }}
                    className="w-full px-2 py-1 rounded-[3px] bg-[#0e1014] border border-white/15 text-[11px] text-[#d1d5db]"
                  >
                    <option value="">Add Active Conditions</option>
                    {compendium.conditions.map((cond) => (
                      <option key={`${cond.name}|${cond.source}`} value={cond.name}>
                        {cond.name} ({cond.source})
                      </option>
                    ))}
                  </select>

                  {character.playState.activeConditions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {character.playState.activeConditions.map((cond) => (
                        <span
                          key={cond.name}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-[#361c1f] text-[#e5e7eb] border border-[#7f292e] text-[10px] font-bold"
                        >
                          <button
                            type="button"
                            onClick={() => openReferenceByTag('condition', cond.name)}
                            className="cursor-pointer hover:underline"
                          >
                            {cond.name}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateChar((p) => ({
                                ...p,
                                playState: {
                                  ...p.playState,
                                  activeConditions: p.playState.activeConditions.filter(
                                    (x) => x.name !== cond.name,
                                  ),
                                },
                              }))
                            }
                            className="ml-0.5 text-[#9ca3af] hover:text-white cursor-pointer"
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </SculptedPanel>
            </div>

            {/* MAIN TABBED ACTIONS / SPELLS / INVENTORY / FEATURES / DESCRIPTION / EXTRAS */}
            <SculptedPanel innerClassName="overflow-hidden">
              {/* Sheet Navigation Tabs */}
              <div className="border-b border-white/10 px-3 pt-2.5 flex items-center gap-1 overflow-x-auto bg-black/20">
                {(
                  [
                    { id: 'actions', label: 'Actions' },
                    { id: 'spells', label: 'Spells' },
                    { id: 'inventory', label: 'Inventory' },
                    { id: 'features', label: 'Features & Traits' },
                    { id: 'description', label: 'Description' },
                    { id: 'extras', label: 'Extras' },
                  ] as { id: SheetTab; label: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer border-b-2 transition ${
                      activeTab === t.id
                        ? 'border-[var(--sheet-frame,#7f292e)] text-white'
                        : 'border-transparent text-[#9ca3af] hover:text-[#e5e7eb]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* TAB: ACTIONS */}
                {activeTab === 'actions' && (
                  <SheetActionsTab character={character} computed={computed} onChange={updateChar} />
                )}

                {/* TAB: SPELLS */}
                {activeTab === 'spells' && (
                  <SheetSpellsTab character={character} computed={computed} onChange={updateChar} />
                )}

                {/* TAB: INVENTORY */}
                {activeTab === 'inventory' && (
                  <SheetInventoryTab character={character} computed={computed} onChange={updateChar} />
                )}

                {/* TAB: FEATURES & TRAITS */}
                {activeTab === 'features' && (
                  <SheetFeaturesTab character={character} computed={computed} />
                )}

                {/* TAB: DESCRIPTION */}
                {activeTab === 'description' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Alignment', val: character.description.alignment },
                        { label: 'Faith', val: character.description.faith || '—' },
                        { label: 'Lifestyle', val: character.description.lifestyle || '—' },
                        { label: 'Size', val: character.description.size || 'Medium' },
                        { label: 'Age', val: character.description.age || '—' },
                        { label: 'Height', val: character.description.height || '—' },
                        { label: 'Weight', val: character.description.weight || '—' },
                        {
                          label: 'Eyes / Hair / Skin',
                          val:
                            [
                              character.description.eyes,
                              character.description.hair,
                              character.description.skin,
                            ]
                              .filter(Boolean)
                              .join(' / ') || '—',
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="p-2.5 rounded-[4px] bg-white/[0.03] border border-white/15"
                        >
                          <div className="text-[10px] uppercase font-bold text-[#9ca3af]">
                            {row.label}
                          </div>
                          <div className="font-semibold text-white mt-0.5">{row.val}</div>
                        </div>
                      ))}
                    </div>

                    {[
                      { label: 'Personality Traits', val: character.description.personalityTraits },
                      { label: 'Ideals', val: character.description.ideals },
                      { label: 'Bonds', val: character.description.bonds },
                      { label: 'Flaws', val: character.description.flaws },
                      { label: 'Backstory', val: character.description.backstory },
                      { label: 'Allies & Organizations', val: character.description.allies },
                      { label: 'Other Possessions', val: character.otherPossessions },
                    ]
                      .filter((b) => b.val)
                      .map((block) => (
                        <div
                          key={block.label}
                          className="p-3 rounded-[4px] bg-white/[0.03] border border-white/15 space-y-1"
                        >
                          <div className="text-[10px] uppercase font-bold text-[#d1d5db]">
                            {block.label}
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed text-[#d1d5db]">
                            {block.val}
                          </p>
                        </div>
                      ))}

                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase font-bold text-[#9ca3af]">
                        Live Session Notes
                      </label>
                      <textarea
                        rows={5}
                        value={character.description.notes}
                        onChange={(e) =>
                          updateChar((p) => ({
                            ...p,
                            description: { ...p.description, notes: e.target.value },
                          }))
                        }
                        placeholder="Write quest logs, NPC names, loot reminders..."
                        className="w-full px-3 py-2 rounded-[4px] bg-[#0e1014] border border-white/15 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {/* TAB: EXTRAS / CUSTOM COUNTERS */}
                {activeTab === 'extras' && (
                  <div className="space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#d1d5db]">
                      Custom Resource Trackers &amp; Ammunition
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newCounterName.trim()) return;
                        updateChar((p) => ({
                          ...p,
                          playState: {
                            ...p.playState,
                            customCounters: [
                              ...p.playState.customCounters,
                              {
                                id: `cnt-${Date.now()}`,
                                name: newCounterName.trim(),
                                max: Math.max(1, newCounterMax),
                                used: 0,
                                resetOn: 'long',
                              },
                            ],
                          },
                        }));
                        setNewCounterName('');
                        setNewCounterMax(1);
                      }}
                      className="flex flex-wrap gap-2"
                    >
                      <input
                        type="text"
                        value={newCounterName}
                        onChange={(e) => setNewCounterName(e.target.value)}
                        placeholder="e.g. Arrows, Luck Points, Potions..."
                        className="flex-1 px-3 py-1.5 rounded-[3px] bg-[#0e1014] border border-white/15 text-xs text-white"
                      />
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={newCounterMax}
                        onChange={(e) => setNewCounterMax(parseInt(e.target.value, 10) || 1)}
                        className="w-20 px-2 py-1.5 rounded-[3px] bg-[#0e1014] border border-white/15 text-xs font-mono-num text-white"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-[3px] bg-[#2a191b] hover:bg-[#382124] border border-[#8c3439] text-white text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </form>

                    <div className="space-y-2">
                      {character.playState.customCounters.map((cnt) => (
                        <div
                          key={cnt.id}
                          className="p-3 rounded-[4px] bg-white/[0.03] border border-white/15 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{cnt.name}</div>
                            <div className="text-[10px] text-[#9ca3af]">
                              Remaining: {cnt.max - cnt.used} / {cnt.max}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateChar((p) => ({
                                  ...p,
                                  playState: {
                                    ...p.playState,
                                    customCounters: p.playState.customCounters.map((c) =>
                                      c.id === cnt.id ? { ...c, used: Math.min(c.max, c.used + 1) } : c,
                                    ),
                                  },
                                }))
                              }
                              className="px-2 py-1 rounded bg-white/[0.05] border border-white/15 text-white font-bold cursor-pointer"
                            >
                              Use (-1)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateChar((p) => ({
                                  ...p,
                                  playState: {
                                    ...p.playState,
                                    customCounters: p.playState.customCounters.map((c) =>
                                      c.id === cnt.id ? { ...c, used: Math.max(0, c.used - 1) } : c,
                                    ),
                                  },
                                }))
                              }
                              className="px-2 py-1 rounded bg-white/[0.05] border border-white/15 text-white font-bold cursor-pointer"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateChar((p) => ({
                                  ...p,
                                  playState: {
                                    ...p.playState,
                                    customCounters: p.playState.customCounters.filter(
                                      (c) => c.id !== cnt.id,
                                    ),
                                  },
                                }))
                              }
                              className="p-1 text-[#9ca3af] hover:text-white cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SculptedPanel>
          </div>
        </div>
      </div>

      <SheetCustomizeModal
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        character={character}
        computed={computed}
        onChange={updateChar}
      />
    </div>
  );
}
