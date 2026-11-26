import { describe, expect, it } from 'vitest';
import { normalizeFiveToolsDataUrl } from '../services/fiveToolsUrl';
import { mergeRacesAndSubraces, resolveCopyEntries } from '../services/fiveToolsCopy';
import type { Background5e, Race5e, Subrace5e } from '../types/5etools';

describe('normalizeFiveToolsDataUrl', () => {
  it('converts github tree URL to raw.githubusercontent.com URL', () => {
    expect(
      normalizeFiveToolsDataUrl('https://github.com/5etools-mirror-3/5etools-src/tree/main/data'),
    ).toBe('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data');
  });

  it('converts bare github repo URL to main/data raw URL', () => {
    expect(normalizeFiveToolsDataUrl('https://github.com/5etools-mirror-3/5etools-src/')).toBe(
      'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data',
    );
  });

  it('preserves raw and custom CDN URLs without trailing slash', () => {
    expect(
      normalizeFiveToolsDataUrl('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/'),
    ).toBe('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data');
  });

  it('rejects empty or invalid URLs', () => {
    expect(() => normalizeFiveToolsDataUrl('')).toThrow();
    expect(() => normalizeFiveToolsDataUrl('not-a-url')).toThrow();
  });
});

describe('5etools _copy and subrace merging', () => {
  it('resolves _copy with replaceArr and insertArr mods', () => {
    const raw: Background5e[] = [
      {
        name: 'Criminal',
        source: 'PHB',
        skillProficiencies: [{ deception: true, stealth: true }],
        entries: [
          { type: 'entries', name: 'Feature: Criminal Contact', entries: ['Base contact'] },
          { type: 'entries', name: 'Suggested Characteristics', entries: ['Base traits'] },
        ],
      },
      {
        name: "Baldur's Gate Criminal",
        source: 'BGDIA',
        _copy: {
          name: 'Criminal',
          source: 'PHB',
          _mod: {
            entries: {
              mode: 'insertArr',
              index: 1,
              items: [{ type: 'entries', name: 'Baldur Feature', entries: ['City ties'] }],
            },
          },
        },
      },
    ];

    const resolved = resolveCopyEntries(raw);
    const bg = resolved.find((b) => b.name === "Baldur's Gate Criminal")!;
    expect(bg.skillProficiencies).toEqual([{ deception: true, stealth: true }]);
    expect(bg.entries?.length).toBe(3);
    expect((bg.entries?.[1] as { name?: string }).name).toBe('Baldur Feature');
  });

  it('merges subraces with parent races cleanly', () => {
    const races: Race5e[] = [
      {
        name: 'Dwarf',
        source: 'PHB',
        size: ['M'],
        speed: 25,
        darkvision: 60,
        ability: [{ con: 2 }],
        entries: [{ type: 'entries', name: 'Dwarven Resilience', entries: ['Advantage vs poison.'] }],
      },
      {
        name: 'Human',
        source: 'XPHB',
        edition: 'one',
        size: ['M', 'S'],
        speed: 30,
        entries: [{ type: 'entries', name: 'Resourceful', entries: ['Heroic Inspiration.'] }],
      },
    ];
    const subraces: Subrace5e[] = [
      {
        name: 'Hill',
        source: 'PHB',
        raceName: 'Dwarf',
        raceSource: 'PHB',
        ability: [{ wis: 1 }],
        entries: [{ type: 'entries', name: 'Dwarven Toughness', entries: ['+1 HP per level'] }],
      },
    ];

    const merged = mergeRacesAndSubraces(races, subraces);
    expect(merged.map((r) => r.name)).toContain('Dwarf (Hill)');
    expect(merged.map((r) => r.name)).toContain('Human');

    const hillDwarf = merged.find((r) => r.name === 'Dwarf (Hill)')!;
    expect(hillDwarf.darkvision).toBe(60);
    expect(hillDwarf.ability).toEqual([{ con: 2 }, { wis: 1 }]);
    expect(hillDwarf.entries?.length).toBe(2);
  });
});
