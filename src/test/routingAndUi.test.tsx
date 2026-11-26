import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../App';
import type { CompiledCompendium } from '../types/5etools';
import type { Character } from '../types/character';

let storedCompendium: CompiledCompendium | null = null;
let storedCharacters: Character[] = [];

vi.mock('../services/storage', () => ({
  loadCompendium: vi.fn(async () => storedCompendium),
  loadAllCharacters: vi.fn(async () => storedCharacters),
  saveCompendium: vi.fn(async (data: CompiledCompendium) => {
    storedCompendium = data;
  }),
  clearCompendium: vi.fn(async () => {
    storedCompendium = null;
  }),
  saveCharacter: vi.fn(async (char: Character) => {
    const idx = storedCharacters.findIndex((c) => c.id === char.id);
    if (idx === -1) storedCharacters = [char, ...storedCharacters];
    else storedCharacters = storedCharacters.map((c) => (c.id === char.id ? char : c));
  }),
  deleteCharacterById: vi.fn(async (id: string) => {
    storedCharacters = storedCharacters.filter((c) => c.id !== id);
  }),
  getSavedDataUrl: vi.fn(() => ''),
  setSavedDataUrl: vi.fn(),
}));

const MOCK_FILES: Record<string, unknown> = {
  'books.json': {
    book: [
      { name: "Player's Handbook (2024)", id: 'XPHB', source: 'XPHB', group: 'core', published: '2024-09-17' },
      { name: "Forgotten Realms: Heroes of Faerûn", id: 'FRHoF', source: 'FRHoF', group: 'setting', published: '2025-11-11' },
      { name: "Player's Handbook (2014)", id: 'PHB', source: 'PHB', group: 'core', published: '2014-08-19' },
      { name: "Xanathar's Guide to Everything", id: 'XGE', source: 'XGE', group: 'supplement', published: '2017-11-21' },
      { name: "Sword Coast Adventurer's Guide", id: 'SCAG', source: 'SCAG', group: 'setting', published: '2015-11-03' },
      { name: "Mordenkainen Presents: Monsters of the Multiverse", id: 'MPMM', source: 'MPMM', group: 'supplement', published: '2022-01-25' },
    ],
  },
  'class/index.json': { fighter: 'class-fighter.json', warlock: 'class-warlock.json', bard: 'class-bard.json', cleric: 'class-cleric.json' },
  'class/class-fighter.json': {
    class: [
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
        classFeatures: ['Second Wind|Fighter|XPHB|1', 'Action Surge|Fighter|XPHB|2'],
      },
    ],
    subclass: [],
    classFeature: [
      {
        name: 'Second Wind',
        source: 'XPHB',
        className: 'Fighter',
        classSource: 'XPHB',
        level: 1,
        entries: [
          'You have a limited well of physical and mental stamina that you can draw on to protect yourself from harm. On your turn, you can use a Bonus Action to regain {@dice 1d10} Hit Points plus your Fighter level. Once you use this feature, you must finish a Short or Long Rest before you can use it again, and you regain additional uses at higher levels.',
        ],
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
    subclassFeature: [],
  },
  'class/class-bard.json': {
    class: [
      {
        name: 'Bard',
        source: 'XPHB',
        edition: 'one',
        hd: { number: 1, faces: 8 },
        proficiency: ['dex', 'cha'],
        startingProficiencies: {
          skills: [{ any: 3 }],
          toolProficiencies: [{ anyMusicalInstrument: 3 }],
          weapons: ['simple'],
          armor: ['light'],
        },
        startingEquipment: {
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
        classFeatures: ['Bardic Inspiration|Bard|XPHB|1'],
      },
    ],
    subclass: [],
    classFeature: [
      {
        name: 'Bardic Inspiration',
        source: 'XPHB',
        className: 'Bard',
        classSource: 'XPHB',
        level: 1,
        entries: ['Inspire allies as a Bonus Action.'],
      },
    ],
    subclassFeature: [],
  },
  'class/class-cleric.json': {
    class: [
      {
        name: 'Cleric',
        source: 'XPHB',
        edition: 'one',
        hd: { number: 1, faces: 8 },
        proficiency: ['wis', 'cha'],
        startingProficiencies: {
          skills: [{ choose: { from: ['history', 'insight', 'medicine', 'persuasion', 'religion'], count: 2 } }],
          weapons: ['simple'],
          armor: ['light', 'medium', 'shield'],
        },
        classFeatures: ['Divine Order|Cleric|XPHB|1'],
      },
    ],
    subclass: [],
    classFeature: [
      {
        name: 'Divine Order',
        source: 'XPHB',
        className: 'Cleric',
        classSource: 'XPHB',
        level: 1,
        entries: [
          'You have dedicated yourself to one of the following sacred roles of your choice.',
          {
            type: 'entries',
            entries: [
              {
                type: 'options',
                count: 1,
                entries: [
                  { type: 'refClassFeature', classFeature: 'Protector|Cleric|XPHB|1|XPHB' },
                  { type: 'refClassFeature', classFeature: 'Thaumaturge|Cleric|XPHB|1|XPHB' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'Protector',
        source: 'XPHB',
        className: 'Cleric',
        classSource: 'XPHB',
        level: 1,
        entries: ['Trained for battle, you gain proficiency with Martial weapons and Heavy armor.'],
      },
      {
        name: 'Thaumaturge',
        source: 'XPHB',
        className: 'Cleric',
        classSource: 'XPHB',
        level: 1,
        entries: ['You know one extra cantrip from the Cleric spell list.'],
      },
    ],
    subclassFeature: [],
  },
  'class/class-warlock.json': {
    class: [
      {
        name: 'Warlock',
        source: 'XPHB',
        edition: 'one',
        hd: { number: 1, faces: 8 },
        proficiency: ['wis', 'cha'],
        spellcastingAbility: 'cha',
        casterProgression: 'pact',
        cantripProgression: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        preparedSpellsProgression: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
        startingProficiencies: {
          skills: [{ choose: { from: ['arcana', 'deception', 'history'], count: 2 } }],
          weapons: ['simple'],
          armor: ['light'],
        },
        optionalfeatureProgression: [
          {
            name: 'Eldritch Invocations',
            featureType: ['EI'],
            progression: [1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10],
          },
        ],
        classFeatures: [
          'Eldritch Invocations|Warlock|XPHB|1',
          'Pact Magic|Warlock|XPHB|1',
          'Eldritch Invocation Options|Warlock|XPHB|1',
          'Magical Cunning|Warlock|XPHB|2',
          'Mystic Arcanum|Warlock|XPHB|11',
        ],
      },
    ],
    subclass: [],
    classFeature: [
      {
        name: 'Eldritch Invocations',
        source: 'XPHB',
        className: 'Warlock',
        classSource: 'XPHB',
        level: 1,
        entries: ['You have unearthed Eldritch Invocations, pieces of forbidden knowledge.'],
      },
      {
        name: 'Pact Magic',
        source: 'XPHB',
        className: 'Warlock',
        classSource: 'XPHB',
        level: 1,
        entries: ['Through occult ceremony, you have made a pact.'],
      },
      {
        name: 'Eldritch Invocation Options',
        source: 'XPHB',
        className: 'Warlock',
        classSource: 'XPHB',
        level: 1,
        entries: [
          {
            type: 'options',
            count: 1,
            entries: [
              { type: 'refOptionalfeature', optionalfeature: 'Pact of the Tome|XPHB' },
              { type: 'refOptionalfeature', optionalfeature: 'Agonizing Blast|XPHB' },
            ],
          },
        ],
      },
      {
        name: 'Magical Cunning',
        source: 'XPHB',
        className: 'Warlock',
        classSource: 'XPHB',
        level: 2,
        entries: ['You can perform an esoteric rite to regain Pact Magic slots.'],
      },
      {
        name: 'Mystic Arcanum',
        source: 'XPHB',
        className: 'Warlock',
        classSource: 'XPHB',
        level: 11,
        entries: ['Choose one level 6 Warlock spell as this arcanum.'],
      },
    ],
    subclassFeature: [],
  },
  'spells/index.json': { XPHB: 'spells-xphb.json', XGE: 'spells-xge.json' },
  'spells/spells-xphb.json': {
    spell: [
      {
        name: 'Fire Bolt',
        source: 'XPHB',
        edition: 'one',
        level: 0,
        school: 'V',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 120 } },
        components: { v: true, s: true },
        duration: [{ type: 'instant' }],
        entries: ['Hurl fire for {@damage 1d10} damage.'],
      },
      {
        name: 'Chill Touch',
        source: 'XPHB',
        edition: 'one',
        level: 0,
        school: 'N',
        page: 249,
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'touch' } },
        components: { v: true, s: true },
        duration: [{ type: 'instant' }],
        damageInflict: ['necrotic'],
        entries: ['Channeling the chill of the grave, make a melee spell attack for {@damage 1d10} Necrotic damage.'],
        entriesHigherLevel: [
          {
            type: 'entries',
            name: 'Cantrip Upgrade',
            entries: ['The damage increases by {@damage 1d10} when you reach levels 5 ({@damage 2d10}).'],
          },
        ],
      },
      {
        name: 'Bane',
        source: 'XPHB',
        edition: 'one',
        level: 1,
        school: 'E',
        page: 245,
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 30 } },
        components: { v: true, s: true, m: 'a drop of blood' },
        duration: [{ type: 'timed', duration: { type: 'minute', amount: 1 }, concentration: true }],
        entries: ['Up to three creatures must subtract {@dice 1d4} from attack rolls or saves.'],
      },
      {
        name: 'Mage Hand',
        source: 'XPHB',
        edition: 'one',
        level: 0,
        school: 'C',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 30 } },
        components: { v: true, s: true },
        duration: [{ type: 'timed', duration: { type: 'minute', amount: 1 } }],
        entries: ['A spectral floating hand appears.'],
      },
      {
        name: 'Mass Suggestion',
        source: 'XPHB',
        edition: 'one',
        level: 6,
        school: 'E',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 60 } },
        components: { v: true, m: 'a snake tongue' },
        duration: [{ type: 'timed', duration: { type: 'hour', amount: 24 } }],
        entries: ['You suggest a course of activity to up to twelve creatures.'],
      },
    ],
  },
  'spells/spells-xge.json': {
    spell: [
      {
        name: 'Create Bonfire',
        source: 'XGE',
        level: 0,
        school: 'C',
        page: 152,
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 60 } },
        components: { v: true, s: true },
        duration: [{ type: 'timed', duration: { type: 'minute', amount: 1 }, concentration: true }],
        damageInflict: ['fire'],
        entries: ['You create a bonfire on ground you can see within range.'],
      },
    ],
  },
  'spells/sources.json': {
    XPHB: {
      'Chill Touch': { class: [{ name: 'Warlock', source: 'XPHB' }] },
      'Mage Hand': { class: [{ name: 'Warlock', source: 'XPHB' }] },
      Bane: { class: [{ name: 'Warlock', source: 'XPHB' }] },
      'Mass Suggestion': { class: [{ name: 'Warlock', source: 'XPHB' }] },
    },
    XGE: {
      'Create Bonfire': { classVariant: [{ name: 'Warlock', source: 'XPHB' }] },
    },
  },
  'races.json': {
    race: [
      {
        name: 'Human',
        source: 'XPHB',
        edition: 'one',
        size: ['S', 'M'],
        speed: 30,
        skillProficiencies: [{ any: 1 }],
        feats: [{ anyFromCategory: { category: ['O'], count: 1 } }],
        entries: [{ type: 'entries', name: 'Resourceful', entries: ['Heroic Inspiration'] }],
      },
      {
        name: 'Dragonborn (Variant)',
        source: 'FRHoF',
        edition: 'one',
        size: ['M'],
        speed: 30,
        entries: [],
      },
      {
        name: 'Half-Elf',
        source: 'PHB',
        size: ['M'],
        speed: 30,
        entries: [],
      },
      {
        name: 'Kobold',
        source: 'MPMM',
        size: ['S'],
        speed: 30,
        entries: [],
      },
    ],
    subrace: [],
  },
  'backgrounds.json': {
    background: [
      {
        name: 'Soldier',
        source: 'XPHB',
        edition: 'one',
        ability: [{ choose: { weighted: { from: ['str', 'dex', 'con'], weights: [2, 1] } } }],
        feats: [{ 'alert|xphb': true }],
        skillProficiencies: [{ athletics: true, intimidation: true }],
        startingEquipment: [
          {
            A: [{ item: 'spear|xphb' }, { value: 1400 }],
            B: [{ value: 5000 }],
          },
        ],
        entries: [],
      },
      {
        name: 'Zhentarim Mercenary',
        source: 'FRHoF',
        edition: 'one',
        skillProficiencies: [{ intimidation: true, persuasion: true }],
        entries: [],
      },
      {
        name: 'Folk Hero',
        source: 'PHB',
        skillProficiencies: [{ survival: true }],
        entries: [],
      },
      {
        name: 'Far Traveler',
        source: 'SCAG',
        skillProficiencies: [{ insight: true, perception: true }],
        entries: [],
      },
    ],
  },
  'feats.json': {
    feat: [
      { name: 'Alert', source: 'XPHB', category: 'O', entries: ['Add PB to Initiative.'] },
      { name: 'Tough', source: 'XPHB', category: 'O', entries: ['Your Hit Point maximum increases by twice your level.'] },
      {
        name: 'Musician',
        source: 'XPHB',
        category: 'O',
        toolProficiencies: [{ anyMusicalInstrument: 3 }],
        entries: ['You gain proficiency with three Musical Instruments of your choice.'],
      },
      {
        name: 'Skilled',
        source: 'XPHB',
        category: 'O',
        skillToolLanguageProficiencies: [{ choose: [{ from: ['anySkill', 'anyTool'], count: 3 }] }],
        entries: ['You gain proficiency in any combination of three skills or tools of your choice.'],
      },
      { name: 'Zhentarim Ruffian', source: 'FRHoF', category: 'O', entries: ['Origin feat from FRHoF.'] },
      { name: 'Healer', source: 'PHB', entries: ['Classic PHB feat.'] },
      { name: 'Eldritch Adept', source: 'TCE', entries: ['Classic TCE feat.'] },
    ],
  },
  'items-base.json': {
    baseitem: [
      {
        name: 'Longsword',
        source: 'XPHB',
        type: 'M|XPHB',
        weapon: true,
        weaponCategory: 'martial',
        dmg1: '1d8',
        dmgType: 'S',
        weight: 3,
      },
      {
        name: 'Spear',
        source: 'XPHB',
        type: 'M|XPHB',
        weapon: true,
        weaponCategory: 'simple',
        dmg1: '1d6',
        dmgType: 'P',
        weight: 3,
      },
      {
        name: 'Dagger',
        source: 'XPHB',
        type: 'M|XPHB',
        weapon: true,
        weaponCategory: 'simple',
        dmg1: '1d4',
        dmgType: 'P',
        weight: 1,
      },
      {
        name: 'Leather Armor',
        source: 'XPHB',
        type: 'LA|XPHB',
        armor: true,
        ac: 11,
        weight: 10,
      },
      {
        name: 'Flute',
        source: 'XPHB',
        type: 'INS|XPHB',
        weight: 1,
      },
      {
        name: 'Lute',
        source: 'XPHB',
        type: 'INS|XPHB',
        weight: 2,
      },
      {
        name: 'Backpack',
        source: 'XPHB',
        type: 'G|XPHB',
        weight: 5,
        containerCapacity: { weight: [30] },
      },
      {
        name: 'Bedroll',
        source: 'XPHB',
        type: 'G|XPHB',
        weight: 7,
      },
      {
        name: "Entertainer's Pack",
        source: 'XPHB',
        type: 'G|XPHB',
        packContents: ['backpack|xphb', { item: 'bedroll|xphb', quantity: 1 }],
      },
      {
        name: 'Acid',
        source: 'XPHB',
        type: 'G|XPHB',
        weight: 1,
      },
      {
        name: 'Abacus',
        source: 'XGE',
        type: 'G',
        weight: 2,
      },
    ],
    itemMastery: [],
    itemProperty: [],
    itemType: [],
  },
  'items.json': {
    item: [
      {
        name: 'Potion of Healing',
        source: 'XPHB',
        type: 'P|XPHB',
        rarity: 'common',
        weight: 0.5,
      },
      {
        name: 'Ring of Protection',
        source: 'XPHB',
        type: 'RG|XDMG',
        rarity: 'rare',
        reqAttune: true,
        bonusAc: '+1',
        bonusSavingThrow: '+1',
      },
    ],
    itemGroup: [],
  },
  'magicvariants.json': { magicvariant: [] },
  'optionalfeatures.json': {
    optionalfeature: [
      {
        name: 'Pact of the Tome',
        source: 'XPHB',
        edition: 'one',
        featureType: ['EI'],
        entries: ['You conjure a Book of Shadows.'],
      },
      {
        name: 'Armor of Shadows',
        source: 'XPHB',
        edition: 'one',
        featureType: ['EI'],
        entries: ['You can cast Mage Armor on yourself without expending a spell slot.'],
      },
      {
        name: 'Armor of Shadows',
        source: 'PHB',
        edition: 'classic',
        featureType: ['EI'],
        entries: ['Legacy 2014 Armor of Shadows.'],
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
        entries: [
          'Add your Charisma modifier to the damage rolls of a damage-dealing Warlock cantrip.',
          { type: 'entries', name: 'Repeatable', entries: ['Choose a different eligible cantrip.'] },
        ],
      },
      {
        name: 'Lessons of the First Ones',
        source: 'XPHB',
        edition: 'one',
        featureType: ['EI'],
        prerequisite: [{ level: { level: 2, class: { name: 'Warlock', source: 'XPHB' } } }],
        entries: [
          'You have received knowledge from an elder entity, allowing you to gain one Origin feat of your choice.',
          { type: 'entries', name: 'Repeatable', entries: ['Choose a different Origin feat.'] },
        ],
      },
    ],
  },
  'charcreationoptions.json': { charcreationoption: [] },
  'skills.json': {
    skill: [{ name: 'Athletics', source: 'XPHB', ability: 'str', entries: ['Athletics check.'] }],
  },
  'languages.json': { language: [{ name: 'Common', source: 'XPHB' }] },
  'senses.json': { sense: [] },
  'conditionsdiseases.json': { condition: [{ name: 'Prone', source: 'XPHB', entries: ['Prone rules.'] }] },
  'actions.json': { action: [{ name: 'Attack', source: 'XPHB', entries: ['Make an attack.'] }] },
  'variantrules.json': { variantrule: [] },
};

describe('Full App Journey: Startup Import -> Builder -> Sheet Visualizer', () => {
  beforeEach(() => {
    storedCompendium = null;
    storedCharacters = [];
    window.location.hash = '#/';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const rel = url.replace('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/', '');
        if (rel in MOCK_FILES) {
          return new Response(JSON.stringify(MOCK_FILES[rel]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('Not found', { status: 404 });
      }),
    );
  });

  it('imports data from user link, creates a character in builder, and rolls dice on the character sheet', async () => {
    render(<App />);

    // 1. Startup gate prompts for link
    const input = await screen.findByLabelText(/5etools Data Repository Link/i);
    fireEvent.change(input, {
      target: { value: 'https://github.com/5etools-mirror-3/5etools-src/tree/main/data' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Import Data/i }));

    // 2. Summary appears -> navigate to Character Vault
    await waitFor(() => {
      expect(screen.getByText(/Compendium Ready in IndexedDB/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Create New Character/i }));

    // 3. Builder opens -> set name, test Class modal + Remove Class + Higher Levels
    const nameInput = await screen.findByPlaceholderText(/Kaelen Duskblade/i);
    fireEvent.change(nameInput, { target: { value: 'Valen Stormguard' } });

    fireEvent.click(screen.getByRole('button', { name: /^1\. Class$/i }));
    expect(screen.getByText(/^Core Rules$/i)).toBeInTheDocument();

    // Click Fighter opens CONFIRM ADD CLASS modal with collapsible level features & Show More
    fireEvent.click(await screen.findByRole('button', { name: /Fighter/i }));
    expect(screen.getByText(/CONFIRM ADD CLASS/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Core Fighter Traits/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Action Surge/i })).toBeInTheDocument();

    // Expand Second Wind inside modal, check Show More toggle, and click ADD CLASS
    fireEvent.click(screen.getByRole('button', { name: /Second Wind/i }));
    const showMoreBtn = await screen.findByRole('button', { name: /Show More/i });
    fireEvent.click(showMoreBtn);
    expect(await screen.findByRole('button', { name: /Show Less/i })).toBeInTheDocument();
    const classModalBtn = await screen.findByRole('button', { name: /^ADD CLASS$/i });
    fireEvent.click(classModalBtn);

    // Selected class shows Core Traits (with skill dropdowns) and "Available at Higher Levels"
    expect(await screen.findByText(/Available at Higher Levels/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Core Fighter Traits/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Fighter Skill Proficiency 1/i)).toBeInTheDocument();

    // Remove Class returns to starting class list, then re-choose Fighter
    fireEvent.click(screen.getByRole('button', { name: /Remove Class/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Fighter/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^ADD CLASS$/i }));

    // Background step: dropdown list + collapsible Details/Characteristics/Notes
    fireEvent.click(screen.getByRole('button', { name: /^2\. Background$/i }));
    const bgSelect = await screen.findByLabelText(/Choose a Background/i);
    fireEvent.change(bgSelect, { target: { value: 'Soldier|XPHB' } });
    expect(screen.getByText('Character Details')).toBeInTheDocument();
    expect(screen.getByText('Physical Characteristics')).toBeInTheDocument();
    expect(screen.getByText('Personal Characteristics')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();

    // Species step: Core/Supplements list -> Choose a Species modal -> Change Species screen + 2024 2 Additional Languages
    fireEvent.click(screen.getByRole('button', { name: /^3\. Species$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Human/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Choose Species/i }));
    expect(await screen.findByRole('button', { name: /Change Species/i })).toBeInTheDocument();
    expect(screen.getByText(/Species Traits/i)).toBeInTheDocument();

    const spLang1 = screen.getByLabelText(/Species Language 1/i) as HTMLSelectElement;
    const spLang2 = screen.getByLabelText(/Species Language 2/i) as HTMLSelectElement;
    const langOpts1 = Array.from(spLang1.options).map((o) => o.value);
    expect(langOpts1).not.toContain('Common');
    expect(langOpts1).toContain('Elvish');
    fireEvent.change(spLang1, { target: { value: 'Elvish' } });
    const langOpts2 = Array.from(spLang2.options).map((o) => o.value);
    expect(langOpts2).not.toContain('Elvish');
    fireEvent.change(spLang2, { target: { value: 'Draconic' } });

    // Open Sheet Visualizer
    fireEvent.click(screen.getByRole('button', { name: /View Character Sheet/i }));

    // 4. Sheet Visualizer displays character name, SVG backdrop, stylized big HP, and rolls Initiative on click
    const initBtn = await screen.findByRole('button', { name: /Roll Initiative/i }, { timeout: 3000 });
    expect(screen.getByText('Valen Stormguard')).toBeInTheDocument();
    expect(screen.getByText(/Second Wind/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeInTheDocument();
    expect(screen.getByTestId('current-hp-value')).toHaveTextContent('11');
    expect(screen.getByTestId('max-hp-value')).toHaveTextContent('11');
    fireEvent.click(screen.getByRole('button', { name: /^Damage$/i }));
    expect(screen.getByTestId('current-hp-value')).toHaveTextContent('10');
    fireEvent.click(screen.getByRole('button', { name: /^Heal$/i }));
    expect(screen.getByTestId('current-hp-value')).toHaveTextContent('11');

    // Click Initiative roll button -> Dice Toast appears
    fireEvent.click(initBtn);
    await waitFor(() => {
      expect(screen.getByText(/Combat Start/i)).toBeInTheDocument();
    });

    // Actions tab shows Attacks & Cantrips and Bonus Action / Reaction / Limited Use filter tabs
    expect(screen.getByText(/Attacks & Cantrips/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Bonus Action$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Reaction$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Limited Use$/i }));
    expect(screen.getByText(/Second Wind/i)).toBeInTheDocument();

    // Switch to Features & Traits tab -> shows scrollable Class Features / Species Traits / Feats filters
    fireEvent.click(screen.getByRole('button', { name: /^Features & Traits$/i }));
    expect(screen.getByRole('button', { name: /^Class Features$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Species Traits$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Feats$/i })).toBeInTheDocument();

    // Switch to Inventory tab -> shows Attunement slots & Items Requiring Attunement + Other Possessions
    fireEvent.click(screen.getByRole('button', { name: /^Inventory$/i }));
    expect(screen.getByText(/Attuned Items/i)).toBeInTheDocument();
    expect(screen.getByText(/Items Requiring Attunement/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Choose an Item from the Right/i)).toHaveLength(3);
    expect(screen.getByText(/Other Possessions/i)).toBeInTheDocument();

    // Add Ring of Protection via the Equipment slide-over modal and verify it appears under Items Requiring Attunement
    fireEvent.click(screen.getByRole('button', { name: /Add Equipment/i }));
    const drawerDialog = await screen.findByRole('dialog', { name: /Equipment Drawer/i });
    expect(drawerDialog).toBeInTheDocument();
    expect(drawerDialog.parentElement).toBe(document.body);
    expect(screen.getByText(/Add Custom Item/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add Ring of Protection/i }));
    fireEvent.click(screen.getByRole('button', { name: /Close Equipment drawer/i }));

    const attuneButtons = await screen.findAllByRole('button', { name: /^Attune$/i });
    fireEvent.click(attuneButtons[attuneButtons.length - 1]);
    expect(screen.getAllByText(/Choose an Item from the Right/i)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /Unattune Ring of Protection/i }));
    expect(screen.getAllByText(/Choose an Item from the Right/i)).toHaveLength(3);
  }, 15000);

  it('deduplicates Warlock Eldritch Invocations and filters level & edition prerequisites', async () => {
    render(<App />);

    const input = await screen.findByLabelText(/5etools Data Repository Link/i);
    fireEvent.change(input, {
      target: { value: 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Import Data/i }));

    await waitFor(() => {
      expect(screen.getByText(/Compendium Ready in IndexedDB/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Create New Character/i }));

    fireEvent.click(await screen.findByRole('button', { name: /^1\. Class$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Warlock/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^ADD CLASS$/i }));

    // Only one Eldritch Invocations box exists (no duplicate Eldritch Invocation Options box)
    await screen.findByRole('button', { name: /Core Warlock Traits/i });
    expect(screen.getAllByRole('button', { name: /Eldritch Invocations/i })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Eldritch Invocation Options/i })).not.toBeInTheDocument();

    // Only one level 1 invocation dropdown, containing eligible XPHB Level 1 options only
    const invSelects = screen.getAllByLabelText(/Eldritch Invocations Option/i);
    expect(invSelects).toHaveLength(1);
    const optionTexts = Array.from((invSelects[0] as HTMLSelectElement).options).map((o) => o.text);
    expect(optionTexts).toContain('Pact of the Tome (XPHB)');
    expect(optionTexts).toContain('Armor of Shadows (XPHB)');
    expect(optionTexts).not.toContain('Armor of Shadows (PHB)');
    expect(optionTexts).not.toContain('Agonizing Blast (XPHB)');

    // Raising Warlock to Level 2 unlocks Level 2+ prerequisites and increases invocation count to 3
    fireEvent.change(screen.getByLabelText(/Warlock Level/i), { target: { value: '2' } });
    const level2Selects = await screen.findAllByLabelText(/Eldritch Invocations Option/i);
    expect(level2Selects).toHaveLength(3);
    const level2OptionTexts = Array.from((level2Selects[0] as HTMLSelectElement).options).map((o) => o.text);
    expect(level2OptionTexts).toContain('Agonizing Blast (XPHB)');

    // Reset level to 1 and test D&D Beyond Spells Sub-tab layout, filters, and expanded spell cards
    fireEvent.change(screen.getByLabelText(/Warlock Level/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /^Spells$/i }));

    expect(await screen.findByText(/^Prepared Spells$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Add Spells$/i)).toBeInTheDocument();
    expect(screen.getByText(/Cantrips:/i)).toHaveTextContent('0/2');
    expect(screen.getByText(/Prepared Spells:/i)).toHaveTextContent('0/2');
    expect(screen.getByPlaceholderText(/Enter Spell Name/i)).toBeInTheDocument();

    // ClassVariant XGE spell and XPHB spells both appear, with LEARN for cantrips and PREPARE for 1st-level spells
    expect(screen.getByText('Chill Touch')).toBeInTheDocument();
    expect(screen.getByText('Create Bonfire')).toBeInTheDocument();
    expect(screen.getByText('Bane')).toBeInTheDocument();

    // Expand Chill Touch to verify D&D Beyond spell details, Cantrip Upgrade, TAGS, and dual LEARN buttons
    fireEvent.click(screen.getByRole('button', { name: /Toggle Chill Touch details/i }));
    expect(await screen.findByText(/Necromancy Cantrip/i)).toBeInTheDocument();
    expect(screen.getByText(/Cantrip Upgrade\./i)).toBeInTheDocument();
    expect(screen.getByText('DAMAGE')).toBeInTheDocument();
    expect(screen.getByText(/pg\. 249/i)).toBeInTheDocument();

    // Click LEARN inside expanded Chill Touch -> updates cantrip count & Prepared Spells banner count
    const learnButtons = screen.getAllByRole('button', { name: /^LEARN$/i });
    fireEvent.click(learnButtons[1]);
    expect(screen.getByText(/Cantrips:/i)).toHaveTextContent('1/2');
    expect(screen.getByRole('button', { name: /Prepared Spells \(1\)/i })).toBeInTheDocument();

    // Source Category filter isolates 5E EXPANDED RULES (Create Bonfire) vs 5.5E CORE RULES (Chill Touch/Bane)
    fireEvent.click(screen.getByRole('button', { name: /5E EXPANDED RULES/i }));
    expect(screen.getByText('Create Bonfire')).toBeInTheDocument();
    expect(screen.queryByText('Bane')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /5E EXPANDED RULES/i }));

    // Spell Level filter isolates 1st-level Bane with PREPARE button
    fireEvent.click(screen.getByRole('button', { name: /^1\s*ST$/i }));
    expect(screen.getByText('Bane')).toBeInTheDocument();
    expect(screen.queryByText('Create Bonfire')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^PREPARE$/i }));
    expect(screen.getByText(/Prepared Spells:/i)).toHaveTextContent('1/2');
    const prepBanner = screen.getByRole('button', { name: /Prepared Spells \(2\)/i });
    expect(prepBanner).toBeInTheDocument();

    // Expand Prepared Spells banner -> displays FORGET and UNPREPARE actions for chosen spells
    fireEvent.click(prepBanner);
    expect(screen.getAllByRole('button', { name: /^FORGET$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /^UNPREPARE$/i }).length).toBeGreaterThanOrEqual(1);

    // Enable All / Mixed Sources and verify 5.5e Core / 5.5e Supplements / 5e Core / 5e Supplements in Background & Species
    fireEvent.click(screen.getByRole('button', { name: /^Home$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /All \/ Mixed Sources/i }));

    fireEvent.click(screen.getByRole('button', { name: /^2\. Background$/i }));
    const bgSelectMixed = await screen.findByLabelText(/Choose a Background/i);
    const optgroupLabels = Array.from(bgSelectMixed.querySelectorAll('optgroup')).map((g) => g.getAttribute('label'));
    expect(optgroupLabels).toEqual(['5.5e Core', '5.5e Supplements', '5e Core', '5e Supplements']);

    // Choosing 2024 Soldier separates Background Origin Feat dropdown by all 4 source tiers too
    fireEvent.change(bgSelectMixed, { target: { value: 'Soldier|XPHB' } });
    const bgOriginSelect = await screen.findByLabelText(/Background Origin Feat/i);
    const bgFeatOptgroups = Array.from(bgOriginSelect.querySelectorAll('optgroup')).map((g) => g.getAttribute('label'));
    expect(bgFeatOptgroups).toEqual(['5.5e Core', '5.5e Supplements', '5e Core', '5e Supplements']);

    fireEvent.click(screen.getByRole('button', { name: /^3\. Species$/i }));
    expect(await screen.findByText(/^5\.5e Core$/)).toBeInTheDocument();
    expect(screen.getByText(/^5\.5e Supplements$/)).toBeInTheDocument();
    expect(screen.getByText(/^5e Core$/)).toBeInTheDocument();
    expect(screen.getByText(/^5e Supplements$/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Half-Elf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kobold/i })).toBeInTheDocument();

    // Selecting Human (XPHB) exposes Size, Skillful (excluding skills already owned from Soldier), Versatile (grouped Origin Feat), and hides Species ASI when Background ASI is active
    fireEvent.click(screen.getByRole('button', { name: /Human/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^CHOOSE SPECIES$/i }));
    const speciesSkillSelect = (await screen.findByLabelText(/Species Skill Proficiency 1/i)) as HTMLSelectElement;
    const speciesSkillOpts = Array.from(speciesSkillSelect.options).map((o) => o.value);
    expect(speciesSkillOpts).not.toContain('Athletics');
    expect(speciesSkillOpts).not.toContain('Intimidation');
    expect(speciesSkillOpts).toContain('Perception');
    fireEvent.change(speciesSkillSelect, { target: { value: 'Perception' } });

    expect(screen.getByRole('button', { name: /^Small$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Medium$/i })).toBeInTheDocument();
    expect(screen.queryByText(/Ability Score Increases/i)).not.toBeInTheDocument();

    const spOriginSelect = screen.getByLabelText(/Species Origin Feat/i);
    expect(Array.from(spOriginSelect.querySelectorAll('optgroup')).map((g) => g.getAttribute('label'))).toEqual([
      '5.5e Core',
      '5.5e Supplements',
      '5e Core',
      '5e Supplements',
    ]);
    fireEvent.change(spOriginSelect, { target: { value: 'Skilled|XPHB' } });
    expect(await screen.findByText(/Skilled: Choose 3 Skills or Tools/i)).toBeInTheDocument();
    const skilledSelect1 = screen.getByLabelText(/Skilled Proficiency Choice 1/i) as HTMLSelectElement;
    const skilledVals = Array.from(skilledSelect1.options).map((o) => o.value);
    expect(skilledVals).not.toContain('skill:Athletics');
    expect(skilledVals).not.toContain('skill:Intimidation');
    expect(skilledVals).not.toContain('skill:Perception');
    expect(skilledVals).toContain('skill:Stealth');
    expect(skilledVals).toContain('tool:Lute');
  }, 15000);

  it('shows Bard L1 instrument & skill choices, Cleric Divine Order, and Background/Class overlap replacements', async () => {
    render(<App />);

    const input = await screen.findByLabelText(/5etools Data Repository Link/i);
    fireEvent.change(input, {
      target: { value: 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Import Data/i }));

    await waitFor(() => {
      expect(screen.getByText(/Compendium Ready in IndexedDB/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Create New Character/i }));

    // 1. Choose Soldier Background first (grants Athletics & Intimidation)
    fireEvent.click(await screen.findByRole('button', { name: /^2\. Background$/i }));
    const bgSelect = await screen.findByLabelText(/Choose a Background/i);
    fireEvent.change(bgSelect, { target: { value: 'Soldier|XPHB' } });
    expect(await screen.findByRole('button', { name: /Background Proficiencies/i })).toBeInTheDocument();

    // 2. Choose Bard in Class step -> 6 Choices (3 Musical Instruments + 3 Skills)
    fireEvent.click(screen.getByRole('button', { name: /^1\. Class$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Bard/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^ADD CLASS$/i }));

    expect(await screen.findByText(/6 Choices · 1st level/i)).toBeInTheDocument();
    const bardTools = screen.getAllByLabelText(/Bard Tool Proficiency/i);
    expect(bardTools).toHaveLength(3);
    fireEvent.change(bardTools[0], { target: { value: 'Lute' } });
    const bardSkills = screen.getAllByLabelText(/Bard Skill Proficiency/i);
    expect(bardSkills).toHaveLength(3);

    // Overlap check: Athletics indicates Soldier Background; picking it anyway creates a free replacement skill choice
    const athleticsOpt = Array.from((bardSkills[0] as HTMLSelectElement).options).find((o) => o.value === 'Athletics');
    expect(athleticsOpt?.text).toMatch(/Already from Soldier/i);

    fireEvent.change(bardSkills[0], { target: { value: 'Athletics' } });
    expect(await screen.findByText(/Background Overlap Detected/i)).toBeInTheDocument();
    const classRepSelect = await screen.findByLabelText(/Class Triggered Background Replacement Skill \(Athletics\)/i);
    fireEvent.change(classRepSelect, { target: { value: 'Stealth' } });

    // Background tab reflects the replacement too
    fireEvent.click(screen.getByRole('button', { name: /^2\. Background$/i }));
    const bgRepSelect = await screen.findByLabelText(/Background Replacement Skill \(Athletics\)/i);
    expect((bgRepSelect as HTMLSelectElement).value).toBe('Stealth');

    // Verify Human Musician Origin Feat shows 3 Musical Instrument selectors and excludes Bard's chosen Lute
    fireEvent.click(screen.getByRole('button', { name: /^3\. Species$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Human/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^CHOOSE SPECIES$/i }));
    const humanOriginSelect = await screen.findByLabelText(/Species Origin Feat/i);
    fireEvent.change(humanOriginSelect, { target: { value: 'Musician|XPHB' } });
    const musicianSelects = await screen.findAllByLabelText(/Musician Tool Choice/i);
    expect(musicianSelects).toHaveLength(3);
    const musicianOpts = Array.from((musicianSelects[0] as HTMLSelectElement).options).map((o) => o.value);
    expect(musicianOpts).not.toContain('Lute');
    expect(musicianOpts).toContain('Horn');

    // 3. Switch class to Cleric and verify Divine Order L1 choice
    fireEvent.click(screen.getByRole('button', { name: /^1\. Class$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Remove Class/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Cleric/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^ADD CLASS$/i }));

    const divineOrderSelect = await screen.findByLabelText(/Divine Order Option/i);
    fireEvent.change(divineOrderSelect, { target: { value: 'Protector|Cleric|XPHB|1|XPHB' } });
    expect(await screen.findByText(/Heavy armor/i)).toBeInTheDocument();
  }, 15000);

  it('handles Equipment option switching, deferred commit via ADD STARTING EQUIPMENT, Clear All, and Add Items filters', async () => {
    render(<App />);

    const input = await screen.findByLabelText(/5etools Data Repository Link/i);
    fireEvent.change(input, {
      target: { value: 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Import Data/i }));

    await waitFor(() => {
      expect(screen.getByText(/Compendium Ready in IndexedDB/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Create New Character/i }));

    // Select Bard & Soldier
    fireEvent.click(await screen.findByRole('button', { name: /^1\. Class$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Bard/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^ADD CLASS$/i }));

    fireEvent.click(screen.getByRole('button', { name: /^2\. Background$/i }));
    fireEvent.change(await screen.findByLabelText(/Choose a Background/i), {
      target: { value: 'Soldier|XPHB' },
    });

    // Open 5. Equipment step
    fireEvent.click(screen.getByRole('button', { name: /^5\. Equipment$/i }));
    expect(await screen.findByRole('heading', { name: /Choose Equipment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SKIP STARTING EQUIPMENT/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Current Inventory \(0\)/i })).toBeInTheDocument();

    // Select Bard (A) -> shows Musical Instrument dropdown + pack summary + flips button to ADD STARTING EQUIPMENT without committing
    const optABtn = screen.getByRole('checkbox', { name: /\(A\) Leather Armor, 2 Daggers/i });
    fireEvent.click(optABtn);
    expect(optABtn).toHaveAttribute('aria-checked', 'true');
    const instrSelect = screen.getByLabelText(/Bard Starting Equipment Musical Instrument/i);
    expect((instrSelect as HTMLSelectElement).value).toBe('Flute|XPHB');
    expect(screen.getByText(/An Entertainer's Pack contains the following items:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ADD STARTING EQUIPMENT/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Current Inventory \(0\)/i })).toBeInTheDocument();

    // Clicking Bard (B) switches selection away from (A)
    const bardBBtn = screen.getByRole('checkbox', { name: /\(B\) 90 GP/i });
    fireEvent.click(bardBBtn);
    expect(bardBBtn).toHaveAttribute('aria-checked', 'true');
    expect(optABtn).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByText(/An Entertainer's Pack contains the following items:/i)).not.toBeInTheDocument();

    // Clear All unchecks everything and reverts to SKIP STARTING EQUIPMENT
    fireEvent.click(screen.getByRole('button', { name: /^Clear All$/i }));
    expect(bardBBtn).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: /SKIP STARTING EQUIPMENT/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Current Inventory \(0\)/i })).toBeInTheDocument();

    // Select Bard (A) -> pick Lute, and Soldier (B) 50 GP, then click ADD STARTING EQUIPMENT
    fireEvent.click(optABtn);
    fireEvent.change(screen.getByLabelText(/Bard Starting Equipment Musical Instrument/i), {
      target: { value: 'Lute|XPHB' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /\(B\) 50 GP/i }));
    fireEvent.click(screen.getByRole('button', { name: /ADD STARTING EQUIPMENT/i }));

    // Now items & 69 GP (19 + 50) are added to inventory and currency
    expect(await screen.findByText(/Added 6 items and 69 GP to Current Inventory/i)).toBeInTheDocument();
    expect(screen.getByText(/Total in GP:/i)).toHaveTextContent('69');
    expect(screen.getByText('Leather Armor')).toBeInTheDocument();
    expect(screen.getByText('Lute')).toBeInTheDocument();
    expect(screen.getByText('Backpack')).toBeInTheDocument();

    // Open Add Items -> verify Filter input, type toggles, Legacy badge, and ADD button
    fireEvent.click(screen.getByRole('button', { name: /^Add Items$/i }));
    expect(screen.getByText('Legacy')).toBeInTheDocument();

    // Filter by Type: POTION
    fireEvent.click(screen.getByRole('button', { name: /^POTION$/i }));
    expect(screen.getByText('Potion of Healing')).toBeInTheDocument();
    expect(screen.queryByText('Acid')).not.toBeInTheDocument();

    // Click ADD on Potion of Healing
    fireEvent.click(screen.getByRole('button', { name: /Add Potion of Healing/i }));
    expect(screen.getByRole('button', { name: /Current Inventory \(7\)/i })).toBeInTheDocument();
  }, 15000);

  it('allows selecting Origin Feat on Lessons of the First Ones, Known Cantrip on Agonizing Blast, higher-level Mystic Arcanum, and shows short descriptions', async () => {
    render(<App />);

    const input = await screen.findByLabelText(/5etools Data Repository Link/i);
    fireEvent.change(input, {
      target: { value: 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Import Data/i }));

    await waitFor(() => {
      expect(screen.getByText(/Compendium Ready in IndexedDB/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Create New Character/i }));

    fireEvent.click(await screen.findByRole('button', { name: /^1\. Class$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Warlock/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^ADD CLASS$/i }));

    // Raise Warlock to Level 2 -> learn Chill Touch (damage) and Mage Hand (utility)
    fireEvent.change(await screen.findByLabelText(/Warlock Level/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /^Spells$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Toggle Chill Touch details/i }));
    const ctLearnBtns = screen.getAllByRole('button', { name: /^LEARN$/i });
    fireEvent.click(ctLearnBtns[1]); // Chill Touch
    fireEvent.click(screen.getByRole('button', { name: /Toggle Mage Hand details/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /^LEARN$/i }).slice(-1)[0]);

    // Back to Class Features
    fireEvent.click(screen.getByRole('button', { name: /^Class Features$/i }));
    const invSelects = await screen.findAllByLabelText(/Eldritch Invocations Option/i);
    expect(invSelects).toHaveLength(3);

    // Slot 1: Lessons of the First Ones -> shows short description & Origin Feat selector
    fireEvent.change(invSelects[0], { target: { value: 'Lessons of the First Ones|XPHB' } });
    expect(await screen.findByText(/received knowledge from an elder entity/i)).toBeInTheDocument();
    const lessonsOriginSelect = await screen.findByLabelText(/Lessons of the First Ones Origin Feat 1/i);
    fireEvent.change(lessonsOriginSelect, { target: { value: 'Tough|XPHB' } });
    expect(await screen.findByText(/Hit Point maximum increases by twice your level/i)).toBeInTheDocument();

    // Slot 2: Repeatable Lessons of the First Ones is STILL available, and excludes non-repeatable Tough
    const slot2Opts = Array.from((invSelects[1] as HTMLSelectElement).options).map((o) => o.text);
    expect(slot2Opts).toContain('Lessons of the First Ones (XPHB)');

    // Slot 2: Agonizing Blast -> shows short description & Known Cantrip selector (Chill Touch included, Mage Hand excluded)
    fireEvent.change(invSelects[1], { target: { value: 'Agonizing Blast|XPHB' } });
    expect(await screen.findByText(/Add your Charisma modifier to the damage rolls/i)).toBeInTheDocument();
    const cantripSelect = await screen.findByLabelText(/Agonizing Blast Known Cantrip 2/i) as HTMLSelectElement;
    const cantripOptTexts = Array.from(cantripSelect.options).map((o) => o.text);
    expect(cantripOptTexts).toContain('Chill Touch (XPHB)');
    expect(cantripOptTexts).not.toContain('Mage Hand (XPHB)');
    fireEvent.change(cantripSelect, { target: { value: 'Chill Touch|XPHB' } });

    // Raising to Level 11 unlocks Mystic Arcanum (Level 6 spell) + shows chosen spell description
    fireEvent.change(screen.getByLabelText(/Warlock Level/i), { target: { value: '11' } });
    const arcanumSelect = await screen.findByLabelText(/Mystic Arcanum Level 6 Spell/i);
    fireEvent.change(arcanumSelect, { target: { value: 'Mass Suggestion|XPHB' } });
    expect(await screen.findByText(/suggest a course of activity to up to twelve creatures/i)).toBeInTheDocument();

    // Open Character Sheet -> Features & Traits shows Origin Feat & Selected Cantrip under Eldritch Invocations
    fireEvent.click(screen.getByRole('button', { name: /View Character Sheet/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^Features & Traits$/i }));
    expect(await screen.findByText(/Origin Feat: Tough/i)).toBeInTheDocument();
    expect(screen.getByText(/Selected Cantrip: Chill Touch/i)).toBeInTheDocument();
    expect(screen.getByText(/Selected Spells: Mass Suggestion/i)).toBeInTheDocument();
  }, 15000);
});
