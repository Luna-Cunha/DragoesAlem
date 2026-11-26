import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import type { Item5e } from '../../types/5etools';
import type { Character, ComputedCharacter } from '../../types/character';
import { makeEntityKey } from '../../engine/rules';
import { AddItemsCatalog } from '../equipment/AddItemsCatalog';

export function SheetEquipmentDrawer({
  open,
  onClose,
  character,
  computed,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  character: Character;
  computed: ComputedCharacter;
  onChange: (updater: (prev: Character) => Character) => void;
}) {
  const [addItemsOpen, setAddItemsOpen] = useState(true);
  const [customOpen, setCustomOpen] = useState(false);
  const [contentsOpen, setContentsOpen] = useState(true);

  const [customName, setCustomName] = useState('');
  const [customWeight, setCustomWeight] = useState('0');
  const [customQty, setCustomQty] = useState('1');
  const [customNotes, setCustomNotes] = useState('');

  if (!open) return null;

  const totalCount = character.inventory.reduce((s, x) => s + (x.quantity || 1), 0);

  const handleAddCompendiumItem = (item: Item5e) => {
    onChange((p) => ({
      ...p,
      inventory: [
        ...p.inventory,
        {
          instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          itemKey: makeEntityKey(item.name, item.source),
          name: item.name,
          source: item.source,
          quantity: 1,
          equipped: Boolean(item.weapon || item.armor || item.shield),
          attuned: false,
        },
      ],
    }));
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const nm = customName.trim();
    if (!nm) return;
    const wt = Math.max(0, parseFloat(customWeight) || 0);
    const qty = Math.max(1, parseInt(customQty, 10) || 1);

    onChange((p) => ({
      ...p,
      inventory: [
        ...p.inventory,
        {
          instanceId: `inv-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          itemKey: `custom:${nm.toLowerCase()}`,
          name: nm,
          quantity: qty,
          equipped: false,
          attuned: false,
          notes: customNotes.trim() || undefined,
          customWeight: wt,
          isCustom: true,
        },
      ],
    }));
    setCustomName('');
    setCustomWeight('0');
    setCustomQty('1');
    setCustomNotes('');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end pt-14 sm:p-2 sm:pt-16 no-print pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="Equipment Drawer"
    >
      <div
        className="fixed inset-0 bg-black/25 pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="pointer-events-auto relative z-10 w-full max-w-[400px] h-full bg-[#121418]/96 backdrop-blur-md text-[#e5e7eb] border border-[#7f292e] rounded-[4px] shadow-[0_12px_36px_rgba(0,0,0,0.65)] flex flex-col">
        {/* Drawer Header */}
        <div className="px-4 py-3.5 border-b border-white/15 bg-[#101216] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-wide">Equipment</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Equipment drawer"
            className="p-1.5 rounded text-[#9ca3af] hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. Add Items Collapsible Section */}
          <div className="rounded-[2px] border border-white/15 bg-[#14161b]">
            <button
              type="button"
              onClick={() => setAddItemsOpen((v) => !v)}
              aria-expanded={addItemsOpen}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-white cursor-pointer hover:bg-white/[0.03]"
            >
              <span>Add Items</span>
              {addItemsOpen ? (
                <ChevronDown className="w-4 h-4 text-[#9ca3af] rotate-180 transition-transform" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
              )}
            </button>
            {addItemsOpen && (
              <div className="p-3.5 border-t border-white/10">
                <AddItemsCatalog
                  character={character}
                  computed={computed}
                  onAddItem={handleAddCompendiumItem}
                  variant="sheet"
                  listMaxHeightClass="max-h-[340px]"
                />
              </div>
            )}
          </div>

          {/* 2. Add Custom Item Collapsible Section */}
          <div className="rounded-[2px] border border-white/15 bg-[#14161b]">
            <button
              type="button"
              onClick={() => setCustomOpen((v) => !v)}
              aria-expanded={customOpen}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-white cursor-pointer hover:bg-white/[0.03]"
            >
              <span>Add Custom Item</span>
              {customOpen ? (
                <ChevronDown className="w-4 h-4 text-[#9ca3af] rotate-180 transition-transform" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
              )}
            </button>
            {customOpen && (
              <form onSubmit={handleAddCustomItem} className="p-3.5 border-t border-white/10 space-y-2.5 text-xs">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Custom item name..."
                  className="w-full px-3 py-1.5 rounded-[2px] bg-[#0e1014] border border-white/20 text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#9ca3af] uppercase font-bold mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={customQty}
                      onChange={(e) => setCustomQty(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[2px] bg-[#0e1014] border border-white/20 text-white font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#9ca3af] uppercase font-bold mb-1">Weight (lb)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={customWeight}
                      onChange={(e) => setCustomWeight(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[2px] bg-[#0e1014] border border-white/20 text-white font-mono-num"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-1.5 rounded-[2px] bg-[#0e1014] border border-white/20 text-white"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-[2px] bg-[#2a191b] hover:bg-[#382124] border border-[#8c3439] text-white font-bold uppercase text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Custom Item
                </button>
              </form>
            )}
          </div>

          {/* 3. Contents Summary */}
          <div className="rounded-[2px] border border-white/15 bg-[#14161b]">
            <button
              type="button"
              onClick={() => setContentsOpen((v) => !v)}
              aria-expanded={contentsOpen}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-white cursor-pointer hover:bg-white/[0.03]"
            >
              <span>Contents ({totalCount})</span>
              <span className="flex items-center gap-2 text-[#d1d5db] font-mono-num">
                {computed.carrying.totalWeight} lb
                {contentsOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#9ca3af] rotate-180 transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
                )}
              </span>
            </button>
            {contentsOpen && (
              <div className="p-3 border-t border-white/10 space-y-1.5 max-h-48 overflow-y-auto">
                {character.inventory.length === 0 ? (
                  <div className="text-[11px] text-[#9ca3af] text-center py-2">No items in inventory.</div>
                ) : (
                  character.inventory.map((inv) => (
                    <div key={inv.instanceId} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-white/[0.06] last:border-b-0">
                      <span className="truncate text-[#e5e7eb]">
                        {inv.name}
                        {(inv.quantity || 1) > 1 && (
                          <span className="ml-1 text-[#9ca3af] font-mono-num">x{inv.quantity}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onChange((p) => ({
                            ...p,
                            inventory: p.inventory.filter((x) => x.instanceId !== inv.instanceId),
                          }))
                        }
                        aria-label={`Remove ${inv.name} from drawer`}
                        className="text-[#9ca3af] hover:text-white cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#c96f74] space-y-1 pt-1 border-t border-white/10">
            <div>Carry Capacity: {computed.carrying.totalWeight} / {computed.carrying.capacity} lb ({computed.carrying.status})</div>
            <div>Currency Total: {character.currency.gp} GP · {character.currency.sp} SP · {character.currency.cp} CP</div>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
