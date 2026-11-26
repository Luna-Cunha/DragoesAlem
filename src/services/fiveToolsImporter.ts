import type {
  Action5e,
  Background5e,
  Book5e,
  CharCreationOption5e,
  Class5e,
  ClassFeature5e,
  ClassFluff5e,
  CompiledCompendium,
  Condition5e,
  Feat5e,
  Item5e,
  ItemMastery5e,
  ItemProperty5e,
  ItemType5e,
  Language5e,
  MagicVariant5e,
  OptionalFeature5e,
  Race5e,
  Sense5e,
  Skill5e,
  Spell5e,
  Subclass5e,
  SubclassFeature5e,
  Subrace5e,
  VariantRule5e,
} from '../types/5etools';
import { mergeRacesAndSubraces, resolveCopyEntries } from './fiveToolsCopy';
import { normalizeFiveToolsDataUrl } from './fiveToolsUrl';

export interface ImportProgress {
  phase: string;
  current: number;
  total: number;
  detail: string;
}

type JsonFetcher = <T = Record<string, unknown>>(relativePath: string, optional?: boolean) => Promise<T | null>;

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function next() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx], idx);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, () => next());
  await Promise.all(runners);
  return results;
}

function parseRefCode(val: unknown): string {
  if (typeof val === 'string') return val.split('|')[0].trim().toLowerCase();
  if (val && typeof val === 'object' && 'uid' in val && typeof (val as { uid?: unknown }).uid === 'string') {
    return (val as { uid: string }).uid.split('|')[0].trim().toLowerCase();
  }
  return '';
}

function matchesVariantReq(item: Item5e, req: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(req)) {
    if (k === 'type') {
      const itemType = item.type ? parseRefCode(item.type) : '';
      if (parseRefCode(String(v)) !== itemType) return false;
    } else if (k === 'property') {
      const props = (item.property || []).map(parseRefCode);
      if (!props.includes(parseRefCode(String(v)))) return false;
    } else if (k === 'weaponCategory') {
      if (item.weaponCategory !== v) return false;
    } else if (k === 'armor') {
      if (Boolean(item.armor) !== Boolean(v)) return false;
    } else if (k === 'weapon') {
      if (Boolean(item.weapon) !== Boolean(v)) return false;
    } else if (k === 'sword') {
      if (Boolean((item as unknown as Record<string, unknown>).sword) !== Boolean(v)) return false;
    } else if (k === 'dmgType') {
      if (item.dmgType !== v) return false;
    } else {
      if ((item as unknown as Record<string, unknown>)[k] !== v) return false;
    }
  }
  return true;
}

function mergeBaseItemsAndVariants(
  baseItems: Item5e[],
  items: Item5e[],
  magicVariants: MagicVariant5e[],
): Item5e[] {
  const resolvedBase = resolveCopyEntries(baseItems);
  const baseByKey = new Map<string, Item5e>();
  for (const b of resolvedBase) {
    baseByKey.set(`${b.name.toLowerCase()}|${b.source.toLowerCase()}`, b);
  }

  const resolvedItems = resolveCopyEntries(items).map((it) => {
    if (!it.baseItem) return it;
    const [bName, bSource] = it.baseItem.split('|');
    const lookupKey = `${(bName || '').toLowerCase()}|${(bSource || 'PHB').toLowerCase()}`;
    const base = baseByKey.get(lookupKey) || resolvedBase.find((b) => b.name.toLowerCase() === (bName || '').toLowerCase());
    if (!base) return it;
    return {
      ...base,
      ...it,
      entries: it.entries ?? base.entries,
      property: it.property ?? base.property,
      mastery: it.mastery ?? base.mastery,
    };
  });

  // Expand standard magic variants (+1/+2/+3 weapons & armor, etc.) while keeping dataset fast
  const generatedVariants: Item5e[] = [];
  const existingNames = new Set(
    [...resolvedBase, ...resolvedItems].map((i) => `${i.name.toLowerCase()}|${i.source.toLowerCase()}`),
  );

  for (const mv of magicVariants) {
    if (!mv.inherits || !mv.requires || mv.requires.length === 0) continue;
    // Generate variants for base items matching requires (skip ammo/scroll bloat if huge, cap at 3500 total)
    if (generatedVariants.length > 1800) break;

    for (const base of resolvedBase) {
      if (base.rarity && base.rarity !== 'none') continue;
      const matchesReq = mv.requires.some((req) => matchesVariantReq(base, req));
      if (!matchesReq) continue;
      if (mv.excludes && matchesVariantReq(base, mv.excludes)) continue;

      const prefix = mv.inherits.namePrefix || '';
      const suffix = mv.inherits.nameSuffix || '';
      const genName = `${prefix}${base.name}${suffix}`.trim();
      const genSource = mv.inherits.source || base.source;
      const key = `${genName.toLowerCase()}|${genSource.toLowerCase()}`;
      if (existingNames.has(key)) continue;
      existingNames.add(key);

      const { namePrefix: _np, nameSuffix: _ns, ...inheritRest } = mv.inherits;
      generatedVariants.push({
        ...base,
        ...inheritRest,
        name: genName,
        source: genSource,
        baseItem: `${base.name}|${base.source}`,
        entries: inheritRest.entries ?? base.entries,
      });
    }
  }

  return [...resolvedBase, ...resolvedItems, ...generatedVariants];
}

interface SpellSourceListEntry {
  class?: { name: string; source: string }[];
  classVariant?: { name: string; source: string }[];
  subclass?: Record<string, unknown>;
}

interface GenSpellLookupEntry {
  class?: Record<string, Record<string, boolean | Record<string, unknown>>>;
  classVariant?: Record<string, Record<string, boolean | Record<string, unknown>>>;
  subclass?: Record<string, unknown>;
}

function enrichSpellSources(
  spells: Spell5e[],
  sourcesData: Record<string, Record<string, SpellSourceListEntry>> | null,
  genLookup: Record<string, Record<string, GenSpellLookupEntry>> | null,
): Spell5e[] {
  return spells.map((spell) => {
    const classesMap = new Map<string, { name: string; source: string }>();
    const subclassesList: { className: string; classSource: string; name: string; source: string }[] = [];

    // 1) spells/sources.json lookup (class + classVariant)
    const bookBlock = sourcesData?.[spell.source] || sourcesData?.[spell.source.toUpperCase()];
    const srcEntry = bookBlock?.[spell.name];
    for (const group of [srcEntry?.class, srcEntry?.classVariant]) {
      if (!group) continue;
      for (const c of group) {
        classesMap.set(`${c.name}|${c.source}`, { name: c.name, source: c.source });
      }
    }

    // 2) generated/gendata-spell-source-lookup.json fallback/supplement (class + classVariant)
    const genBook = genLookup?.[spell.source.toLowerCase()];
    const genEntry = genBook?.[spell.name.toLowerCase()];
    for (const classBlock of [genEntry?.class, genEntry?.classVariant]) {
      if (!classBlock) continue;
      for (const [classSource, classNames] of Object.entries(classBlock)) {
        for (const className of Object.keys(classNames)) {
          classesMap.set(`${className}|${classSource}`, { name: className, source: classSource });
        }
      }
    }
    if (genEntry?.subclass) {
      for (const [classSource, classesObj] of Object.entries(genEntry.subclass)) {
        if (typeof classesObj !== 'object' || !classesObj) continue;
        for (const [className, subSourcesObj] of Object.entries(classesObj as Record<string, unknown>)) {
          if (typeof subSourcesObj !== 'object' || !subSourcesObj) continue;
          for (const [subSource, subNamesObj] of Object.entries(subSourcesObj as Record<string, unknown>)) {
            if (typeof subNamesObj !== 'object' || !subNamesObj) continue;
            for (const subName of Object.keys(subNamesObj as Record<string, unknown>)) {
              subclassesList.push({
                className,
                classSource,
                name: subName,
                source: subSource,
              });
            }
          }
        }
      }
    }

    return {
      ...spell,
      classes: [...classesMap.values()],
      subclasses: subclassesList,
    };
  });
}

async function compileCompendium(
  sourceUrl: string,
  fetcher: JsonFetcher,
  onProgress?: (progress: ImportProgress) => void,
): Promise<CompiledCompendium> {
  const report = (phase: string, current: number, total: number, detail: string) => {
    onProgress?.({ phase, current, total, detail });
  };

  report('Validating source', 1, 14, 'Fetching books.json...');
  const booksJson = await fetcher<{ book?: Book5e[] }>('books.json');
  if (!booksJson || !Array.isArray(booksJson.book)) {
    throw new Error('books.json not found or invalid. Check that the link points to a 5etools data directory.');
  }

  report('Fetching indexes', 2, 14, 'Fetching class and spell indexes...');
  const [classIndex, spellsIndex] = await Promise.all([
    fetcher<Record<string, string>>('class/index.json'),
    fetcher<Record<string, string>>('spells/index.json'),
  ]);

  if (!classIndex || !spellsIndex) {
    throw new Error('Could not find class/index.json or spells/index.json.');
  }

  const classFiles = Object.values(classIndex);
  const spellFiles = Object.values(spellsIndex);
  const totalSteps = 14 + classFiles.length + spellFiles.length;
  let completed = 2;

  report('Classes', completed, totalSteps, `Loading ${classFiles.length} class files...`);
  const classPayloads = await runPool(classFiles, 6, async (file) => {
    const fluffFile = file.startsWith('class-') ? `fluff-${file}` : null;
    const [data, fluff] = await Promise.all([
      fetcher<{
        class?: Class5e[];
        subclass?: Subclass5e[];
        classFeature?: ClassFeature5e[];
        subclassFeature?: SubclassFeature5e[];
      }>(`class/${file}`, true),
      fluffFile
        ? fetcher<{ classFluff?: ClassFluff5e[] }>(`class/${fluffFile}`, true)
        : Promise.resolve(null),
    ]);
    completed++;
    report('Classes', completed, totalSteps, `Loaded ${file}`);
    return { data, fluff };
  });

  const classes: Class5e[] = [];
  const classFluff: ClassFluff5e[] = [];
  const subclasses: Subclass5e[] = [];
  const classFeatures: ClassFeature5e[] = [];
  const subclassFeatures: SubclassFeature5e[] = [];

  for (const p of classPayloads) {
    if (p.data) {
      if (p.data.class) classes.push(...p.data.class);
      if (p.data.subclass) subclasses.push(...p.data.subclass);
      if (p.data.classFeature) classFeatures.push(...p.data.classFeature);
      if (p.data.subclassFeature) subclassFeatures.push(...p.data.subclassFeature);
    }
    if (p.fluff?.classFluff) {
      classFluff.push(...p.fluff.classFluff);
    }
  }

  report('Spells', completed, totalSteps, `Loading ${spellFiles.length} spell files...`);
  const spellPayloads = await runPool(spellFiles, 6, async (file) => {
    const data = await fetcher<{ spell?: Spell5e[] }>(`spells/${file}`, true);
    completed++;
    report('Spells', completed, totalSteps, `Loaded ${file}`);
    return data;
  });

  const rawSpells: Spell5e[] = [];
  for (const p of spellPayloads) {
    if (p?.spell) rawSpells.push(...p.spell);
  }

  report('Spell Sources', ++completed, totalSteps, 'Loading spell class mappings...');
  const [spellSources, genSpellLookup] = await Promise.all([
    fetcher<Record<string, Record<string, SpellSourceListEntry>>>('spells/sources.json', true),
    fetcher<Record<string, Record<string, GenSpellLookupEntry>>>(
      'generated/gendata-spell-source-lookup.json',
      true,
    ),
  ]);
  const spells = enrichSpellSources(rawSpells, spellSources, genSpellLookup);

  report('Species & Backgrounds', ++completed, totalSteps, 'Loading races.json & backgrounds.json...');
  const [racesJson, backgroundsJson, featsJson] = await Promise.all([
    fetcher<{ race?: Race5e[]; subrace?: Subrace5e[] }>('races.json'),
    fetcher<{ background?: Background5e[] }>('backgrounds.json'),
    fetcher<{ feat?: Feat5e[] }>('feats.json'),
  ]);

  const races = mergeRacesAndSubraces(racesJson?.race || [], racesJson?.subrace || []);
  const backgrounds = resolveCopyEntries(backgroundsJson?.background || []);
  const feats = resolveCopyEntries(featsJson?.feat || []);
  completed += 2;

  report('Equipment & Magic Items', ++completed, totalSteps, 'Loading items-base, items, and magicvariants...');
  const [itemsBaseJson, itemsJson, magicVariantsJson] = await Promise.all([
    fetcher<{
      baseitem?: Item5e[];
      itemMastery?: ItemMastery5e[];
      itemProperty?: ItemProperty5e[];
      itemType?: ItemType5e[];
    }>('items-base.json'),
    fetcher<{ item?: Item5e[]; itemGroup?: Item5e[] }>('items.json'),
    fetcher<{ magicvariant?: MagicVariant5e[] }>('magicvariants.json', true),
  ]);

  const items = mergeBaseItemsAndVariants(
    itemsBaseJson?.baseitem || [],
    [...(itemsJson?.item || []), ...(itemsJson?.itemGroup || [])],
    magicVariantsJson?.magicvariant || [],
  );
  completed += 2;

  report('Features & Core Rules', ++completed, totalSteps, 'Loading optional features, skills, languages, actions & conditions...');
  const [
    optFeaturesJson,
    charOptionsJson,
    skillsJson,
    languagesJson,
    sensesJson,
    conditionsJson,
    actionsJson,
    variantRulesJson,
  ] = await Promise.all([
    fetcher<{ optionalfeature?: OptionalFeature5e[] }>('optionalfeatures.json', true),
    fetcher<{ charcreationoption?: CharCreationOption5e[] }>('charcreationoptions.json', true),
    fetcher<{ skill?: Skill5e[] }>('skills.json'),
    fetcher<{ language?: Language5e[] }>('languages.json'),
    fetcher<{ sense?: Sense5e[] }>('senses.json', true),
    fetcher<{ condition?: Condition5e[] }>('conditionsdiseases.json', true),
    fetcher<{ action?: Action5e[] }>('actions.json', true),
    fetcher<{ variantrule?: VariantRule5e[] }>('variantrules.json', true),
  ]);

  const resolvedSubclasses = resolveCopyEntries(subclasses);
  const optionalFeatures = optFeaturesJson?.optionalfeature || [];
  const charCreationOptions = charOptionsJson?.charcreationoption || [];
  const skills = skillsJson?.skill || [];
  const languages = languagesJson?.language || [];
  const senses = sensesJson?.sense || [];
  const conditions = conditionsJson?.condition || [];
  const actions = actionsJson?.action || [];
  const variantRules = variantRulesJson?.variantrule || [];

  report('Finalizing', totalSteps, totalSteps, 'Indexing compendium in local storage...');

  return {
    meta: {
      sourceUrl,
      importedAt: new Date().toISOString(),
      version: 1,
      counts: {
        books: booksJson.book.length,
        classes: classes.length,
        subclasses: resolvedSubclasses.length,
        races: races.length,
        backgrounds: backgrounds.length,
        feats: feats.length,
        spells: spells.length,
        items: items.length,
        optionalFeatures: optionalFeatures.length,
        conditions: conditions.length,
        actions: actions.length,
        skills: skills.length,
        languages: languages.length,
      },
    },
    books: booksJson.book,
    classes,
    classFluff,
    subclasses: resolvedSubclasses,
    classFeatures,
    subclassFeatures,
    races,
    backgrounds,
    feats,
    spells,
    items,
    optionalFeatures,
    charCreationOptions,
    skills,
    languages,
    senses,
    conditions,
    actions,
    variantRules,
    itemMasteries: itemsBaseJson?.itemMastery || [],
    itemProperties: itemsBaseJson?.itemProperty || [],
    itemTypes: itemsBaseJson?.itemType || [],
  };
}

export async function importFromUrl(
  rawUrl: string,
  onProgress?: (progress: ImportProgress) => void,
): Promise<CompiledCompendium> {
  const baseUrl = normalizeFiveToolsDataUrl(rawUrl);

  const fetcher: JsonFetcher = async <T = Record<string, unknown>>(relativePath: string, optional = false) => {
    const url = `${baseUrl}/${relativePath}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (optional) return null;
      throw new Error(`Failed to fetch ${relativePath} (HTTP ${res.status})`);
    }
    return (await res.json()) as T;
  };

  return compileCompendium(rawUrl.trim(), fetcher, onProgress);
}

export async function importFromLocalFiles(
  files: FileList,
  onProgress?: (progress: ImportProgress) => void,
): Promise<CompiledCompendium> {
  const lookup = new Map<string, File>();
  for (const file of Array.from(files)) {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const normalized = rel.replace(/\\/g, '/');
    const dataMarker = normalized.lastIndexOf('/data/');
    const key = dataMarker !== -1 ? normalized.slice(dataMarker + 6) : normalized.replace(/^[^/]+\//, '');
    lookup.set(key.toLowerCase(), file);
    lookup.set(file.name.toLowerCase(), file);
  }

  const fetcher: JsonFetcher = async <T = Record<string, unknown>>(relativePath: string, optional = false) => {
    const exact = lookup.get(relativePath.toLowerCase());
    const fileNameOnly = lookup.get(relativePath.split('/').pop()!.toLowerCase());
    const target = exact || fileNameOnly;
    if (!target) {
      if (optional) return null;
      throw new Error(`Missing required file in uploaded folder: ${relativePath}`);
    }
    const text = await target.text();
    return JSON.parse(text) as T;
  };

  return compileCompendium('local-upload://data', fetcher, onProgress);
}
