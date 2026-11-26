import { useState } from 'react';
import { PackageOpen, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Character, ComputedCharacter } from '../../types/character';
import { findItem, makeEntityKey } from '../../engine/rules';
import { SheetEquipmentDrawer } from './SheetEquipmentDrawer';

export function SheetInventoryTab({
  character,
  computed,
  onChange,
}: {
  character: Character;
  computed: ComputedCharacter;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const { compendium, openReferenceByTag } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [invSearch, setInvSearch] = useState('');

  if (!compendium) return null;

  const q = invSearch.trim().toLowerCase();
  const visibleInventory = character.inventory.filter(
    (inv) => !q || inv.name.toLowerCase().includes(q) || (inv.notes || '').toLowerCase().includes(q),
  );

  const weightPct = Math.min(100, Math.round((computed.carrying.totalWeight / Math.max(1, computed.carrying.capacity)) * 100));

  const unpackItem = (instanceId: string, itemKey: string) => {
    const it = findItem(compendium, itemKey);
    if (!it?.packContents) return;
    const unpacked = it.packContents
      .map((entry) => {
        const key = typeof entry === 'string' ? entry : entry.item;
        const qty = typeof entry === 'object' ? entry.quantity || 1 : 1;
        if (!key) return null;
        const target = findItem(compendium, key);
        if (!target) return null;
        return {
          instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          itemKey: makeEntityKey(target.name, target.source),
          name: target.name,
          source: target.source,
          quantity: qty,
          equipped: false,
          attuned: false,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    onChange((p) => ({
      ...p,
      inventory: [...p.inventory.filter((x) => x.instanceId !== instanceId), ...unpacked],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Weight, Attunement, Currency Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-[var(--bg-card-alt)] border border-[var(--border-color)] space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span>Weight Carried</span>
            <span className="font-mono-num">
              {computed.carrying.totalWeight} / {computed.carrying.capacity} lb.
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden">
            <div
              className={`h-full transition-all ${
                computed.carrying.status === 'over-capacity'
                  ? 'bg-[#8f3439]'
                  : computed.carrying.status !== 'normal'
                    ? 'bg-[#8c6b36]'
                    : 'bg-[#4f7c60]'
              }`}
              style={{ width: `${weightPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
            <span>Status: {computed.carrying.status}</span>
            <span>
              Attunement: <strong className="font-mono-num">{computed.attunement.used}</strong> / {computed.attunement.max}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[var(--bg-card-alt)] border border-[var(--border-color)] grid grid-cols-5 gap-1.5">
          {(['pp', 'gp', 'ep', 'sp', 'cp'] as const).map((coin) => (
            <div key={coin}>
              <div className="text-[10px] font-bold uppercase text-center text-[var(--text-muted)]">{coin}</div>
              <input
                type="number"
                min={0}
                value={character.currency[coin]}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    currency: { ...p.currency, [coin]: Math.max(0, parseInt(e.target.value, 10) || 0) },
                  }))
                }
                className="w-full px-1 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-color)] font-mono-num text-xs text-center font-bold"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Filter & Equipment Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={invSearch}
            onChange={(e) => setInvSearch(e.target.value)}
            placeholder="Search Item Names, Types, Rarities, or Tags"
            className="w-full pl-8 pr-3 py-1.5 rounded-[3px] bg-[#0e1014] border border-white/15 text-xs text-white placeholder:text-[#7c848e] focus:outline-none focus:border-white/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="px-3 py-1.5 rounded-[3px] bg-[#2a191b] hover:bg-[#382124] border border-[#8c3439] text-white text-xs font-bold uppercase flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Equipment
        </button>
      </div>

      {/* Inventory Rows */}
      <div className="divide-y divide-white/[0.08] rounded-[4px] border border-white/15 overflow-hidden">
        {visibleInventory.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#9ca3af]">
            {character.inventory.length === 0
              ? 'Your backpack is empty. Click + Add Equipment to add items.'
              : 'No carried items match your search.'}
          </div>
        ) : (
          visibleInventory.map((inv) => {
            const itemObj = findItem(compendium, inv.itemKey);
            const hasPack = Boolean(itemObj?.packContents?.length);
            const canAttune = Boolean(itemObj?.reqAttune);

            return (
              <div
                key={inv.instanceId}
                className="px-3 py-2.5 bg-[var(--bg-card-alt)] flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => openReferenceByTag('item', inv.name, inv.source)}
                    className="font-bold hover:text-[var(--accent)] text-left cursor-pointer truncate block"
                  >
                    {inv.name}
                  </button>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    {itemObj?.weight ? `${itemObj.weight * inv.quantity} lb.` : '0 lb.'}
                    {itemObj?.rarity && itemObj.rarity !== 'none' ? ` · ${itemObj.rarity}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onChange((p) => ({
                        ...p,
                        inventory: p.inventory.map((x) =>
                          x.instanceId === inv.instanceId ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x,
                        ),
                      }))
                    }
                    className="w-5 h-5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono-num w-5 text-center font-bold">{inv.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange((p) => ({
                        ...p,
                        inventory: p.inventory.map((x) =>
                          x.instanceId === inv.instanceId ? { ...x, quantity: x.quantity + 1 } : x,
                        ),
                      }))
                    }
                    className="w-5 h-5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-bold cursor-pointer"
                  >
                    +
                  </button>

                  {hasPack && (
                    <button
                      type="button"
                      onClick={() => unpackItem(inv.instanceId, inv.itemKey)}
                      className="px-2 py-0.5 rounded-[3px] bg-white/[0.06] text-[#e5e7eb] border border-white/20 text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:border-white/40"
                      title="Unpack contents into inventory"
                    >
                      <PackageOpen className="w-3 h-3" /> Unpack
                    </button>
                  )}

                  {canAttune && (
                    <button
                      type="button"
                      onClick={() =>
                        onChange((p) => ({
                          ...p,
                          inventory: p.inventory.map((x) =>
                            x.instanceId === inv.instanceId ? { ...x, attuned: !x.attuned } : x,
                          ),
                        }))
                      }
                      className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold cursor-pointer border ${
                        inv.attuned
                          ? 'bg-[#2e283b] border-[#7b6da3] text-white'
                          : 'bg-white/[0.04] border-white/15 text-[#9ca3af]'
                      }`}
                    >
                      {inv.attuned ? 'Attuned' : 'Attune'}
                    </button>
                  )}

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
                    className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold cursor-pointer border ${
                      inv.equipped
                        ? 'bg-[#1e3126] border-[#4d755d] text-white'
                        : 'bg-white/[0.04] border-white/15 text-[#9ca3af]'
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
                    className="p-1 text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Attunement Section */}
      {(() => {
        const attunedItems = character.inventory.filter((inv) => inv.attuned);
        const attunableItems = character.inventory.filter((inv) => {
          const itemObj = inv.isCustom ? undefined : findItem(compendium, inv.itemKey);
          return Boolean(itemObj?.reqAttune) || inv.attuned;
        });

        return (
          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#c96f74] border-b border-white/15 pb-1">
                Attunement
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Left: 3 Slotted Attuned Items Medallions */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white">
                    Attuned Items
                  </div>
                  <div className="space-y-2.5">
                    {Array.from({ length: computed.attunement.max }, (_, idx) => {
                      const slotItem = attunedItems[idx];
                      return (
                        <div key={idx} className="flex items-center">
                          <div
                            className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              slotItem
                                ? 'border-[#a8464c] bg-[#2a191b] text-white'
                                : 'border-[#7f292e] bg-[#14161b] text-[#6b7280]'
                            }`}
                          >
                            {slotItem && <Sparkles className="w-3.5 h-3.5" />}
                          </div>
                          <div className="sheet-chamfer-sm flex-1 -ml-3 pl-5 pr-3 h-8 border border-[#7f292e] bg-[#14161b]/90 flex items-center justify-between gap-2 text-xs min-w-0">
                            {slotItem ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openReferenceByTag('item', slotItem.name, slotItem.source)}
                                  className="font-bold text-white hover:underline truncate cursor-pointer text-left"
                                >
                                  {slotItem.name}
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Unattune ${slotItem.name}`}
                                  onClick={() =>
                                    onChange((p) => ({
                                      ...p,
                                      inventory: p.inventory.map((x) =>
                                        x.instanceId === slotItem.instanceId ? { ...x, attuned: false } : x,
                                      ),
                                    }))
                                  }
                                  className="text-[#9ca3af] hover:text-white cursor-pointer shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[#9ca3af] truncate">
                                Choose an Item from the Right
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Items Requiring Attunement */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white">
                    Items Requiring Attunement
                  </div>
                  {attunableItems.length === 0 ? (
                    <div className="py-5 text-center text-xs text-[#9ca3af] leading-relaxed">
                      Items that you can attune to will display here as you make them active.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {attunableItems.map((inv) => {
                        const itemObj = inv.isCustom ? undefined : findItem(compendium, inv.itemKey);
                        const reqText =
                          typeof itemObj?.reqAttune === 'string'
                            ? `Requires Attunement ${itemObj.reqAttune}`
                            : 'Requires Attunement';
                        const slotsFull = !inv.attuned && attunedItems.length >= computed.attunement.max;

                        return (
                          <div
                            key={inv.instanceId}
                            className="px-3 py-2 rounded-[4px] bg-white/[0.03] border border-white/15 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => openReferenceByTag('item', inv.name, inv.source)}
                                className="font-bold text-white hover:underline truncate block cursor-pointer text-left"
                              >
                                {inv.name}
                              </button>
                              <div className="text-[10px] text-[#9ca3af] truncate">{reqText}</div>
                            </div>
                            <button
                              type="button"
                              disabled={slotsFull}
                              onClick={() =>
                                onChange((p) => ({
                                  ...p,
                                  inventory: p.inventory.map((x) =>
                                    x.instanceId === inv.instanceId ? { ...x, attuned: !x.attuned } : x,
                                  ),
                                }))
                              }
                              className={`px-2.5 py-1 rounded-[3px] text-[10px] font-bold uppercase border cursor-pointer shrink-0 disabled:opacity-40 ${
                                inv.attuned
                                  ? 'bg-[#7f292e] border-[#a8464c] text-white'
                                  : 'bg-white/[0.04] border-white/20 text-[#e5e7eb] hover:border-white/40'
                              }`}
                            >
                              {inv.attuned ? 'Attuned' : 'Attune'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Other Possessions */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#c96f74] border-b border-white/15 pb-1">
                Other Possessions
              </div>
              <textarea
                aria-label="Other Possessions"
                rows={3}
                value={character.otherPossessions ?? ''}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    otherPossessions: e.target.value,
                  }))
                }
                placeholder="No other possessions recorded."
                className="w-full px-3 py-2 rounded-[4px] bg-[#0e1014]/80 border border-white/10 text-xs text-[#e5e7eb] placeholder:text-[#6b7280] focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
        );
      })()}

      {/* Equipment Search & Add Right-Side Modal Drawer */}
      <SheetEquipmentDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        character={character}
        computed={computed}
        onChange={onChange}
      />
    </div>
  );
}
