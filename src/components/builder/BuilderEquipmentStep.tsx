import { useMemo, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Item5e } from '../../types/5etools';
import type { Character, CharacterInventoryItem } from '../../types/character';
import {
  computeCharacter,
  findBackground,
  findClass,
  findItem,
  makeEntityKey,
} from '../../engine/rules';
import {
  extractOptionTypeSlots,
  getItemSubtitle,
  getOptionPackSummaries,
  parseClassStartingEquipment,
  parseStartingEquipmentBlocks,
  resolveStartingEquipmentAdditions,
  type EquipmentTypeSlot,
  type StartingEquipmentChoiceGroup,
} from '../../services/equipmentHelpers';
import { CollapsibleBox } from '../CollapsibleBox';
import { AddItemsCatalog } from '../equipment/AddItemsCatalog';

const CURRENCY_DENOMS: { key: 'pp' | 'gp' | 'ep' | 'sp' | 'cp'; label: string; gpRate: number }[] = [
  { key: 'pp', label: 'PP', gpRate: 10 },
  { key: 'gp', label: 'GP', gpRate: 1 },
  { key: 'ep', label: 'EP', gpRate: 0.5 },
  { key: 'sp', label: 'SP', gpRate: 0.1 },
  { key: 'cp', label: 'CP', gpRate: 0.01 },
];

function StartingEquipmentGroupCard({
  title,
  groups,
  pendingSelections,
  subChoices,
  onToggleOption,
  onSelectSubChoice,
  compendium,
  enabledSources,
  ruleset,
}: {
  title: string;
  groups: StartingEquipmentChoiceGroup[];
  pendingSelections: Record<string, string>;
  subChoices: Record<string, string>;
  onToggleOption: (groupId: string, optionKey: string, slots: EquipmentTypeSlot[]) => void;
  onSelectSubChoice: (slotKey: string, value: string) => void;
  compendium: NonNullable<ReturnType<typeof useApp>['compendium']>;
  enabledSources: string[];
  ruleset: Character['preferences']['ruleset'];
}) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <h3 className="text-base font-normal text-[var(--text-primary)]">{title}</h3>
      <div className="space-y-3">
        {groups.map((group) => (
          <div
            key={group.groupId}
            className="rounded-[2px] border border-[#383a3f] bg-[#121316]"
          >
            {group.options.map((opt, optIdx) => {
              const isSelected = pendingSelections[group.groupId] === opt.key;
              const slots = extractOptionTypeSlots(
                group.groupId,
                opt.key,
                opt.tokens,
                compendium,
                enabledSources,
                ruleset,
              );
              const packSummaries = isSelected ? getOptionPackSummaries(opt.tokens, compendium) : [];
              const optHeading = group.isFixedInclude
                ? `Included: ${opt.label}`
                : `(${opt.key}) ${opt.label}`;

              return (
                <div key={opt.key}>
                  {optIdx > 0 && (
                    <div className="relative mx-4 my-0.5 flex items-center">
                      <div className="w-full border-t border-dotted border-[#4b4f58]" />
                      <span className="absolute left-3 bg-[#121316] px-1.5 text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)]">
                        OR
                      </span>
                    </div>
                  )}

                  <div className="px-4 py-3.5">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => onToggleOption(group.groupId, opt.key, slots)}
                      className="w-full flex items-start gap-3 text-left cursor-pointer group"
                    >
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-[3px] border flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-[#1f8b4d] border-[#26a65b] text-white'
                            : 'bg-[#101114] border-[#6b7280] group-hover:border-[#9ca3af]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>
                      <span
                        className={`text-sm leading-snug ${
                          isSelected ? 'font-bold text-[#f3f4f6]' : 'text-[#d1d5db]'
                        }`}
                      >
                        {optHeading}
                      </span>
                    </button>

                    {isSelected && (slots.length > 0 || packSummaries.length > 0) && (
                      <div className="mt-3 pl-8 space-y-2.5">
                        {slots.map((slot) => {
                          const currentVal = subChoices[slot.slotKey] || slot.defaultKey;
                          return (
                            <div key={slot.slotKey}>
                              <select
                                aria-label={`${title} ${slot.label}`}
                                value={currentVal}
                                onChange={(e) => onSelectSubChoice(slot.slotKey, e.target.value)}
                                className="w-full max-w-md px-3 py-2 rounded-[2px] bg-[#121316] border border-[#565a64] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5dbbf7]"
                              >
                                {slot.candidates.length === 0 ? (
                                  <option value="">No matching items available</option>
                                ) : (
                                  slot.candidates.map((cand) => {
                                    const k = makeEntityKey(cand.name, cand.source);
                                    return (
                                      <option key={k} value={k}>
                                        {cand.name}
                                      </option>
                                    );
                                  })
                                )}
                              </select>
                            </div>
                          );
                        })}

                        {packSummaries.length > 0 && (
                          <div className="border-t border-[#2d3036] pt-2.5 space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                            {packSummaries.map((pack) => (
                              <p key={pack.packName}>{pack.sentence}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BuilderEquipmentStep({
  character,
  onChange,
}: {
  character: Character;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const { compendium } = useApp();

  const [startingOpen, setStartingOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [addItemsOpen, setAddItemsOpen] = useState(false);

  // Pending selections inside Starting Equipment (never committed until ADD STARTING EQUIPMENT is clicked)
  const [pendingSelections, setPendingSelections] = useState<Record<string, string>>({});
  const [subChoices, setSubChoices] = useState<Record<string, string>>({});
  const [startingStatusMsg, setStartingStatusMsg] = useState<string | null>(null);

  const primaryClass = compendium && character.classes[0]
    ? findClass(compendium, character.classes[0].className, character.classes[0].classSource)
    : undefined;
  const background = compendium
    ? findBackground(compendium, character.background.backgroundKey)
    : undefined;

  const computed = useMemo(
    () => (compendium ? computeCharacter(character, compendium) : null),
    [character, compendium],
  );

  const classGroups = useMemo(() => {
    if (!compendium || !primaryClass) return [];
    const keyPrefix = `class:${primaryClass.name}|${primaryClass.source}`;
    return parseClassStartingEquipment(primaryClass.startingEquipment, compendium).map((g, idx) => ({
      ...g,
      groupId: `${keyPrefix}:${idx}`,
    }));
  }, [compendium, primaryClass]);

  const bgGroups = useMemo(() => {
    if (!compendium || !background) return [];
    const keyPrefix = `bg:${background.name}|${background.source}`;
    return parseStartingEquipmentBlocks(background.startingEquipment, 'bg', compendium).map((g, idx) => ({
      ...g,
      groupId: `${keyPrefix}:${idx}`,
    }));
  }, [compendium, background]);

  const allGroups = useMemo(() => [...classGroups, ...bgGroups], [classGroups, bgGroups]);

  const selectedGroupEntries = useMemo(() => {
    const entries: { groupId: string; option: StartingEquipmentChoiceGroup['options'][number] }[] = [];
    for (const g of allGroups) {
      const chosenKey = pendingSelections[g.groupId];
      if (!chosenKey) continue;
      const opt = g.options.find((o) => o.key === chosenKey);
      if (opt) entries.push({ groupId: g.groupId, option: opt });
    }
    return entries;
  }, [allGroups, pendingSelections]);

  if (!compendium || !computed) return null;

  const hasAnyStartingSelected = selectedGroupEntries.length > 0;
  const totalInventoryCount = character.inventory.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalGpRaw = CURRENCY_DENOMS.reduce(
    (sum, d) => sum + (character.currency[d.key] || 0) * d.gpRate,
    0,
  );
  const totalGpDisplay = Math.round(totalGpRaw * 100) / 100;

  const handleToggleOption = (groupId: string, optionKey: string, slots: EquipmentTypeSlot[]) => {
    setStartingStatusMsg(null);
    setPendingSelections((prev) => {
      const next = { ...prev };
      if (next[groupId] === optionKey) {
        delete next[groupId];
      } else {
        next[groupId] = optionKey;
      }
      return next;
    });

    if (slots.length > 0) {
      setSubChoices((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const slot of slots) {
          if (!next[slot.slotKey] && slot.defaultKey) {
            next[slot.slotKey] = slot.defaultKey;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  };

  const handleClearAllStarting = () => {
    setPendingSelections({});
    setSubChoices({});
    setStartingStatusMsg(null);
  };

  const handlePrimaryStartingAction = () => {
    if (!hasAnyStartingSelected) {
      setStartingOpen(false);
      return;
    }

    const { inventoryAdditions, currencyDelta } = resolveStartingEquipmentAdditions(
      selectedGroupEntries,
      subChoices,
      compendium,
      character.preferences.enabledSources,
      character.preferences.ruleset,
    );

    const chosenSummary: Record<string, string> = {};
    for (const entry of selectedGroupEntries) {
      chosenSummary[entry.groupId] = entry.option.key;
    }

    onChange((prev) => ({
      ...prev,
      startingEquipmentChosen: { ...prev.startingEquipmentChosen, ...chosenSummary },
      inventory: [...prev.inventory, ...inventoryAdditions],
      currency: {
        pp: prev.currency.pp + currencyDelta.pp,
        gp: prev.currency.gp + currencyDelta.gp,
        ep: prev.currency.ep + currencyDelta.ep,
        sp: prev.currency.sp + currencyDelta.sp,
        cp: prev.currency.cp + currencyDelta.cp,
      },
    }));

    const itemQtyAdded = inventoryAdditions.reduce((s, x) => s + (x.quantity || 1), 0);
    const gpMsg = currencyDelta.gp > 0 ? ` and ${currencyDelta.gp} GP` : '';
    setStartingStatusMsg(`Added ${itemQtyAdded} item${itemQtyAdded === 1 ? '' : 's'}${gpMsg} to Current Inventory.`);
    setPendingSelections({});
    setSubChoices({});
    setInventoryOpen(true);
  };

  const handleAddCatalogItem = (item: Item5e) => {
    const key = makeEntityKey(item.name, item.source);
    const newEntry: CharacterInventoryItem = {
      instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      itemKey: key,
      name: item.name,
      source: item.source,
      quantity: 1,
      equipped: Boolean(item.weapon || item.armor || item.shield),
      attuned: false,
    };
    onChange((prev) => ({ ...prev, inventory: [...prev.inventory, newEntry] }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-normal text-[var(--text-primary)] tracking-tight">
        Choose Equipment
      </h2>

      {/* 1. Starting Equipment */}
      <CollapsibleBox
        title="Starting Equipment"
        accent="plain"
        open={startingOpen}
        onOpenChange={setStartingOpen}
        bodyClassName="p-4 sm:p-5 border-t border-[var(--border-color)] bg-[#141518] space-y-5"
      >
        {classGroups.length === 0 && bgGroups.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)] py-2">
            Select a class and background first to view their Starting Equipment options, or use{' '}
            <button
              type="button"
              onClick={() => setAddItemsOpen(true)}
              className="text-[#1b9af0] hover:underline font-semibold cursor-pointer"
            >
              Add Items
            </button>{' '}
            below to browse equipment directly.
          </div>
        ) : (
          <>
            {primaryClass && classGroups.length > 0 && (
              <StartingEquipmentGroupCard
                title={`${primaryClass.name} Starting Equipment`}
                groups={classGroups}
                pendingSelections={pendingSelections}
                subChoices={subChoices}
                onToggleOption={handleToggleOption}
                onSelectSubChoice={(slotKey, value) =>
                  setSubChoices((prev) => ({ ...prev, [slotKey]: value }))
                }
                compendium={compendium}
                enabledSources={character.preferences.enabledSources}
                ruleset={character.preferences.ruleset}
              />
            )}

            {background && bgGroups.length > 0 && (
              <StartingEquipmentGroupCard
                title={`${background.name} Starting Equipment`}
                groups={bgGroups}
                pendingSelections={pendingSelections}
                subChoices={subChoices}
                onToggleOption={handleToggleOption}
                onSelectSubChoice={(slotKey, value) =>
                  setSubChoices((prev) => ({ ...prev, [slotKey]: value }))
                }
                compendium={compendium}
                enabledSources={character.preferences.enabledSources}
                ruleset={character.preferences.ruleset}
              />
            )}

            {startingStatusMsg && (
              <div className="rounded-[2px] border border-emerald-700/60 bg-emerald-950/30 px-3 py-2 text-xs font-medium text-emerald-200">
                {startingStatusMsg}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
              <button
                type="button"
                onClick={handlePrimaryStartingAction}
                className={`px-6 py-2.5 rounded-[3px] text-[11px] font-bold uppercase tracking-wider border transition cursor-pointer shadow-sm ${
                  hasAnyStartingSelected
                    ? 'bg-gradient-to-b from-[#3f444e] to-[#282b32] border-[#6b7280] text-white hover:from-[#4b515c] hover:to-[#32363e]'
                    : 'bg-gradient-to-b from-[#343840] to-[#23262c] border-[#4b5563] text-[#f3f4f6] hover:from-[#3f444e] hover:to-[#2a2e36]'
                }`}
              >
                {hasAnyStartingSelected ? 'ADD STARTING EQUIPMENT' : 'SKIP STARTING EQUIPMENT'}
              </button>

              <button
                type="button"
                onClick={handleClearAllStarting}
                className="text-sm font-medium text-[#1b9af0] hover:text-[#4eb4fa] hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </>
        )}
      </CollapsibleBox>

      {/* 2. Current Inventory */}
      <CollapsibleBox
        title={`Current Inventory (${totalInventoryCount})`}
        accent="plain"
        open={inventoryOpen}
        onOpenChange={setInventoryOpen}
        headerRight={
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Total Weight: <strong className="font-mono-num">{computed.carrying.totalWeight} lb</strong>
          </span>
        }
        bodyClassName="p-4 border-t border-[var(--border-color)] bg-[#141518]"
      >
        {character.inventory.length === 0 ? (
          <div className="text-xs text-[var(--text-muted)] py-2">
            Your inventory is currently empty. Select Starting Equipment above or add items below.
          </div>
        ) : (
          <div className="space-y-1.5">
            {character.inventory.map((inv) => {
              const itemDef = inv.isCustom ? undefined : findItem(compendium, inv.itemKey);
              const unitWeight = itemDef?.weight ?? 0;
              return (
                <div
                  key={inv.instanceId}
                  className="px-3 py-2 rounded-[2px] border border-[var(--border-color)] bg-[#191b1f] flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[var(--text-primary)] truncate">
                      {inv.name}
                      {(inv.quantity || 1) > 1 && (
                        <span className="ml-1.5 text-[var(--text-muted)] font-mono-num">
                          x{inv.quantity}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {itemDef ? getItemSubtitle(itemDef) : 'Custom Item'}
                      {unitWeight > 0 && ` • ${Math.round(unitWeight * (inv.quantity || 1) * 10) / 10} lb`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          inventory: p.inventory
                            .map((x) =>
                              x.instanceId === inv.instanceId
                                ? { ...x, quantity: x.quantity - 1 }
                                : x,
                            )
                            .filter((x) => x.quantity > 0),
                        }))
                      }
                      aria-label={`Decrease quantity of ${inv.name}`}
                      className="w-6 h-6 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-primary)] font-bold hover:border-[#5dbbf7] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono-num text-[var(--text-primary)]">
                      {inv.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          inventory: p.inventory.map((x) =>
                            x.instanceId === inv.instanceId
                              ? { ...x, quantity: x.quantity + 1 }
                              : x,
                          ),
                        }))
                      }
                      aria-label={`Increase quantity of ${inv.name}`}
                      className="w-6 h-6 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-primary)] font-bold hover:border-[#5dbbf7] cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          inventory: p.inventory.map((x) =>
                            x.instanceId === inv.instanceId ? { ...x, equipped: !x.equipped } : x,
                          ),
                        }))
                      }
                      className={`px-2 py-1 rounded-[2px] border text-[10px] font-bold uppercase cursor-pointer transition ${
                        inv.equipped
                          ? 'bg-[#1f8b4d]/25 border-[#26a65b] text-[#7ed38e]'
                          : 'bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {inv.equipped ? 'Equipped' : 'Equip'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          inventory: p.inventory.filter((x) => x.instanceId !== inv.instanceId),
                        }))
                      }
                      aria-label={`Remove ${inv.name}`}
                      className="p-1 text-red-400 hover:bg-red-900/30 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleBox>

      {/* 3. Other Possessions */}
      <CollapsibleBox
        title="Other Possessions"
        accent="plain"
        bodyClassName="p-4 border-t border-[var(--border-color)] bg-[#141518]"
      >
        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
          Non-standard possessions, trinkets, mounts, or property notes
        </label>
        <textarea
          value={character.otherPossessions ?? ''}
          onChange={(e) =>
            onChange((p) => ({
              ...p,
              otherPossessions: e.target.value,
            }))
          }
          rows={3}
          placeholder="List any additional possessions, deeds, favors, or custom items..."
          className="w-full px-3 py-2 rounded-[2px] bg-[#101114] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#5dbbf7]"
        />
      </CollapsibleBox>

      {/* 4. Add Items (Shared Filterable Catalog) */}
      <CollapsibleBox
        title="Add Items"
        accent="plain"
        open={addItemsOpen}
        onOpenChange={setAddItemsOpen}
        bodyClassName="p-4 border-t border-[var(--border-color)] bg-[#141518]"
      >
        <AddItemsCatalog
          character={character}
          computed={computed}
          onAddItem={handleAddCatalogItem}
          variant="builder"
        />
      </CollapsibleBox>

      {/* 5. Currency */}
      <CollapsibleBox
        title="Currency"
        accent="plain"
        headerRight={
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Total in GP: <strong className="font-mono-num">{totalGpDisplay}</strong>
          </span>
        }
        bodyClassName="p-4 border-t border-[var(--border-color)] bg-[#141518]"
      >
        <div className="grid grid-cols-5 gap-2">
          {CURRENCY_DENOMS.map((denom) => (
            <div key={denom.key}>
              <label className="block text-[10px] font-bold uppercase text-center text-[var(--text-muted)] mb-1">
                {denom.label}
              </label>
              <input
                type="number"
                min={0}
                aria-label={`${denom.label} coins`}
                value={character.currency[denom.key]}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  onChange((p) => ({
                    ...p,
                    currency: { ...p.currency, [denom.key]: val },
                  }));
                }}
                className="w-full px-2 py-1.5 rounded-[2px] bg-[#101114] border border-[var(--border-strong)] text-center text-sm font-bold font-mono-num text-[var(--text-primary)] focus:outline-none focus:border-[#5dbbf7]"
              />
            </div>
          ))}
        </div>
      </CollapsibleBox>
    </div>
  );
}
