import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getClassExpertiseTiers, splitEntityKey } from '../../engine/rules';
import type { EntryNode } from '../../types/5etools';
import type { Character, CharacterClassSelection, ComputedCharacter, ComputedFeatureEntry } from '../../types/character';
import { RichEntries } from '../RichEntries';

type FeatureSubFilter = 'all' | 'class' | 'species' | 'feats';

const FILTER_TABS: { id: FeatureSubFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'class', label: 'Class Features' },
  { id: 'species', label: 'Species Traits' },
  { id: 'feats', label: 'Feats' },
];

function isMagicRuleFeature(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return lower === 'pact magic' || lower === 'spellcasting' || lower === 'innate spellcasting';
}

function getConciseEntries(entries: unknown[]): EntryNode[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const firstText = entries.find((e) => typeof e === 'string');
  if (firstText) return [firstText as EntryNode];
  return [entries[0] as EntryNode];
}

function FeatureSourceMeta({ feature }: { feature: ComputedFeatureEntry }) {
  const parts: string[] = [];
  if (feature.source) parts.push(feature.source);
  if (feature.page) parts.push(`pg. ${feature.page}`);
  if (parts.length === 0) return null;
  return (
    <span className="text-[11px] italic font-normal text-[#9ca3af] ml-1.5">
      · {parts.join(', ')}
    </span>
  );
}

export function SheetFeaturesTab({
  character,
  computed,
}: {
  character: Character;
  computed: ComputedCharacter;
}) {
  const { openDrawer } = useApp();
  const [filter, setFilter] = useState<FeatureSubFilter>('all');

  const classAndSubclassFeatures = computed.features.filter(
    (f) => f.category === 'class' || f.category === 'subclass',
  );
  const optionalFeatures = computed.features.filter((f) => f.category === 'optional');
  const speciesTraits = computed.features.filter((f) => f.category === 'species');
  const featAndBgFeatures = computed.features.filter(
    (f) => f.category === 'feat' || f.category === 'background',
  );

  // Track which optional features get nested cleanly under their parent class feature
  const nestedOptIds = new Set<string>();
  const getNestedOptionals = (parentFeatureName: string) => {
    const matches = optionalFeatures.filter(
      (opt) => opt.parentFeatureName?.toLowerCase() === parentFeatureName.toLowerCase(),
    );
    matches.forEach((m) => nestedOptIds.add(m.id));
    return matches;
  };

  const openFeatureModal = (f: ComputedFeatureEntry) =>
    openDrawer({
      title: f.name,
      subtitle: f.sourceLabel,
      source: f.source,
      page: f.page,
      entries: f.entries as EntryNode[],
    });

  const getOptionalChoiceNote = (clsSel: CharacterClassSelection | undefined, optName: string): string | undefined => {
    if (!clsSel) return undefined;
    const notes: string[] = [];
    for (const [optGroupKey, optKeys] of Object.entries(clsSel.chosenOptionalFeatures || {})) {
      optKeys.forEach((optK, idx) => {
        if (splitEntityKey(optK).name.toLowerCase() !== optName.toLowerCase()) return;
        const sub = clsSel.chosenOptionalFeatureSubChoices?.[`${optGroupKey}:${idx}`];
        if (sub?.featKey) notes.push(`Origin Feat: ${splitEntityKey(sub.featKey).name}`);
        if (sub?.cantripKey) notes.push(`Selected Cantrip: ${splitEntityKey(sub.cantripKey).name}`);
        if (sub?.spellKeys?.length) {
          const names = sub.spellKeys.filter(Boolean).map((k) => splitEntityKey(k).name);
          if (names.length > 0) notes.push(`Book Spells: ${names.join(', ')}`);
        }
      });
    }
    return notes.length > 0 ? notes.join(' · ') : undefined;
  };

  const getFeatureSubgroupItems = (
    clsSel: CharacterClassSelection | undefined,
    f: ComputedFeatureEntry,
  ): { title?: string; body?: string; entries?: unknown[] }[] => {
    if (!clsSel) return [];
    const key = `${f.name}-${f.level || 1}`;
    const items: { title?: string; body?: string; entries?: unknown[] }[] = [];
    const optVal = clsSel.chosenClassFeatureOptions?.[key];
    if (optVal) items.push({ body: `Selected Option: ${splitEntityKey(optVal).name}` });
    const sk = clsSel.chosenClassFeatureSkills?.[key] || [];
    const tl = clsSel.chosenClassFeatureTools?.[key] || [];
    const lg = clsSel.chosenClassFeatureLanguages?.[key] || [];
    const sp = (clsSel.chosenClassFeatureSpells?.[key] || []).filter(Boolean);
    if (sk.length > 0) items.push({ body: `Skills: ${sk.join(', ')}` });
    if (tl.length > 0) items.push({ body: `Tools: ${tl.join(', ')}` });
    if (lg.length > 0) items.push({ body: `Languages: ${lg.join(', ')}` });
    if (sp.length > 0) items.push({ body: `Selected Spells: ${sp.map((k) => splitEntityKey(k).name).join(', ')}` });

    const fLower = f.name.toLowerCase();
    if (fLower.includes('fighting style')) {
      const fpKey = fLower === 'additional fighting style' ? 'fp-Additional Fighting Style' : 'fp-Fighting Style';
      for (const fk of clsSel.chosenFeatProgressions?.[fpKey] || []) {
        items.push({ body: `Chosen Style: ${splitEntityKey(fk).name}` });
      }
    }
    if (fLower.includes('weapon mastery') && clsSel.chosenWeaponMasteries.length > 0) {
      items.push({
        body: `Masteries: ${clsSel.chosenWeaponMasteries.map((k) => splitEntityKey(k).name).join(', ')}`,
      });
    }
    const clsExpTier = getClassExpertiseTiers(
      { name: clsSel.className, edition: f.source === 'XPHB' ? 'one' : 'classic' } as never,
      clsSel.level,
    ).find((t) => t.unlockLevel === (f.level || 1) && fLower.includes(t.featureName.toLowerCase()));
    if (clsExpTier) {
      const slice = clsSel.expertiseSkills.slice(clsExpTier.offset, clsExpTier.offset + clsExpTier.count).filter(Boolean);
      if (slice.length > 0) items.push({ body: `Expertise: ${slice.join(', ')}` });
    }
    return items;
  };
  // Render helper for left-bar subgroup entries
  const renderSubgroup = (items: { title?: string; body?: string; entries?: unknown[] }[]) => {
    if (items.length === 0) return null;
    return (
      <div className="border-l-2 border-[#7f292e] pl-3 mt-2 space-y-2.5 text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-1">
            {item.title && <div className="font-bold text-white">{item.title}</div>}
            {item.body && <div className="text-[#d1d5db]">{item.body}</div>}
            {item.entries && item.entries.length > 0 && (
              <div className="text-[#d1d5db] leading-relaxed">
                <RichEntries entries={item.entries as EntryNode[]} contextTitle={item.title} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const classTitleLine =
    character.classes.length > 0
      ? character.classes.map((c) => `${c.className} Features`).join(' / ')
      : 'Class Features';

  return (
    <div className="space-y-3">
      {/* Sub-filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`px-2.5 py-1 rounded-[3px] text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition ${
              filter === t.id
                ? 'bg-[#7f292e] border-[#a8464c] text-white'
                : 'bg-[#191c22] border-white/15 text-[#b4bcc6] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable Features & Traits List */}
      <div className="max-h-[580px] overflow-y-auto pr-2 space-y-6">
        {/* CLASS FEATURES SECTION */}
        {(filter === 'all' || filter === 'class') && (
          <section className="space-y-3.5">
            <div className="border-b border-white/15 pb-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#c96f74]">
                Class Features
              </div>
            </div>

            {classAndSubclassFeatures.length === 0 && optionalFeatures.length === 0 ? (
              <div className="text-xs text-[#9ca3af]">No class features selected yet.</div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#c96f74]">{classTitleLine}</h3>

                {classAndSubclassFeatures.map((f) => {
                  const isMagicRule = isMagicRuleFeature(f.name);
                  const isCoreTraits = /^Core .* Traits$/i.test(f.name);
                  const nestedOptionals = getNestedOptionals(f.name);

                  // Magic trait: ONLY header name + source/page, opens side drawer on click
                  if (isMagicRule) {
                    return (
                      <div key={f.id}>
                        <button
                          type="button"
                          onClick={() => openFeatureModal(f)}
                          className="inline-flex items-center text-left group cursor-pointer"
                        >
                          <span className="font-bold text-xs text-white group-hover:underline">
                            {f.name}
                          </span>
                          <FeatureSourceMeta feature={f} />
                          <ChevronRight className="w-3.5 h-3.5 ml-1 text-[#9ca3af] group-hover:text-white" />
                        </button>
                      </div>
                    );
                  }

                  // Core Class Traits: concise header + chosen skills/tools subgroup
                  if (isCoreTraits) {
                    const clsSel = character.classes.find((c) => f.sourceLabel.toLowerCase().startsWith(c.className.toLowerCase()));
                    const chosenItems = [
                      ...(clsSel?.chosenSkills || []),
                      ...(clsSel?.chosenTools || []),
                    ];
                    return (
                      <div key={f.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => openFeatureModal(f)}
                          className="text-left group cursor-pointer"
                        >
                          <span className="font-bold text-xs text-white group-hover:underline">
                            {f.name}
                          </span>
                          <FeatureSourceMeta feature={f} />
                        </button>
                        {chosenItems.length > 0 &&
                          renderSubgroup(chosenItems.map((name) => ({ body: name })))}
                      </div>
                    );
                  }

                  // Parent of Optional Features (e.g. Eldritch Invocations, Metamagic, Combat Superiority): short description + chosen items subgroup
                  const clsSelForFeature = character.classes.find(
                    (c) =>
                      f.sourceLabel.toLowerCase().startsWith(c.className.toLowerCase()) ||
                      (c.subclassName && f.sourceLabel.toLowerCase().startsWith(c.subclassName.toLowerCase())),
                  );
                  if (nestedOptionals.length > 0 || /^eldritch invocations?$/i.test(f.name)) {
                    return (
                      <div key={f.id} className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => openFeatureModal(f)}
                          className="text-left group cursor-pointer"
                        >
                          <span className="font-bold text-xs text-white group-hover:underline">
                            {f.name}
                          </span>
                          <FeatureSourceMeta feature={f} />
                        </button>
                        <div className="text-xs text-[#d1d5db] leading-relaxed">
                          <RichEntries entries={getConciseEntries(f.entries)} contextTitle={f.name} />
                        </div>
                        {renderSubgroup(
                          nestedOptionals.map((opt) => ({
                            title: opt.name,
                            body: getOptionalChoiceNote(clsSelForFeature, opt.name),
                            entries: opt.entries,
                          })),
                        )}
                      </div>
                    );
                  }

                  // Standard Class / Subclass Feature + Any Selected Options Subgroup
                  const featureSubItems = getFeatureSubgroupItems(clsSelForFeature, f);
                  return (
                    <div key={f.id} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => openFeatureModal(f)}
                        className="text-left group cursor-pointer"
                      >
                        <span className="font-bold text-xs text-white group-hover:underline">
                          {f.name}
                        </span>
                        <FeatureSourceMeta feature={f} />
                      </button>
                      <div className="text-xs text-[#d1d5db] leading-relaxed">
                        <RichEntries entries={f.entries as EntryNode[]} contextTitle={f.name} />
                      </div>
                      {renderSubgroup(featureSubItems)}
                    </div>
                  );
                })}

                {/* Any chosen optional features without a matching class parent header */}
                {optionalFeatures
                  .filter((opt) => !nestedOptIds.has(opt.id))
                  .map((opt) => (
                    <div key={opt.id} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => openFeatureModal(opt)}
                        className="text-left group cursor-pointer"
                      >
                        <span className="font-bold text-xs text-white group-hover:underline">
                          {opt.name}
                        </span>
                        <FeatureSourceMeta feature={opt} />
                      </button>
                      <div className="text-xs text-[#d1d5db] leading-relaxed">
                        <RichEntries entries={opt.entries as EntryNode[]} contextTitle={opt.name} />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* SPECIES TRAITS SECTION */}
        {(filter === 'all' || filter === 'species') && (
          <section className="space-y-3.5">
            <div className="border-b border-white/15 pb-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#c96f74]">
                Species Traits
              </div>
            </div>

            {speciesTraits.length === 0 ? (
              <div className="text-xs text-[#9ca3af]">No species traits selected yet.</div>
            ) : (
              <div className="space-y-3.5">
                {speciesTraits.map((f) => {
                  const subItems: { title?: string; body?: string }[] = [];
                  if (/^size$/i.test(f.name) && character.description.size) {
                    subItems.push({ body: character.description.size });
                  }
                  if ((/^skillful$/i.test(f.name) || /keen senses/i.test(f.name)) && character.race.chosenSkills.length > 0) {
                    character.race.chosenSkills.forEach((sk) => subItems.push({ body: sk }));
                  }
                  if (/^versatile$/i.test(f.name) && character.race.originFeatKey) {
                    subItems.push({ body: splitEntityKey(character.race.originFeatKey).name });
                  }
                  if (/(lineage|ancestry|fire|legacy)/i.test(f.name) && (character.race.lineageChoice || character.race.chosenInnateCantrip)) {
                    if (character.race.lineageChoice) subItems.push({ body: character.race.lineageChoice });
                    if (character.race.chosenInnateCantrip) {
                      subItems.push({ body: splitEntityKey(character.race.chosenInnateCantrip).name });
                    }
                  }

                  return (
                    <div key={f.id} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => openFeatureModal(f)}
                        className="text-left group cursor-pointer"
                      >
                        <span className="font-bold text-xs text-white group-hover:underline">
                          {f.name}
                        </span>
                        <FeatureSourceMeta feature={f} />
                      </button>
                      <div className="text-xs text-[#d1d5db] leading-relaxed">
                        <RichEntries entries={f.entries as EntryNode[]} contextTitle={f.name} />
                      </div>
                      {renderSubgroup(subItems)}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* FEATS & BACKGROUND SECTION */}
        {(filter === 'all' || filter === 'feats') && (
          <section className="space-y-3.5">
            <div className="border-b border-white/15 pb-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#c96f74]">
                Feats
              </div>
            </div>

            {featAndBgFeatures.length === 0 ? (
              <div className="text-xs text-[#9ca3af]">No feats or background traits selected yet.</div>
            ) : (
              <div className="space-y-3.5">
                {featAndBgFeatures.map((f) => {
                  if (isMagicRuleFeature(f.name)) {
                    return (
                      <div key={f.id}>
                        <button
                          type="button"
                          onClick={() => openFeatureModal(f)}
                          className="inline-flex items-center text-left group cursor-pointer"
                        >
                          <span className="font-bold text-xs text-white group-hover:underline">
                            {f.name}
                          </span>
                          <FeatureSourceMeta feature={f} />
                          <ChevronRight className="w-3.5 h-3.5 ml-1 text-[#9ca3af] group-hover:text-white" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={f.id} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => openFeatureModal(f)}
                        className="text-left group cursor-pointer"
                      >
                        <span className="font-bold text-xs text-white group-hover:underline">
                          {f.name}
                        </span>
                        <FeatureSourceMeta feature={f} />
                      </button>
                      <div className="text-xs text-[#d1d5db] leading-relaxed">
                        <RichEntries entries={f.entries as EntryNode[]} contextTitle={f.name} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
