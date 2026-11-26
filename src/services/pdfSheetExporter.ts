import { PDFDocument, type PDFForm } from 'pdf-lib';
import type { CompiledCompendium, EntryNode, Spell5e } from '../types/5etools';
import type { Character, ComputedCharacter } from '../types/character';
import {
  ABILITY_LABELS,
  findItem,
  findSpell,
  formatSigned,
  getAbilityModifier,
  splitEntityKey,
} from '../engine/rules';
import { extractPlainTextFromEntries } from './fiveToolsText';

interface PdfSpellRowSpec {
  levelField: string;
  nameField: string;
  timeField: string;
  rangeField: string;
  concCheck: string;
  ritualCheck: string;
  materialCheck: string;
  notesField: string;
}

// Exact top-to-bottom row mapping on Page 2 of DnD_2024_Character-Sheet - fillable.pdf
const SPELL_TABLE_ROWS: PdfSpellRowSpec[] = [
  { levelField: 'SPELL LEVEL', nameField: 'SPELL NAME', timeField: 'CASTING TIME', rangeField: 'RANGE', concCheck: 'Check Box0', ritualCheck: 'Check Box59', materialCheck: 'Check Box60', notesField: 'SPELL NOTES' },
  { levelField: 'SPELL LEVEL0', nameField: 'SPELL NAME0', timeField: 'CASTING TIME0', rangeField: 'RANGE0', concCheck: 'Check Box64', ritualCheck: 'Check Box65', materialCheck: 'Check Box66', notesField: 'SPELL NOTES0' },
  { levelField: 'SPELL LEVEL1', nameField: 'SPELL NAME1', timeField: 'CASTING TIME1', rangeField: 'RANGE1', concCheck: 'Check Box67', ritualCheck: 'Check Box68', materialCheck: 'Check Box69', notesField: 'SPELL NOTES1' },
  { levelField: 'SPELL LEVEL4', nameField: 'SPELL NAME4', timeField: 'CASTING TIME4', rangeField: 'RANGE4', concCheck: 'Check Box70', ritualCheck: 'Check Box71', materialCheck: 'Check Box72', notesField: 'SPELL NOTES2' },
  { levelField: 'SPELL LEVEL3', nameField: 'SPELL NAME3', timeField: 'CASTING TIME3', rangeField: 'RANGE3', concCheck: 'Check Box73', ritualCheck: 'Check Box74', materialCheck: 'Check Box75', notesField: 'SPELL NOTES3' },
  { levelField: 'SPELL LEVEL2', nameField: 'SPELL NAME2', timeField: 'CASTING TIME2', rangeField: 'RANGE2', concCheck: 'Check Box76', ritualCheck: 'Check Box77', materialCheck: 'Check Box78', notesField: 'SPELL NOTES4' },
  { levelField: 'SPELL LEVEL7', nameField: 'SPELL NAME7', timeField: 'CASTING TIME7', rangeField: 'RANGE7', concCheck: 'Check Box79', ritualCheck: 'Check Box80', materialCheck: 'Check Box81', notesField: 'SPELL NOTES5' },
  { levelField: 'SPELL LEVEL6', nameField: 'SPELL NAME6', timeField: 'CASTING TIME6', rangeField: 'RANGE6', concCheck: 'Check Box85', ritualCheck: 'Check Box86', materialCheck: 'Check Box87', notesField: 'SPELL NOTES6' },
  { levelField: 'SPELL LEVEL5', nameField: 'SPELL NAME5', timeField: 'CASTING TIME5', rangeField: 'RANGE5', concCheck: 'Check Box82', ritualCheck: 'Check Box83', materialCheck: 'Check Box84', notesField: 'SPELL NOTES7' },
  { levelField: 'SPELL LEVEL10', nameField: 'SPELL NAME10', timeField: 'CASTING TIME10', rangeField: 'RANGE10', concCheck: 'Check Box88', ritualCheck: 'Check Box89', materialCheck: 'Check Box90', notesField: 'SPELL NOTES8' },
  { levelField: 'SPELL LEVEL9', nameField: 'SPELL NAME9', timeField: 'CASTING TIME9', rangeField: 'RANGE9', concCheck: 'Check Box91', ritualCheck: 'Check Box92', materialCheck: 'Check Box93', notesField: 'SPELL NOTES9' },
  { levelField: 'SPELL LEVEL8', nameField: 'SPELL NAME8', timeField: 'CASTING TIME8', rangeField: 'RANGE8', concCheck: 'Check Box94', ritualCheck: 'Check Box95', materialCheck: 'Check Box96', notesField: 'SPELL NOTES10' },
  { levelField: 'SPELL LEVEL13', nameField: 'SPELL NAME13', timeField: 'CASTING TIME13', rangeField: 'RANGE13', concCheck: 'Check Box97', ritualCheck: 'Check Box98', materialCheck: 'Check Box99', notesField: 'SPELL NOTES11' },
  { levelField: 'SPELL LEVEL12', nameField: 'SPELL NAME12', timeField: 'CASTING TIME12', rangeField: 'RANGE12', concCheck: 'Check Box100', ritualCheck: 'Check Box101', materialCheck: 'Check Box102', notesField: 'SPELL NOTES12' },
  { levelField: 'SPELL LEVEL11', nameField: 'SPELL NAME11', timeField: 'CASTING TIME11', rangeField: 'RANGE11', concCheck: 'Check Box103', ritualCheck: 'Check Box104', materialCheck: 'Check Box105', notesField: 'SPELL NOTES13' },
  { levelField: 'SPELL LEVEL16', nameField: 'SPELL NAME16', timeField: 'CASTING TIME16', rangeField: 'RANGE16', concCheck: 'Check Box106', ritualCheck: 'Check Box107', materialCheck: 'Check Box108', notesField: 'SPELL NOTES14' },
  { levelField: 'SPELL LEVEL15', nameField: 'SPELL NAME15', timeField: 'CASTING TIME15', rangeField: 'RANGE15', concCheck: 'Check Box109', ritualCheck: 'Check Box110', materialCheck: 'Check Box111', notesField: 'SPELL NOTES15' },
  { levelField: 'SPELL LEVEL14', nameField: 'SPELL NAME14', timeField: 'CASTING TIME14', rangeField: 'RANGE14', concCheck: 'Check Box112', ritualCheck: 'Check Box113', materialCheck: 'Check Box114', notesField: 'SPELL NOTES16' },
  { levelField: 'SPELL LEVEL19', nameField: 'SPELL NAME19', timeField: 'CASTING TIME19', rangeField: 'RANGE19', concCheck: 'Check Box115', ritualCheck: 'Check Box116', materialCheck: 'Check Box117', notesField: 'SPELL NOTES17' },
  { levelField: 'SPELL LEVEL18', nameField: 'SPELL NAME18', timeField: 'CASTING TIME18', rangeField: 'RANGE18', concCheck: 'Check Box118', ritualCheck: 'Check Box119', materialCheck: 'Check Box120', notesField: 'SPELL NOTES18' },
  { levelField: 'SPELL LEVEL17', nameField: 'SPELL NAME17', timeField: 'CASTING TIME17', rangeField: 'RANGE17', concCheck: 'Check Box121', ritualCheck: 'Check Box122', materialCheck: 'Check Box123', notesField: 'SPELL NOTES19' },
  { levelField: 'SPELL LEVEL22', nameField: 'SPELL NAME22', timeField: 'CASTING TIME22', rangeField: 'RANGE22', concCheck: 'Check Box124', ritualCheck: 'Check Box125', materialCheck: 'Check Box126', notesField: 'SPELL NOTES20' },
  { levelField: 'SPELL LEVEL21', nameField: 'SPELL NAME21', timeField: 'CASTING TIME21', rangeField: 'RANGE21', concCheck: 'Check Box127', ritualCheck: 'Check Box128', materialCheck: 'Check Box129', notesField: 'SPELL NOTES21' },
  { levelField: 'SPELL LEVEL20', nameField: 'SPELL NAME20', timeField: 'CASTING TIME20', rangeField: 'RANGE20', concCheck: 'Check Box130', ritualCheck: 'Check Box131', materialCheck: 'Check Box132', notesField: 'SPELL NOTES22' },
  { levelField: 'SPELL LEVEL25', nameField: 'SPELL NAME25', timeField: 'CASTING TIME25', rangeField: 'RANGE25', concCheck: 'Check Box133', ritualCheck: 'Check Box134', materialCheck: 'Check Box135', notesField: 'SPELL NOTES23' },
  { levelField: 'SPELL LEVEL24', nameField: 'SPELL NAME24', timeField: 'CASTING TIME24', rangeField: 'RANGE24', concCheck: 'Check Box136', ritualCheck: 'Check Box137', materialCheck: 'Check Box138', notesField: 'SPELL NOTES24' },
  { levelField: 'SPELL LEVEL23', nameField: 'SPELL NAME23', timeField: 'CASTING TIME23', rangeField: 'RANGE23', concCheck: 'Check Box139', ritualCheck: 'Check Box140', materialCheck: 'Check Box141', notesField: 'SPELL NOTES25' },
  { levelField: 'SPELL LEVEL28', nameField: 'SPELL NAME28', timeField: 'CASTING TIME28', rangeField: 'RANGE28', concCheck: 'Check Box142', ritualCheck: 'Check Box143', materialCheck: 'Check Box144', notesField: 'SPELL NOTES26' },
  { levelField: 'SPELL LEVEL27', nameField: 'SPELL NAME27', timeField: 'CASTING TIME27', rangeField: 'RANGE27', concCheck: 'Check Box145', ritualCheck: 'Check Box146', materialCheck: 'Check Box147', notesField: 'SPELL NOTES27' },
  { levelField: 'SPELL LEVEL26', nameField: 'SPELL NAME26', timeField: 'CASTING TIME26', rangeField: 'RANGE26', concCheck: 'Check Box148', ritualCheck: 'Check Box150', materialCheck: 'Check Box26', notesField: 'SPELL NOTES28' },
];

const SPELL_SLOT_FIELDS: Record<number, { totalField: string; checkboxes: string[] }> = {
  1: { totalField: 'LVL1 TOTAL', checkboxes: ['Check Box52', 'Check Box46', 'Check Box40', 'Check Box37'] },
  2: { totalField: 'LVL2 TOTAL', checkboxes: ['Check Box49', 'Check Box38', 'Check Box43'] },
  3: { totalField: 'LVL3 TOTAL', checkboxes: ['Check Box47', 'Check Box44', 'Check Box41'] },
  4: { totalField: 'LVL4 TOTAL', checkboxes: ['Check Box50', 'Check Box53', 'Check Box39'] },
  5: { totalField: 'LVL5 TOTAL', checkboxes: ['Check Box48', 'Check Box45', 'Check Box42'] },
  6: { totalField: 'LVL6 TOTAL', checkboxes: ['Check Box51', 'Check Box54'] },
  7: { totalField: 'LVL7 TOTAL', checkboxes: ['Check Box55', 'Check Box56'] },
  8: { totalField: 'LVL8 TOTAL', checkboxes: ['Check Box58'] },
  9: { totalField: 'LVL9 TOTAL', checkboxes: ['Check Box57'] },
};

const SKILL_TO_PDF: Record<string, { textField: string; checkField: string }> = {
  Acrobatics: { textField: 'ACROBATICS', checkField: 'Check Box8' },
  'Animal Handling': { textField: 'ANIMAL HANDLING', checkField: 'Check Box15' },
  Arcana: { textField: 'ARCANA', checkField: 'Check Box24' },
  Athletics: { textField: 'ATHLETICS', checkField: 'Check Box19' },
  Deception: { textField: 'DECEPTION', checkField: 'Check Box5' },
  History: { textField: 'HISTORY', checkField: 'Check Box20' },
  Insight: { textField: 'INSIGHT', checkField: 'Check Box13' },
  Intimidation: { textField: 'INTIMIDATE', checkField: 'Check Box4' },
  Investigation: { textField: 'INVESTIGATION', checkField: 'Check Box21' },
  Medicine: { textField: 'MEDICINE', checkField: 'Check Box12' },
  Nature: { textField: 'NATURE', checkField: 'Check Box22' },
  Perception: { textField: 'PERCEPTION', checkField: 'Check Box14' },
  Performance: { textField: 'PERFORMANCE', checkField: 'Check Box3' },
  Persuasion: { textField: 'PERSUASION', checkField: 'Check Box2' },
  Religion: { textField: 'RELIGION', checkField: 'Check Box23' },
  'Sleight of Hand': { textField: 'SLEIGHT OF HAND', checkField: 'Check Box9' },
  Stealth: { textField: 'STEALTH', checkField: 'Check Box10' },
  Survival: { textField: 'SURVIVAL', checkField: 'Check Box16' },
};

const SAVE_TO_PDF = [
  { key: 'str' as const, textField: 'STR SAVE', checkField: 'Check Box18' },
  { key: 'dex' as const, textField: 'DEX SAVE', checkField: 'Check Box11' },
  { key: 'con' as const, textField: 'CON SAVE', checkField: 'Check Box7' },
  { key: 'int' as const, textField: 'INT SAVE', checkField: 'Check Box25' },
  { key: 'wis' as const, textField: 'Text Field71', checkField: 'Check Box17' },
  { key: 'cha' as const, textField: 'CHA SAVE', checkField: 'Check Box6' },
];

/**
 * Strip non-WinAnsi characters so Helvetica/standard appearance encoding never throws.
 */
function sanitizePdfText(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/\u2192/g, '->')
    .replace(/[^\t\n\r\x20-\xFF]/g, '');
}

function setTextSafe(form: PDFForm, name: string, value: string) {
  try {
    const field = form.getTextField(name);
    field.setText(sanitizePdfText(value));
  } catch {
    // Ignore if field missing in variant template
  }
}

function setCheckSafe(form: PDFForm, name: string, checked: boolean) {
  try {
    const cb = form.getCheckBox(name);
    if (checked) cb.check();
    else cb.uncheck();
  } catch {
    // Ignore if checkbox missing in variant template
  }
}

function formatFeatureLines(
  features: { name: string; sourceLabel: string; entries: unknown[] }[],
  maxLinesPerEntry = 2,
): string {
  return features
    .map((f) => {
      const body = extractPlainTextFromEntries(f.entries as EntryNode[])
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, maxLinesPerEntry)
        .join(' ');
      return body ? `${f.name} (${f.sourceLabel}): ${body}` : `${f.name} (${f.sourceLabel})`;
    })
    .join('\n\n');
}

function formatSpellCastingTime(sp: Spell5e): string {
  const first = sp.time?.[0];
  if (!first) return '1 A';
  const u = first.unit.toLowerCase();
  if (u === 'action') return `${first.number} A`;
  if (u === 'bonus' || u === 'bonus action') return `${first.number} BA`;
  if (u === 'reaction') return `${first.number} R`;
  return `${first.number} ${first.unit}`;
}

function formatSpellRange(sp: Spell5e): string {
  const r = sp.range;
  if (!r) return 'Self';
  if (r.distance?.amount) return `${r.distance.amount} ft.`;
  return r.type ? r.type.charAt(0).toUpperCase() + r.type.slice(1) : 'Self';
}

function collectCharacterSpells(
  character: Character,
  computed: ComputedCharacter,
  compendium: CompiledCompendium,
): { spell: Spell5e; note: string }[] {
  const out: { spell: Spell5e; note: string }[] = [];
  const seen = new Set<string>();

  for (const grp of computed.spellGroups) {
    const clsSel = character.classes.find((c) => c.id === grp.classId);
    const items = [
      ...(clsSel?.cantrips || []).map((k) => ({ k, note: grp.className })),
      ...(clsSel?.preparedSpells || []).map((k) => ({ k, note: grp.className })),
      ...(clsSel?.knownSpells || []).map((k) => ({ k, note: grp.className })),
      ...grp.alwaysPreparedKeys.map((k) => ({ k, note: 'Always Prepared' })),
      ...grp.innateSpells.map((i) => ({ k: i.spellKey, note: i.uses })),
    ];
    for (const item of items) {
      const sp = findSpell(compendium, item.k);
      if (!sp) continue;
      const uniq = `${sp.level}:${sp.name.toLowerCase()}`;
      if (seen.has(uniq)) continue;
      seen.add(uniq);

      const extras: string[] = [];
      if (sp.savingThrow?.length) extras.push(`Save ${sp.savingThrow.join('/').toUpperCase()}`);
      else if (sp.spellAttack?.length) extras.push('Attack');
      if (item.note) extras.push(item.note);

      out.push({ spell: sp, note: extras.join(' · ') });
    }
  }

  return out.sort((a, b) => a.spell.level - b.spell.level || a.spell.name.localeCompare(b.spell.name));
}

export async function fillDnd2024PdfSheet(
  templateBytes: ArrayBuffer | Uint8Array,
  character: Character,
  computed: ComputedCharacter,
  compendium: CompiledCompendium,
): Promise<Uint8Array> {
  // Copy cross-realm Node Buffers (e.g. from Vitest jsdom) into this realm's Uint8Array
  const normalizedBytes =
    templateBytes instanceof Uint8Array || templateBytes instanceof ArrayBuffer
      ? templateBytes
      : Uint8Array.from(templateBytes as ArrayLike<number>);
  const pdfDoc = await PDFDocument.load(normalizedBytes);
  const form = pdfDoc.getForm();

  // Page 1: Header & Identity
  const bgName = splitEntityKey(character.background.backgroundKey).name;
  const raceName = [splitEntityKey(character.race.raceKey).name, character.race.lineageChoice]
    .filter(Boolean)
    .join(' - ');
  const classText =
    character.classes.length > 0
      ? character.classes.map((c) => `${c.className} ${c.level}`).join(' / ')
      : '';
  const subclassText = character.classes
    .map((c) => c.subclassName)
    .filter(Boolean)
    .join(' / ');

  setTextSafe(form, 'Name', character.name || 'Unnamed Adventurer');
  setTextSafe(form, 'Background', bgName);
  setTextSafe(form, 'Class', classText);
  setTextSafe(form, 'Species', raceName);
  setTextSafe(form, 'Subclass', subclassText);
  setTextSafe(form, 'Level', String(computed.totalLevel));
  setTextSafe(form, 'XP Points', character.preferences.advancement === 'xp' ? String(character.xp) : '');

  // AC, HP, Hit Dice, Death Saves
  setTextSafe(form, 'Armor Class', String(computed.ac.value));
  setCheckSafe(form, 'shield chk', computed.ac.hasShield);
  setTextSafe(form, 'Current HP', String(computed.effectiveCurrentHp));
  setTextSafe(form, 'Max HP', String(computed.maxHp));
  setTextSafe(form, 'Temp HP', character.playState.tempHp > 0 ? String(character.playState.tempHp) : '');

  const spentHdText = computed.hitDicePools
    .filter((p) => p.used > 0)
    .map((p) => `${p.used}d${p.faces}`)
    .join(' ');
  const maxHdText = computed.hitDicePools.map((p) => `${p.total}d${p.faces}`).join(' + ');
  setTextSafe(form, 'Spent HD', spentHdText);
  setTextSafe(form, 'Max HD', maxHdText);

  setCheckSafe(form, 'SUCCESS LEFT L chk', character.playState.deathSaves.successes >= 1);
  setCheckSafe(form, 'SUCCESS CTR chk', character.playState.deathSaves.successes >= 2);
  setCheckSafe(form, 'SUCCESS RIGHT chk', character.playState.deathSaves.successes >= 3);
  setCheckSafe(form, 'FAILURE LEFT chk', character.playState.deathSaves.failures >= 1);
  setCheckSafe(form, 'FAILURE CTR chk', character.playState.deathSaves.failures >= 2);
  setCheckSafe(form, 'FAILURE RIGHT chk', character.playState.deathSaves.failures >= 3);

  // Proficiency, Initiative, Speed, Size, Passive Perception, Heroic Inspiration
  setTextSafe(form, 'PROF BONUS', `+${computed.proficiencyBonus}`);
  setTextSafe(form, 'init', formatSigned(computed.initiative));
  setTextSafe(form, 'SPEED', `${computed.speeds.walk} ft.`);
  setTextSafe(form, 'SIZE', character.description.size || 'Medium');
  setTextSafe(form, 'PASSIVE PERCEPTION', String(computed.passivePerception));
  setCheckSafe(form, 'Check Box1', Boolean(character.playState.heroicInspiration));

  // Ability Scores & Modifiers
  for (const ab of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
    const info = computed.abilityScores[ab];
    const upper = ab.toUpperCase();
    setTextSafe(form, `${upper} SCORE`, String(info.total));
    setTextSafe(form, `${upper} MOD`, formatSigned(info.modifier));
  }

  // Saving Throws
  for (const sv of SAVE_TO_PDF) {
    const data = computed.savingThrows[sv.key];
    setTextSafe(form, sv.textField, formatSigned(data.bonus));
    setCheckSafe(form, sv.checkField, data.proficient);
  }

  // Skills
  for (const sk of computed.skills) {
    const target = SKILL_TO_PDF[sk.name];
    if (!target) continue;
    setTextSafe(form, target.textField, formatSigned(sk.bonus));
    setCheckSafe(form, target.checkField, sk.proficiency >= 1);
  }

  // Armor Training Checkboxes & Weapon/Tool Proficiencies
  const armorLower = computed.armorProficiencies.map((a) => a.toLowerCase());
  const hasAllArmor = armorLower.includes('all');
  setCheckSafe(form, 'Check Box33', hasAllArmor || armorLower.some((a) => a.includes('light')));
  setCheckSafe(form, 'Check Box34', hasAllArmor || armorLower.some((a) => a.includes('medium')));
  setCheckSafe(form, 'Check Box35', hasAllArmor || armorLower.some((a) => a.includes('heavy')));
  setCheckSafe(form, 'Check Box36', armorLower.some((a) => a.includes('shield')));

  setTextSafe(form, 'WEAPON PROF', computed.weaponProficiencies.join(', ') || 'None');
  setTextSafe(form, 'TOOL PROF', computed.toolProficiencies.join(', ') || 'None');

  // Weapons / Damage Cantrips (Rows 1..6)
  for (let i = 0; i < 6; i++) {
    const idx = i + 1;
    const atk = computed.attacks[i];
    if (!atk) {
      setTextSafe(form, `NAME - WEAPON ${idx}`, '');
      setTextSafe(form, `BONUS/DC - WEAPON ${idx}`, '');
      setTextSafe(form, `DAMAGE/TYPE - WEAPON ${idx}`, '');
      setTextSafe(form, `NOTES - WEAPON ${idx}`, '');
      continue;
    }
    const bonusOrDc =
      atk.toHit !== null ? formatSigned(atk.toHit) : atk.saveDc ? `DC ${atk.saveDc}` : '';
    const dmg =
      atk.damageDice && atk.damageDice !== '—'
        ? `${atk.damageDice}${atk.damageBonus !== 0 ? formatSigned(atk.damageBonus) : ''} ${atk.damageType}`.trim()
        : '';
    const notes = [
      atk.range,
      ...atk.properties,
      ...(atk.mastery || []).map((m) => `Mastery: ${m}`),
    ]
      .filter(Boolean)
      .join(', ');

    setTextSafe(form, `NAME - WEAPON ${idx}`, atk.name);
    setTextSafe(form, `BONUS/DC - WEAPON ${idx}`, bonusOrDc);
    setTextSafe(form, `DAMAGE/TYPE - WEAPON ${idx}`, dmg);
    setTextSafe(form, `NOTES - WEAPON ${idx}`, notes);
  }

  // Class Features (split across CLASS FEATURES 1 & 2)
  const classFeatures = computed.features.filter(
    (f) => f.category === 'class' || f.category === 'subclass' || f.category === 'optional',
  );
  const splitMid = Math.ceil(classFeatures.length / 2);
  setTextSafe(form, 'CLASS FEATURES 1', formatFeatureLines(classFeatures.slice(0, splitMid), 2));
  setTextSafe(form, 'CLASS FEATURES 2', formatFeatureLines(classFeatures.slice(splitMid), 2));

  // Species Traits
  const speciesFeatures = computed.features.filter((f) => f.category === 'species');
  const sensesPrefix =
    computed.senses.length > 0
      ? `Senses: ${computed.senses.map((s) => `${s.name}${s.range ? ` ${s.range} ft.` : ''}`).join(', ')}\n\n`
      : '';
  setTextSafe(form, 'SPECIES TRAITS', sensesPrefix + formatFeatureLines(speciesFeatures, 2));

  // Feats & Background Features
  const featEntries = computed.features.filter(
    (f) => f.category === 'feat' || f.category === 'background',
  );
  setTextSafe(form, 'FEATS', formatFeatureLines(featEntries, 2));

  // Page 2: Spellcasting Header & Spell Slots
  const primaryGroup = computed.spellGroups.find((g) => g.classId !== 'innate-origin') || computed.spellGroups[0];
  if (primaryGroup) {
    const abMod = getAbilityModifier(computed.abilityScores[primaryGroup.ability].total);
    setTextSafe(form, 'SPELLCASTING ABILITY', ABILITY_LABELS[primaryGroup.ability].short);
    setTextSafe(form, 'SPELLCASTING MOD', formatSigned(abMod));
    setTextSafe(form, 'SPELL SAVE DC', String(primaryGroup.spellSaveDc));
    setTextSafe(form, 'SPELL ATTACK BONUS', formatSigned(primaryGroup.spellAttackBonus));
  }

  for (let lvl = 1; lvl <= 9; lvl++) {
    const spec = SPELL_SLOT_FIELDS[lvl];
    const standardTotal = computed.spellSlots[lvl] || 0;
    const pactAtLvl = computed.pactSlots && computed.pactSlots.level === lvl ? computed.pactSlots.count : 0;
    const total = standardTotal + pactAtLvl;
    const usedStandard = character.playState.spellSlotsUsed[lvl] || 0;
    const usedPact = pactAtLvl > 0 ? character.playState.pactSlotsUsed || 0 : 0;
    const usedTotal = usedStandard + usedPact;

    setTextSafe(form, spec.totalField, total > 0 ? String(total) : '');
    spec.checkboxes.forEach((cbName, idx) => {
      setCheckSafe(form, cbName, idx < usedTotal);
    });
  }

  // Page 2: 30-row Spell Table
  const collectedSpells = collectCharacterSpells(character, computed, compendium);
  SPELL_TABLE_ROWS.forEach((row, idx) => {
    const item = collectedSpells[idx];
    if (!item) {
      setTextSafe(form, row.levelField, '');
      setTextSafe(form, row.nameField, '');
      setTextSafe(form, row.timeField, '');
      setTextSafe(form, row.rangeField, '');
      setCheckSafe(form, row.concCheck, false);
      setCheckSafe(form, row.ritualCheck, false);
      setCheckSafe(form, row.materialCheck, false);
      setTextSafe(form, row.notesField, '');
      return;
    }

    const sp = item.spell;
    const isConc = Boolean(sp.duration?.some((d) => d.concentration));
    const isRitual = Boolean(sp.meta?.ritual);
    const hasMaterial = Boolean(sp.components?.m);

    setTextSafe(form, row.levelField, sp.level === 0 ? '0' : String(sp.level));
    setTextSafe(form, row.nameField, sp.name);
    setTextSafe(form, row.timeField, formatSpellCastingTime(sp));
    setTextSafe(form, row.rangeField, formatSpellRange(sp));
    setCheckSafe(form, row.concCheck, isConc);
    setCheckSafe(form, row.ritualCheck, isRitual);
    setCheckSafe(form, row.materialCheck, hasMaterial);
    setTextSafe(form, row.notesField, item.note);
  });

  // Page 2: Appearance, Personality, Alignment, Languages, Equipment, Attunement, Coins
  const physParts = [
    character.description.age ? `Age: ${character.description.age}` : '',
    character.description.height ? `Height: ${character.description.height}` : '',
    character.description.weight ? `Weight: ${character.description.weight}` : '',
    character.description.eyes ? `Eyes: ${character.description.eyes}` : '',
    character.description.hair ? `Hair: ${character.description.hair}` : '',
    character.description.skin ? `Skin: ${character.description.skin}` : '',
  ].filter(Boolean);
  const appearanceStr = [physParts.join(', '), character.description.appearance]
    .filter(Boolean)
    .join('\n');
  setTextSafe(form, 'APPEARANCE', appearanceStr);

  const personalitySections = [
    character.description.personalityTraits && `Traits: ${character.description.personalityTraits}`,
    character.description.ideals && `Ideals: ${character.description.ideals}`,
    character.description.bonds && `Bonds: ${character.description.bonds}`,
    character.description.flaws && `Flaws: ${character.description.flaws}`,
    character.description.faith && `Faith: ${character.description.faith}`,
    character.description.lifestyle && `Lifestyle: ${character.description.lifestyle}`,
    character.description.backstory && `Backstory: ${character.description.backstory}`,
    character.description.allies && `Allies: ${character.description.allies}`,
    character.description.notes && `Notes: ${character.description.notes}`,
  ].filter(Boolean);
  setTextSafe(form, 'BACKSTORY / PERSONALITY', personalitySections.join('\n'));

  setTextSafe(form, 'Alignment', character.description.alignment || '');
  setTextSafe(form, 'LANGUAGES', computed.languages.join(', '));

  const equipLines = character.inventory.map((inv) => {
    const qtyStr = (inv.quantity || 1) > 1 ? ` x${inv.quantity}` : '';
    const eqTag = inv.equipped ? ' (Equipped)' : '';
    return `${inv.name}${qtyStr}${eqTag}`;
  });
  if (character.otherPossessions?.trim()) {
    equipLines.push('', 'Other Possessions:', character.otherPossessions.trim());
  }
  setTextSafe(form, 'EQUIPMENT', equipLines.join('\n'));

  // Attuned / Attunable magic items (slots 1..3 + Check Box63 / Check Box62 / Check Box61)
  const attunableItems = character.inventory.filter((inv) => {
    if (inv.attuned) return true;
    const def = inv.isCustom ? undefined : findItem(compendium, inv.itemKey);
    return Boolean(def?.reqAttune);
  });
  const attuneSlots = [
    { textField: 'ATTUNMENT 1', checkField: 'Check Box63' },
    { textField: 'ATTUNMENT 2', checkField: 'Check Box62' },
    { textField: 'ATTUNMENT 3', checkField: 'Check Box61' },
  ];
  attuneSlots.forEach((slot, idx) => {
    const entry = attunableItems[idx];
    setTextSafe(form, slot.textField, entry ? entry.name : '');
    setCheckSafe(form, slot.checkField, Boolean(entry?.attuned));
  });

  // Currency
  setTextSafe(form, 'CP', String(character.currency.cp || 0));
  setTextSafe(form, 'SP', String(character.currency.sp || 0));
  setTextSafe(form, 'EP', String(character.currency.ep || 0));
  setTextSafe(form, 'GP', String(character.currency.gp || 0));
  setTextSafe(form, 'PP', String(character.currency.pp || 0));

  return pdfDoc.save();
}

export async function exportCharacterToPdf(
  character: Character,
  computed: ComputedCharacter,
  compendium: CompiledCompendium,
): Promise<void> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const pdfUrl = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}dnd-2024-character-sheet.pdf`;
  const res = await fetch(pdfUrl);
  if (!res.ok) {
    throw new Error(`Failed to load fillable character sheet template (${res.status}).`);
  }
  const templateBytes = await res.arrayBuffer();
  const filledBytes = await fillDnd2024PdfSheet(templateBytes, character, computed, compendium);

  const pdfBuffer = filledBytes.slice().buffer;
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (character.name || 'character').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  a.download = `${safeName}-2024-sheet.pdf`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
