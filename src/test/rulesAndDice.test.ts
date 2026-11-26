import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { roll4d6DropLowest, rollDiceExpression } from '../engine/dice';
import { parseFiveToolsText } from '../services/fiveToolsText';
import { fillDnd2024PdfSheet } from '../services/pdfSheetExporter';
import {
  calculatePointBuySpent,
  computeCharacter,
  createBlankCharacter,
  extractClassSkillConfig,
  extractClassToolConfig,
  extractFeatProficiencyConfig,
  formatSigned,
  getCharacterKnownProficiencies,
  getClassExpertiseTiers,
  getExistingProficienciesExcludingRaceChoices,
  getOptionalFeatureCantripConfig,
  groupBySourceCategory,
  isOptionalFeatureEligible,
  isOptionalFeatureRepeatable,
  isSpellEligibleForCantripConfig,
  resolveBackgroundProficiencyState,
  shouldHideSpeciesAsi,
} from '../engine/rules';
import {
  getItemTypeCategories,
  isItemContainer,
  isItemMagical,
  isItemProficient,
  parseClassStartingEquipment,
  parseStartingEquipmentBlocks,
  resolveStartingEquipmentAdditions,
} from '../services/equipmentHelpers';
import type { CompiledCompendium } from '../types/5etools';

function createMockCompendium(): CompiledCompendium {
  return {
    meta: {
      sourceUrl: 'https://example.com/data',
      importedAt: '2026-01-01T00:00:00Z',
      version: 1,
      counts: {
        books: 2,
        classes: 3,
        subclasses: 1,
        races: 1,
        backgrounds: 1,
        feats: 2,
        spells: 3,
        items: 3,
        optionalFeatures: 2,
        conditions: 1,
        actions: 1,
        skills: 1,
        languages: 1,
      },
    },
    books: [
      { name: "Player's Handbook (2024)", id: 'XPHB', source: 'XPHB', group: 'core' },
      { name: "Player's Handbook (2014)", id: 'PHB', source: 'PHB', group: 'core' },
    ],
    classes: [
      {
        name: 'Fighter',
        source: 'XPHB',
        edition: 'one',
        hd: { number: 1, faces: 10 },
        proficiency: ['str', 'con'],
        startingProficiencies: {
          skills: [{ choose: { from: ['athletics', 'perception'], count: 2 } }],
          weapons: ['simple', 'martial'],
          armor: ['light', 'medium', 'heavy', 'shield'],
        },
        classFeatures: [
          'Fighting Style|Fighter|XPHB|1',
          'Second Wind|Fighter|XPHB|1',
          'Action Surge|Fighter|XPHB|2',
          { classFeature: 'Fighter Subclass|Fighter|XPHB|3', gainSubclassFeature: true },
          'Ability Score Improvement|Fighter|XPHB|4',
          'Extra Attack|Fighter|XPHB|5',
        ],
      },
      {
        name: 'Wizard',
        source: 'XPHB',
        edition: 'one',
        hd: { number: 1, faces: 6 },
        proficiency: ['int', 'wis'],
        spellcastingAbility: 'int',
        casterProgression: 'full',
        cantripProgression: [3, 3, 3, 4, 4],
        preparedSpellsProgression: [4, 5, 6, 7, 9],
        classFeatures: ['Spellcasting|Wizard|XPHB|1'],
      },
      {
        name: 'Warlock',
        source: 'XPHB',
        edition: 'one',
        hd: { number: 1, faces: 8 },
        proficiency: ['wis', 'cha'],
        spellcastingAbility: 'cha',
        casterProgression: 'pact',
        cantripProgression: [2, 2, 2, 3, 3],
        preparedSpellsProgression: [2, 3, 4, 5, 6],
        classFeatures: ['Eldritch Invocations|Warlock|XPHB|1'],
      },
    ],
    subclasses: [
      {
        name: 'Champion',
        shortName: 'Champion',
        source: 'XPHB',
        className: 'Fighter',
        classSource: 'XPHB',
        subclassFeatures: ['Improved Critical|Fighter|XPHB|Champion|XPHB|3'],
      },
    ],
    classFeatures: [
      {
        name: 'Second Wind',
        source: 'XPHB',
        className: 'Fighter',
        classSource: 'XPHB',
        level: 1,
        entries: ['Regain {@dice 1d10} HP.'],
      },
      {
        name: 'Action Surge',
        source: 'XPHB',
        className: 'Fighter',
        classSource: 'XPHB',
        level: 2,
        entries: ['Take one additional action.'],
      },
    ],
    subclassFeatures: [
      {
        name: 'Improved Critical',
        source: 'XPHB',
        className: 'Fighter',
        classSource: 'XPHB',
        subclassShortName: 'Champion',
        subclassSource: 'XPHB',
        level: 3,
        entries: ['Critical hit on 19 or 20.'],
      },
    ],
    races: [
      {
        name: 'Dwarf',
        source: 'XPHB',
        edition: 'one',
        size: ['M'],
        speed: 30,
        darkvision: 120,
        resist: ['poison'],
        entries: [{ type: 'entries', name: 'Dwarven Toughness', entries: ['+1 HP per level'] }],
      },
    ],
    backgrounds: [
      {
        name: 'Soldier',
        source: 'XPHB',
        edition: 'one',
        skillProficiencies: [{ athletics: true, intimidation: true }],
        feats: [{ 'savage attacker|xphb': true }],
      },
    ],
    feats: [
      {
        name: 'Tough',
        source: 'XPHB',
        category: 'O',
        entries: ['Your HP maximum increases by 2 per level.'],
      },
      {
        name: 'Alert',
        source: 'XPHB',
        category: 'O',
        entries: ['Add Proficiency Bonus to Initiative.'],
      },
    ],
    spells: [
      {
        name: 'Fire Bolt',
        source: 'XPHB',
        level: 0,
        school: 'V',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 120 } },
        components: { v: true, s: true },
        duration: [{ type: 'instant' }],
        entries: ['Hurl a mote of fire for {@damage 1d10} fire damage.'],
        spellAttack: ['ranged'],
        damageInflict: ['fire'],
        scalingLevelDice: { scaling: { '1': '1d10', '5': '2d10' } },
        classes: [{ name: 'Wizard', source: 'XPHB' }],
      },
      {
        name: 'Eldritch Blast',
        source: 'XPHB',
        level: 0,
        school: 'V',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 120 } },
        components: { v: true, s: true },
        duration: [{ type: 'instant' }],
        entries: ['A beam of crackling energy deals {@damage 1d10} force damage.'],
        spellAttack: ['ranged'],
        damageInflict: ['force'],
        classes: [{ name: 'Warlock', source: 'XPHB' }],
      },
      {
        name: 'Magic Missile',
        source: 'XPHB',
        level: 1,
        school: 'V',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 120 } },
        components: { v: true, s: true },
        duration: [{ type: 'instant' }],
        entries: ['Three darts deal {@damage 1d4 + 1} force damage each.'],
        classes: [{ name: 'Wizard', source: 'XPHB' }],
      },
    ],
    items: [
      {
        name: 'Chain Mail',
        source: 'XPHB',
        type: 'HA|XPHB',
        armor: true,
        ac: 16,
        weight: 55,
      },
      {
        name: 'Shield',
        source: 'XPHB',
        type: 'S|XPHB',
        shield: true,
        ac: 2,
        weight: 6,
      },
      {
        name: 'Longsword',
        source: 'XPHB',
        type: 'M|XPHB',
        weapon: true,
        weaponCategory: 'martial',
        dmg1: '1d8',
        dmgType: 'S',
        property: ['V|XPHB'],
        mastery: ['Sap|XPHB'],
        weight: 3,
      },
    ],
    optionalFeatures: [
      {
        name: 'Defense',
        source: 'XPHB',
        featureType: ['FS:F'],
        entries: ['+1 AC while wearing armor.'],
      },
      {
        name: 'Agonizing Blast',
        source: 'XPHB',
        featureType: ['EI'],
        entries: ['Add CHA modifier to cantrip damage.'],
      },
    ],
    charCreationOptions: [],
    skills: [{ name: 'Athletics', source: 'XPHB', ability: 'str', entries: ['Climbing and jumping.'] }],
    languages: [{ name: 'Common', source: 'XPHB' }],
    senses: [{ name: 'Darkvision', source: 'XPHB', entries: ['See in darkness.'] }],
    conditions: [{ name: 'Poisoned', source: 'XPHB', entries: ['Disadvantage on attacks and checks.'] }],
    actions: [{ name: 'Attack', source: 'XPHB', entries: ['Make an attack roll.'] }],
    variantRules: [],
    itemMasteries: [],
    itemProperties: [],
    itemTypes: [],
  };
}

describe('Dice engine & 5etools tag parser', () => {
  it('evaluates dice expressions within valid bounds', () => {
    const rec = rollDiceExpression('2d6+4', { label: 'Greatsword' });
    expect(rec.terms[0].rolls).toHaveLength(2);
    expect(rec.modifier).toBe(4);
    expect(rec.total).toBeGreaterThanOrEqual(6);
    expect(rec.total).toBeLessThanOrEqual(16);
  });

  it('drops lowest on 4d6dl1', () => {
    const res = roll4d6DropLowest();
    expect(res.rolls).toHaveLength(4);
    expect(res.kept).toHaveLength(3);
    expect(res.total).toBe(res.kept.reduce((a, b) => a + b, 0));
    expect(res.dropped).toBe(Math.min(...res.rolls));
  });

  it('parses dice, dc, hit, and spell tags cleanly', () => {
    const segs = parseFiveToolsText('Make a {@dc 15} save or take {@damage 8d6} fire from {@spell fireball|phb}.');
    expect(segs.some((s) => s.type === 'dc' && s.text === 'DC 15')).toBe(true);
    expect(segs.some((s) => s.type === 'dice' && s.diceExpr === '8d6')).toBe(true);
    expect(segs.some((s) => s.type === 'ref' && s.refKind === 'spell' && s.refName === 'fireball')).toBe(true);
  });

  it('computes authentic 5e point buy costs', () => {
    expect(calculatePointBuySpent({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 })).toBe(27);
  });
});

describe('Character Rules & Math Engine', () => {
  it('computes AC, HP, Weapon Attack, and Limited Uses for Level 5 Dwarf Fighter', () => {
    const comp = createMockCompendium();
    const char = createBlankCharacter('2024');
    char.name = 'Torin Ironbeard';
    char.race.raceKey = 'Dwarf|XPHB';
    char.background.backgroundKey = 'Soldier|XPHB';
    char.background.abilityBonuses = { str: 2, con: 1 };
    char.background.originFeatKey = 'Tough|XPHB';
    char.abilities.base = { str: 15, dex: 12, con: 14, int: 8, wis: 13, cha: 10 };
    char.classes = [
      {
        id: 'cls-1',
        className: 'Fighter',
        classSource: 'XPHB',
        level: 5,
        isPrimary: true,
        subclassName: 'Champion',
        subclassSource: 'XPHB',
        hpRolls: { 1: 10 },
        chosenSkills: ['Perception', 'Intimidation'],
        expertiseSkills: [],
        chosenOptionalFeatures: { 'cf-Fighting Style-1': ['Defense|XPHB'] },
        chosenWeaponMasteries: [],
        asiChoices: { 4: { mode: 'asi', abilities: { str: 1, con: 1 } } },
        preparedSpells: [],
        knownSpells: [],
        cantrips: [],
        spellbookSpells: [],
      },
    ];
    char.inventory = [
      { instanceId: 'i1', itemKey: 'Chain Mail|XPHB', name: 'Chain Mail', source: 'XPHB', quantity: 1, equipped: true, attuned: false },
      { instanceId: 'i2', itemKey: 'Shield|XPHB', name: 'Shield', source: 'XPHB', quantity: 1, equipped: true, attuned: false },
      { instanceId: 'i3', itemKey: 'Longsword|XPHB', name: 'Longsword', source: 'XPHB', quantity: 1, equipped: true, attuned: false },
    ];

    const computed = computeCharacter(char, comp);
    expect(computed.totalLevel).toBe(5);
    expect(computed.proficiencyBonus).toBe(3);
    // STR: 15 + 2 (bg) + 1 (ASI) = 18 (+4), CON: 14 + 1 (bg) + 1 (ASI) = 16 (+3)
    expect(computed.abilityScores.str.total).toBe(18);
    expect(computed.abilityScores.str.modifier).toBe(4);
    expect(computed.abilityScores.con.total).toBe(16);
    expect(computed.abilityScores.con.modifier).toBe(3);

    // AC: 16 (Chain Mail) + 2 (Shield) + 1 (Defense) = 19
    expect(computed.ac.value).toBe(19);

    // Max HP: (10 + 4*6) = 34 base + 5*3 (CON) = 49 + 5*2 (Tough) + 5*1 (Dwarven Toughness) = 64
    expect(computed.maxHp).toBe(64);

    // Longsword attack: +4 STR + 3 PB = +7, 1d8 + 4
    const sword = computed.attacks.find((a) => a.name === 'Longsword')!;
    expect(sword.toHit).toBe(7);
    expect(sword.damageBonus).toBe(4);
    expect(sword.mastery).toEqual(['Sap']);

    // Second Wind at level 5 -> 3 uses (short rest)
    const sw = computed.features.find((f) => f.name === 'Second Wind')!;
    expect(sw.limitedUse).toEqual({ max: 3, resetOn: 'short' });
  });

  it('computes Wizard spellcasting & Warlock Pact Magic with Agonizing Blast', () => {
    const comp = createMockCompendium();
    const char = createBlankCharacter('2024');
    char.abilities.base = { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 16 };
    char.classes = [
      {
        id: 'w1',
        className: 'Wizard',
        classSource: 'XPHB',
        level: 5,
        isPrimary: true,
        hpRolls: { 1: 6 },
        chosenSkills: [],
        expertiseSkills: [],
        chosenOptionalFeatures: {},
        chosenWeaponMasteries: [],
        asiChoices: {},
        preparedSpells: ['Magic Missile|XPHB'],
        knownSpells: [],
        cantrips: ['Fire Bolt|XPHB'],
        spellbookSpells: [],
      },
      {
        id: 'wl1',
        className: 'Warlock',
        classSource: 'XPHB',
        level: 2,
        isPrimary: false,
        hpRolls: {},
        chosenSkills: [],
        expertiseSkills: [],
        chosenOptionalFeatures: { 'prog-Eldritch Invocations': ['Agonizing Blast|XPHB'] },
        chosenWeaponMasteries: [],
        asiChoices: {},
        preparedSpells: [],
        knownSpells: [],
        cantrips: ['Eldritch Blast|XPHB'],
        spellbookSpells: [],
      },
    ];

    const computed = computeCharacter(char, comp);
    expect(computed.totalLevel).toBe(7);
    expect(computed.proficiencyBonus).toBe(3);
    // Level 5 Wizard slots: 4 / 3 / 2
    expect(computed.spellSlots[1]).toBe(4);
    expect(computed.spellSlots[2]).toBe(3);
    expect(computed.spellSlots[3]).toBe(2);
    // Level 2 Warlock pact slots: 2x Level 1
    expect(computed.pactSlots).toEqual({ count: 2, level: 1 });

    // Fire Bolt & Eldritch Blast included; level 1+ spell Magic Missile omitted from Attacks & Cantrips
    const fb = computed.attacks.find((a) => a.name === 'Fire Bolt')!;
    expect(fb.damageDice).toBe('2d10');
    expect(fb.toHit).toBe(6); // +3 PB + 3 INT
    expect(computed.attacks.find((a) => a.name === 'Magic Missile')).toBeUndefined();

    // Eldritch Blast with Agonizing Blast -> +3 CHA damage bonus
    const eb = computed.attacks.find((a) => a.name === 'Eldritch Blast')!;
    expect(eb.damageBonus).toBe(3);
  });

  it('separates sources cleanly into 5.5e Core, 5.5e Supplements, 5e Core, and 5e Supplements', () => {
    const books = [
      { name: "Player's Handbook (2024)", id: 'XPHB', source: 'XPHB', group: 'core', published: '2024-09-17' },
      { name: "Forgotten Realms: Heroes of Faerûn", id: 'FRHoF', source: 'FRHoF', group: 'setting', published: '2025-11-11' },
      { name: 'Lorwyn: First Light', id: 'LFL', source: 'LFL', group: 'setting-alt', published: '2025-11-18' },
      { name: "Player's Handbook (2014)", id: 'PHB', source: 'PHB', group: 'core', published: '2014-08-19' },
      { name: "Mordenkainen Presents: Monsters of the Multiverse", id: 'MPMM', source: 'MPMM', group: 'supplement', published: '2022-01-25' },
    ];
    const items = [
      { name: 'Human', source: 'XPHB', edition: 'one' as const },
      { name: 'Rimeborn', source: 'FRHoF', edition: 'one' as const },
      { name: 'Boggart', source: 'LFL' },
      { name: 'Half-Elf', source: 'PHB' },
      { name: 'Kobold', source: 'MPMM' },
    ];

    const grouped = groupBySourceCategory(items, books);
    expect(grouped.map((g) => g.label)).toEqual([
      '5.5e Core',
      '5.5e Supplements',
      '5e Core',
      '5e Supplements',
    ]);
    expect(grouped[0].items.map((i) => i.name)).toEqual(['Human']);
    expect(grouped[1].items.map((i) => i.name)).toEqual(['Rimeborn', 'Boggart']);
    expect(grouped[2].items.map((i) => i.name)).toEqual(['Half-Elf']);
    expect(grouped[3].items.map((i) => i.name)).toEqual(['Kobold']);
  });

  it('applies species origin feat and hides species ASI when 2024 background ASI is active', () => {
    const comp = createMockCompendium();
    comp.races.push({
      name: 'Human',
      source: 'XPHB',
      edition: 'one',
      size: ['S', 'M'],
      speed: 30,
      ability: [{ str: 2 }],
      skillProficiencies: [{ any: 1 }],
      feats: [{ anyFromCategory: { category: ['O'], count: 1 } }],
      entries: [],
    });
    const char = createBlankCharacter('all');
    char.background.backgroundKey = 'Soldier|XPHB';
    char.background.abilityMode = 'weighted_2_1';
    char.background.abilityBonuses = { cha: 2, con: 1 };
    char.abilities.base = { str: 10, dex: 12, con: 14, int: 10, wis: 10, cha: 14 };
    char.race.raceKey = 'Human|XPHB';
    char.race.abilityMode = 'fixed';
    char.race.chosenSkills = ['Perception'];
    char.race.originFeatKey = 'Tough|XPHB';

    expect(shouldHideSpeciesAsi(char, comp.races.find((r) => r.name === 'Human'), comp.backgrounds[0])).toBe(true);
    const computed = computeCharacter(char, comp);
    expect(computed.abilityScores.str.speciesBonus).toBe(0);
    expect(computed.abilityScores.cha.backgroundBonus).toBe(2);
    expect(computed.skills.find((s) => s.name === 'Perception')?.proficiency).toBe(1);
    // Level 1 default base 8 + CON 2 (14+1=15 -> +2 mod) + Tough (+2) = 12 HP
    expect(computed.maxHp).toBe(12);
  });

  it('extracts Bard L1 choices and converts overlapped Background skills/tools into free replacements', () => {
    const comp = createMockCompendium();
    comp.classes.push({
      name: 'Bard',
      source: 'XPHB',
      edition: 'one',
      hd: { number: 1, faces: 8 },
      proficiency: ['dex', 'cha'],
      startingProficiencies: {
        skills: [{ any: 3 }],
        toolProficiencies: [{ anyMusicalInstrument: 3 }],
      },
      classFeatures: ['Bardic Inspiration|Bard|XPHB|1'],
    });
    comp.backgrounds.push({
      name: 'Wayfarer',
      source: 'XPHB',
      edition: 'one',
      skillProficiencies: [{ insight: true, stealth: true }],
      toolProficiencies: [{ "thieves' tools": true }],
      entries: [],
    });

    const bard = comp.classes.find((c) => c.name === 'Bard')!;
    const bardSkills = extractClassSkillConfig(bard, true);
    const bardTools = extractClassToolConfig(bard, true);
    expect(bardSkills.choiceCount).toBe(3);
    expect(bardSkills.choicePool.length).toBe(18);
    expect(bardTools.choiceCount).toBe(3);
    expect(bardTools.choicePool).toContain('Lute');

    const char = createBlankCharacter('2024');
    char.background.backgroundKey = 'Wayfarer|XPHB';
    char.background.chosenSkills = ['Acrobatics'];
    char.background.chosenTools = ['Herbalism Kit'];
    char.classes = [
      {
        id: 'b1',
        className: 'Bard',
        classSource: 'XPHB',
        level: 1,
        isPrimary: true,
        hpRolls: { 1: 8 },
        chosenSkills: ['Stealth', 'Performance', 'Persuasion'],
        chosenTools: ["Thieves' Tools", 'Lute', 'Flute'],
        expertiseSkills: [],
        chosenOptionalFeatures: {},
        chosenWeaponMasteries: [],
        asiChoices: {},
        preparedSpells: [],
        knownSpells: [],
        cantrips: [],
        spellbookSpells: [],
      },
    ];

    const overlapState = resolveBackgroundProficiencyState(char, comp);
    expect(overlapState.overlappedSkills).toEqual(['Stealth']);
    expect(overlapState.overlappedTools).toEqual(["Thieves' Tools"]);
    expect(overlapState.skillSlots[0]?.kind).toBe('replacement');
    expect(overlapState.toolSlots[0]?.kind).toBe('replacement');

    const computed = computeCharacter(char, comp);
    expect(computed.skills.find((s) => s.name === 'Insight')?.proficiency).toBe(1);
    expect(computed.skills.find((s) => s.name === 'Stealth')?.proficiency).toBe(1);
    expect(computed.skills.find((s) => s.name === 'Acrobatics')?.proficiency).toBe(1);
    expect(computed.toolProficiencies).toContain("Thieves' Tools");
    expect(computed.toolProficiencies).toContain('Herbalism Kit');
    expect(computed.toolProficiencies).toContain('Lute');

    // Species existing-proficiency exclusion set includes Bard + Wayfarer proficiencies & Common, ignoring race.chosen*
    char.race.chosenSkills = ['Survival'];
    const existing = getExistingProficienciesExcludingRaceChoices(char, comp);
    expect(existing.skills.has('insight')).toBe(true);
    expect(existing.skills.has('stealth')).toBe(true);
    expect(existing.skills.has('acrobatics')).toBe(true);
    expect(existing.skills.has('performance')).toBe(true);
    expect(existing.skills.has('survival')).toBe(false);
    expect(existing.tools.has("thieves' tools")).toBe(true);
    expect(existing.tools.has('lute')).toBe(true);
    expect(existing.tools.has('herbalism kit')).toBe(true);
    expect(existing.languages.has('common')).toBe(true);

    // Feat proficiency extraction (Musician, Crafter, Linguist) & exclusion filtering
    comp.feats.push(
      {
        name: 'Musician',
        source: 'XPHB',
        category: 'O',
        toolProficiencies: [{ anyMusicalInstrument: 3 }],
        entries: ['Instrument training.'],
      },
      {
        name: 'Crafter',
        source: 'XPHB',
        category: 'O',
        toolProficiencies: [{ choose: { from: ["carpenter's tools", "smith's tools", "tinker's tools"], count: 3 } }],
        entries: ['Tool proficiency.'],
      },
      {
        name: 'Linguist',
        source: 'PHB',
        languageProficiencies: [{ any: 3 }],
        entries: ['Learn languages.'],
      },
    );

    const musicianCfg = extractFeatProficiencyConfig(comp.feats.find((f) => f.name === 'Musician'), ['Common', 'Elvish']);
    expect(musicianCfg.toolCount).toBe(3);
    expect(musicianCfg.toolPool).toContain('Lute');
    expect(extractFeatProficiencyConfig(comp.feats.find((f) => f.name === 'Crafter')).toolCount).toBe(3);
    expect(extractFeatProficiencyConfig(comp.feats.find((f) => f.name === 'Linguist'), ['Common', 'Elvish', 'Dwarvish']).languageCount).toBe(3);

    char.race.originFeatKey = 'Musician|XPHB';
    char.race.originFeatChoices = { tools: ['Horn', 'Lyre', 'Bagpipes'] };
    const knownForMusician = getCharacterKnownProficiencies(char, comp, { excludeFeatSlot: 'species-feat' });
    expect(knownForMusician.tools.has('lute')).toBe(true);
    expect(knownForMusician.tools.has('horn')).toBe(false);

    const withMusician = computeCharacter(char, comp);
    expect(withMusician.toolProficiencies).toContain('Horn');
    expect(withMusician.toolProficiencies).toContain('Lyre');
    expect(withMusician.toolProficiencies).toContain('Bagpipes');

    // Dynamic species/class limited uses & action types (Astral Elf Starlight Step + Bardic Inspiration + Warlock option filtering)
    comp.races.push({
      name: 'Astral Elf',
      source: 'AAG',
      size: ['M'],
      speed: 30,
      entries: [
        {
          type: 'entries',
          name: 'Starlight Step',
          entries: [
            'As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.',
          ],
        },
      ],
    });
    comp.classFeatures.push(
      {
        name: 'Bardic Inspiration',
        source: 'XPHB',
        className: 'Bard',
        classSource: 'XPHB',
        level: 1,
        entries: ['As a Bonus Action, you can inspire another creature. Uses equal Cha mod.'],
      },
      {
        name: 'Eldritch Invocations',
        source: 'XPHB',
        className: 'Warlock',
        classSource: 'XPHB',
        level: 1,
        entries: ['You have unearthed Eldritch Invocations.'],
      },
      {
        name: 'Eldritch Invocation Options',
        source: 'XPHB',
        className: 'Warlock',
        classSource: 'XPHB',
        level: 1,
        entries: [{ type: 'options', count: 1, entries: [] }] as never,
      },
    );
    comp.optionalFeatures.push({
      name: 'Pact of the Blade',
      source: 'XPHB',
      featureType: ['EI'],
      entries: ['As a Bonus Action, you can conjure a pact weapon in your hand.'],
    });
    const warlockCls = comp.classes.find((c) => c.name === 'Warlock')!;
    warlockCls.classFeatures = [
      'Eldritch Invocations|Warlock|XPHB|1',
      'Eldritch Invocation Options|Warlock|XPHB|1',
    ];
    char.abilities.base.cha = 16; // +3 CHA
    char.race.raceKey = 'Astral Elf|AAG';
    char.classes.push({
      id: 'wlk1',
      className: 'Warlock',
      classSource: 'XPHB',
      level: 1,
      isPrimary: false,
      hpRolls: {},
      chosenSkills: [],
      expertiseSkills: [],
      chosenOptionalFeatures: { 'prog-Eldritch Invocations': ['Pact of the Blade|XPHB'] },
      chosenWeaponMasteries: [],
      asiChoices: {},
      preparedSpells: [],
      knownSpells: [],
      cantrips: [],
      spellbookSpells: [],
    });
    const richComputed = computeCharacter(char, comp);
    const starlight = richComputed.features.find((f) => f.name === 'Starlight Step');
    expect(starlight?.limitedUse).toEqual({ max: richComputed.proficiencyBonus, resetOn: 'long' });
    expect(starlight?.actionType).toBe('bonus');
    const bardInsp = richComputed.features.find((f) => f.name === 'Bardic Inspiration');
    expect(bardInsp?.limitedUse).toEqual({ max: 3, resetOn: 'long' });
    expect(bardInsp?.actionType).toBe('bonus');
    expect(richComputed.features.find((f) => f.name === 'Eldritch Invocation Options')).toBeUndefined();
    const pactBlade = richComputed.features.find((f) => f.name === 'Pact of the Blade');
    expect(pactBlade?.parentFeatureName).toBe('Eldritch Invocations');
    expect(pactBlade?.actionType).toBe('bonus');
  });

  it('parses class/background starting equipment, resolves packs/type choices on commit, and classifies Add Items filters', () => {
    const comp = createMockCompendium();
    comp.items.push(
      { name: 'Leather Armor', source: 'XPHB', edition: 'one', type: 'LA|XPHB', armor: true, ac: 11, weight: 10 },
      { name: 'Dagger', source: 'XPHB', edition: 'one', type: 'M|XPHB', weapon: true, weaponCategory: 'simple', dmg1: '1d4', dmgType: 'P', weight: 1 },
      { name: 'Flute', source: 'XPHB', edition: 'one', type: 'INS|XPHB', weight: 1 },
      { name: 'Lute', source: 'XPHB', edition: 'one', type: 'INS|XPHB', weight: 2 },
      { name: 'Backpack', source: 'XPHB', edition: 'one', type: 'G|XPHB', weight: 5, containerCapacity: { weight: [30] } },
      { name: 'Bedroll', source: 'XPHB', edition: 'one', type: 'G|XPHB', weight: 7 },
      {
        name: "Entertainer's Pack",
        source: 'XPHB',
        edition: 'one',
        type: 'G|XPHB',
        packContents: ['backpack|xphb', { item: 'bedroll|xphb', quantity: 1 }],
      },
      { name: 'Potion of Healing', source: 'XPHB', edition: 'one', type: 'P|XPHB', rarity: 'common', weight: 0.5 },
    );

    const bardGroups = parseClassStartingEquipment(
      {
        defaultData: [
          {
            A: [
              'leather armor|xphb',
              { item: 'dagger|xphb', quantity: 2 },
              { equipmentType: 'instrumentMusical' },
              "entertainer's pack|xphb",
              { value: 1900 },
            ],
            B: [{ value: 9000 }],
          },
        ],
      },
      comp,
    );
    expect(bardGroups).toHaveLength(1);
    expect(bardGroups[0].options.map((o) => o.key)).toEqual(['A', 'B']);
    expect(bardGroups[0].options[0].label).toContain('Leather Armor, 2 Daggers');
    expect(bardGroups[0].options[0].label).toContain('Musical Instrument of your choice');
    expect(bardGroups[0].options[0].label).toContain('19 GP');

    const bgGroups = parseStartingEquipmentBlocks(
      [{ A: [{ value: 800 }], B: [{ value: 5000 }] }],
      'bg',
      comp,
    );

    const resolved = resolveStartingEquipmentAdditions(
      [
        { groupId: 'class:0', option: bardGroups[0].options[0] },
        { groupId: 'bg:0', option: bgGroups[0].options[1] },
      ],
      { 'class:0:A:2:0': 'Lute|XPHB' },
      comp,
      ['XPHB'],
      '2024',
    );
    expect(resolved.currencyDelta.gp).toBe(69);
    expect(resolved.inventoryAdditions.map((i) => `${i.name}x${i.quantity}`)).toEqual([
      'Leather Armorx1',
      'Daggerx2',
      'Lutex1',
      'Backpackx1',
      'Bedrollx1',
    ]);

    const char = createBlankCharacter('2024');
    char.classes = [
      {
        id: 'f1',
        className: 'Fighter',
        classSource: 'XPHB',
        level: 1,
        isPrimary: true,
        hpRolls: { 1: 10 },
        chosenSkills: [],
        chosenTools: [],
        expertiseSkills: [],
        chosenOptionalFeatures: {},
        chosenWeaponMasteries: [],
        asiChoices: {},
        preparedSpells: [],
        knownSpells: [],
        cantrips: [],
        spellbookSpells: [],
      },
    ];
    const computed = computeCharacter(char, comp);
    const backpack = comp.items.find((i) => i.name === 'Backpack')!;
    const potion = comp.items.find((i) => i.name === 'Potion of Healing')!;
    const armor = comp.items.find((i) => i.name === 'Leather Armor')!;

    expect(isItemContainer(backpack)).toBe(true);
    expect(getItemTypeCategories(backpack)).toEqual(['OTHER GEAR']);
    expect(getItemTypeCategories(potion)).toEqual(['POTION']);
    expect(isItemMagical(potion)).toBe(true);
    expect(isItemProficient(armor, computed)).toBe(true);
  });

  it('fills DnD_2024_Character-Sheet template PDF accurately with character stats, spells, equipment, and proficiencies', async () => {
    const templatePath = path.resolve(process.cwd(), 'public/dnd-2024-character-sheet.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    const comp = createMockCompendium();
    comp.races.push({ name: 'Elf', source: 'XPHB', edition: 'one', size: ['M'], speed: 30, darkvision: 60, entries: [] });
    comp.backgrounds.push({ name: 'Acolyte', source: 'XPHB', edition: 'one', skillProficiencies: [{ insight: true, religion: true }], entries: [] });

    const char = createBlankCharacter('2024');
    char.name = 'Lyra Starweaver';
    char.race.raceKey = 'Elf|XPHB';
    char.race.lineageChoice = 'High Elf';
    char.background.backgroundKey = 'Acolyte|XPHB';
    char.background.chosenLanguages = ['Elvish', 'Sylvan'];
    char.playState.heroicInspiration = true;
    char.currency = { cp: 5, sp: 12, ep: 0, gp: 42, pp: 1 };
    char.inventory = [
      {
        instanceId: 'inv-sword',
        itemKey: 'Longsword|XPHB',
        name: 'Longsword',
        source: 'XPHB',
        quantity: 1,
        equipped: true,
        attuned: false,
      },
      {
        instanceId: 'inv-pack',
        itemKey: 'Backpack|XPHB',
        name: 'Backpack',
        source: 'XPHB',
        quantity: 1,
        equipped: false,
        attuned: false,
      },
    ];
    char.classes = [
      {
        id: 'w1',
        className: 'Wizard',
        classSource: 'XPHB',
        level: 2,
        isPrimary: true,
        hpRolls: { 1: 6, 2: 4 },
        chosenSkills: ['Arcana'],
        chosenTools: [],
        expertiseSkills: [],
        chosenOptionalFeatures: {},
        chosenWeaponMasteries: [],
        asiChoices: {},
        preparedSpells: ['Magic Missile|XPHB'],
        knownSpells: [],
        cantrips: ['Fire Bolt|XPHB'],
        spellbookSpells: [],
      },
    ];

    const computed = computeCharacter(char, comp);
    const filledBytes = await fillDnd2024PdfSheet(templateBytes, char, computed, comp);
    expect(filledBytes.byteLength).toBeGreaterThan(100000);

    const outDoc = await PDFDocument.load(filledBytes);
    const form = outDoc.getForm();

    expect(form.getTextField('Name').getText()).toBe('Lyra Starweaver');
    expect(form.getTextField('Species').getText()).toContain('Elf');
    expect(form.getTextField('Class').getText()).toBe('Wizard 2');
    expect(form.getTextField('Level').getText()).toBe('2');
    expect(form.getTextField('Background').getText()).toBe('Acolyte');
    expect(form.getTextField('PROF BONUS').getText()).toBe('+2');
    expect(form.getTextField('Max HP').getText()).toBe(String(computed.maxHp));
    expect(form.getTextField('Current HP').getText()).toBe(String(computed.effectiveCurrentHp));
    expect(form.getCheckBox('Check Box1').isChecked()).toBe(true); // Heroic Inspiration
    expect(form.getTextField('Text Field71').getText()).toBe(formatSigned(computed.savingThrows.wis.bonus)); // WIS Save
    expect(form.getCheckBox('Check Box17').isChecked()).toBe(true); // Wizard WIS save prof
    expect(form.getCheckBox('Check Box24').isChecked()).toBe(true); // Arcana prof
    expect(form.getTextField('SPELLCASTING ABILITY').getText()).toBe('INT');
    expect(form.getTextField('LVL1 TOTAL').getText()).toBe(String(computed.spellSlots[1]));
    expect(form.getTextField('SPELL NAME').getText()).toBe('Fire Bolt');
    expect(form.getTextField('SPELL NAME0').getText()).toBe('Magic Missile');
    expect(form.getTextField('GP').getText()).toBe('42');
    expect(form.getTextField('EQUIPMENT').getText()).toContain('Longsword (Equipped)');
    expect(form.getTextField('LANGUAGES').getText()).toContain('Elvish');
  }, 20000);

  it('supports Lessons of the First Ones origin feat, Agonizing/Eldritch Spear/Repelling targeted cantrip, and higher-level selectable class features', () => {
    const comp = createMockCompendium();
    comp.optionalFeatures = comp.optionalFeatures.filter((o) => o.name !== 'Agonizing Blast');
    comp.optionalFeatures.push(
      {
        name: 'Lessons of the First Ones',
        source: 'XPHB',
        edition: 'one',
        featureType: ['EI'],
        prerequisite: [{ level: { level: 2, class: { name: 'Warlock', source: 'XPHB' } } }],
        entries: [
          'Gain one Origin feat of your choice.',
          { type: 'entries', entries: [{ type: 'entries', name: 'Repeatable', entries: ['Choose a different Origin feat.'] }] },
        ],
      },
      {
        name: 'Agonizing Blast',
        source: 'XPHB',
        edition: 'one',
        featureType: ['EI'],
        prerequisite: [
          {
            level: { level: 2, class: { name: 'Warlock', source: 'XPHB' } },
            spell: [{ choose: 'level=0|class=Warlock', entry: 'a Warlock Cantrip That Deals Damage' }],
          },
        ],
        entries: ['Add Charisma modifier to chosen cantrip damage rolls.', { type: 'entries', name: 'Repeatable', entries: ['Repeat for another cantrip.'] }],
      },
      {
        name: 'Eldritch Spear',
        source: 'XPHB',
        edition: 'one',
        featureType: ['EI'],
        prerequisite: [{ level: { level: 2, class: { name: 'Warlock', source: 'XPHB' } }, spell: [{ choose: 'level=0|class=Warlock' }] }],
        entries: ['Increase range by 30 times Warlock level.'],
      },
      {
        name: 'Repelling Blast',
        source: 'XPHB',
        edition: 'one',
        featureType: ['EI'],
        prerequisite: [{ level: { level: 2, class: { name: 'Warlock', source: 'XPHB' } }, spell: [{ choose: 'level=0|class=Warlock|spell attack=m;r;o' }] }],
        entries: ['Push Large or smaller creature 10 ft.'],
      },
      {
        name: 'Thirsting Blade',
        source: 'XPHB',
        edition: 'one',
        featureType: ['EI'],
        prerequisite: [{ level: { level: 5, class: { name: 'Warlock', source: 'XPHB' } }, optionalfeature: ['pact of the blade|xphb'] }],
        entries: ['Attack twice with pact weapon.'],
      },
    );
    comp.spells.push(
      {
        name: 'Chill Touch',
        source: 'XPHB',
        level: 0,
        school: 'N',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'touch' } },
        components: { v: true, s: true },
        duration: [{ type: 'instant' }],
        damageInflict: ['necrotic'],
        spellAttack: ['M'],
        entries: ['Melee spell attack for {@damage 1d10} necrotic damage.'],
        classes: [{ name: 'Warlock', source: 'XPHB' }],
      },
      {
        name: 'Mage Hand',
        source: 'XPHB',
        level: 0,
        school: 'C',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 30 } },
        components: { v: true, s: true },
        duration: [{ type: 'timed', duration: { type: 'minute', amount: 1 } }],
        entries: ['Create a spectral hand.'],
        classes: [{ name: 'Warlock', source: 'XPHB' }],
      },
      {
        name: 'Mass Suggestion',
        source: 'XPHB',
        level: 6,
        school: 'E',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 60 } },
        components: { v: true, m: 'a snake tongue' },
        duration: [{ type: 'timed', duration: { type: 'hour', amount: 24 } }],
        entries: ['Suggest a course of activity.'],
        classes: [{ name: 'Warlock', source: 'XPHB' }],
      },
    );

    const warlockCls = comp.classes.find((c) => c.name === 'Warlock')!;
    const lessons = comp.optionalFeatures.find((o) => o.name === 'Lessons of the First Ones')!;
    const agonizing = comp.optionalFeatures.find((o) => o.name === 'Agonizing Blast')!;
    const spear = comp.optionalFeatures.find((o) => o.name === 'Eldritch Spear')!;
    const thirsting = comp.optionalFeatures.find((o) => o.name === 'Thirsting Blade')!;

    expect(isOptionalFeatureRepeatable(lessons)).toBe(true);
    expect(isOptionalFeatureRepeatable(agonizing)).toBe(true);
    expect(isOptionalFeatureRepeatable(thirsting)).toBe(false);
    expect(isOptionalFeatureEligible(thirsting, warlockCls, 5, ['XPHB'], '2024', [])).toBe(false);
    expect(isOptionalFeatureEligible(thirsting, warlockCls, 5, ['XPHB'], '2024', ['Pact of the Blade|XPHB'])).toBe(true);

    const chill = comp.spells.find((s) => s.name === 'Chill Touch')!;
    const eb = comp.spells.find((s) => s.name === 'Eldritch Blast')!;
    const mageHand = comp.spells.find((s) => s.name === 'Mage Hand')!;
    const agCfg = getOptionalFeatureCantripConfig(agonizing)!;
    const spearCfg = getOptionalFeatureCantripConfig(spear)!;
    expect(isSpellEligibleForCantripConfig(chill, agCfg.mode)).toBe(true);
    expect(isSpellEligibleForCantripConfig(mageHand, agCfg.mode)).toBe(false);
    expect(isSpellEligibleForCantripConfig(chill, spearCfg.mode)).toBe(false); // Touch range < 10 ft
    expect(isSpellEligibleForCantripConfig(eb, spearCfg.mode)).toBe(true);

    const char = createBlankCharacter('2024');
    char.abilities.base = { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 18 };
    char.classes = [
      {
        id: 'wl1',
        className: 'Warlock',
        classSource: 'XPHB',
        level: 11,
        isPrimary: true,
        hpRolls: { 1: 8 },
        chosenSkills: ['Arcana', 'Deception'],
        expertiseSkills: [],
        chosenOptionalFeatures: {
          'prog-Eldritch Invocations': [
            'Lessons of the First Ones|XPHB',
            'Agonizing Blast|XPHB',
            'Eldritch Spear|XPHB',
            'Repelling Blast|XPHB',
          ],
        },
        chosenOptionalFeatureSubChoices: {
          'prog-Eldritch Invocations:0': { featKey: 'Tough|XPHB', featChoices: {} },
          'prog-Eldritch Invocations:1': { cantripKey: 'Chill Touch|XPHB' },
          'prog-Eldritch Invocations:2': { cantripKey: 'Eldritch Blast|XPHB' },
          'prog-Eldritch Invocations:3': { cantripKey: 'Eldritch Blast|XPHB' },
        },
        chosenClassFeatureSpells: {
          'Mystic Arcanum-11': ['Mass Suggestion|XPHB'],
        },
        chosenWeaponMasteries: [],
        asiChoices: {},
        preparedSpells: [],
        knownSpells: [],
        cantrips: ['Chill Touch|XPHB', 'Eldritch Blast|XPHB', 'Mage Hand|XPHB'],
        spellbookSpells: [],
      },
    ];

    const computed = computeCharacter(char, comp);
    // Tough from Lessons of the First Ones -> +2 * 11 = +22 HP (Base: 8 + 10*5 + 11*2 (CON) = 80; +22 = 102)
    expect(computed.maxHp).toBe(102);
    expect(computed.features.some((f) => f.name === 'Tough' && f.category === 'feat')).toBe(true);

    // Agonizing Blast picked Chill Touch -> +4 CHA ONLY on Chill Touch, NOT on Eldritch Blast
    const ctAtk = computed.attacks.find((a) => a.name === 'Chill Touch')!;
    const ebAtk = computed.attacks.find((a) => a.name === 'Eldritch Blast')!;
    expect(ctAtk.damageBonus).toBe(4);
    expect(ebAtk.damageBonus).toBe(0);
    // Eldritch Spear (+30 * 11 = +330 ft -> 120 + 330 = 450 ft.) + Repelling Blast on Eldritch Blast
    expect(ebAtk.range).toBe('450 ft.');
    expect(ebAtk.properties).toContain('Push 10 ft.');

    // Mystic Arcanum L6 spell added to Warlock innate spells as 1/Long Rest
    const wlGroup = computed.spellGroups.find((g) => g.className === 'Warlock')!;
    expect(wlGroup.innateSpells.some((i) => i.spellKey === 'Mass Suggestion|XPHB' && i.uses === '1/Long Rest')).toBe(true);

    // Expertise tiers for Wizard Scholar, Ranger Deft Explorer, Rogue L1/L6, Bard L2/L9
    expect(getClassExpertiseTiers({ name: 'Wizard', edition: 'one' } as never, 2)).toEqual([
      {
        featureName: 'Scholar',
        unlockLevel: 2,
        count: 1,
        offset: 0,
        pool: ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Religion'],
      },
    ]);
    expect(getClassExpertiseTiers({ name: 'Ranger', edition: 'one' } as never, 9)).toEqual([
      { featureName: 'Deft Explorer', unlockLevel: 2, count: 1, offset: 0 },
      { featureName: 'Expertise', unlockLevel: 9, count: 2, offset: 1 },
    ]);
  });
});
