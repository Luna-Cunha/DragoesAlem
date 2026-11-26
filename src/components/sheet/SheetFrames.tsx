import type { ReactNode } from 'react';

function CornerNotchSvg({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const posClass =
    position === 'tl'
      ? 'top-0 left-0'
      : position === 'tr'
        ? 'top-0 right-0 -scale-x-100'
        : position === 'bl'
          ? 'bottom-0 left-0 -scale-y-100'
          : 'bottom-0 right-0 -scale-x-100 -scale-y-100';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      className={`pointer-events-none absolute w-[18px] h-[18px] ${posClass}`}
      fill="none"
    >
      <path
        d="M17.5 1.5H11.2L1.5 11.2V17.5"
        stroke="var(--sheet-frame, #7f292e)"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
      <path
        d="M17.5 4.5H12.4L4.5 12.4V17.5"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="0.9"
      />
    </svg>
  );
}

/**
 * Ornate chamfered dark panel styled after sculpted D&D Beyond character boxes
 * without clipping children or adding neon glows.
 */
export function SculptedPanel({
  children,
  className = '',
  innerClassName = '',
  showFooterNotch = false,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  showFooterNotch?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="sheet-chamfer h-full backdrop-blur-md border border-[var(--sheet-frame,#7f292e)]/85 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        style={{
          backgroundColor: 'var(--sheet-panel-bg)',
        }}
      >
        <div
          className={`h-full border border-[var(--sheet-border-subtle)] ${innerClassName}`}
        >
          {children}
        </div>
      </div>

      <CornerNotchSvg position="tl" />
      <CornerNotchSvg position="tr" />
      <CornerNotchSvg position="bl" />
      <CornerNotchSvg position="br" />

      {showFooterNotch && (
        <svg
          aria-hidden="true"
          viewBox="0 0 64 8"
          className="pointer-events-none absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-14 h-2"
          fill="none"
        >
          <path
            d="M2 4H22L32 7L42 4H62"
            stroke="var(--sheet-frame, #7f292e)"
            strokeWidth="1.5"
          />
          <circle cx="32" cy="4" r="2" fill="#14161b" stroke="var(--sheet-frame, #7f292e)" strokeWidth="1.2" />
        </svg>
      )}
    </div>
  );
}

/**
 * Stylized D&D Beyond ability score crest card with bottom overlapping score medallion.
 */
export function AbilityCrestCard({
  label,
  modifierText,
  scoreTotal,
  onRollCheck,
  onInspectScore,
}: {
  label: string;
  modifierText: string;
  scoreTotal: number;
  onRollCheck: () => void;
  onInspectScore: () => void;
}) {
  return (
    <div className="relative pb-3.5">
      <div
        className="sheet-chamfer relative px-2 pt-2.5 pb-5 flex flex-col items-center justify-between text-center border border-[var(--sheet-frame,#7f292e)]/85 backdrop-blur-md shadow-[0_6px_18px_rgba(0,0,0,0.42)]"
        style={{ backgroundColor: 'var(--sheet-panel-bg)' }}
      >
        <CornerNotchSvg position="tl" />
        <CornerNotchSvg position="tr" />
        <CornerNotchSvg position="bl" />
        <CornerNotchSvg position="br" />

        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#b8bfc8] truncate max-w-full">
          {label}
        </div>

        <button
          type="button"
          onClick={onRollCheck}
          title={`Roll ${label} Check`}
          className="my-1.5 min-w-[54px] px-2.5 py-1 rounded-[4px] border border-white/15 bg-white/[0.04] hover:bg-white/[0.11] hover:border-white/35 text-white font-mono-num text-[22px] leading-none font-bold cursor-pointer transition"
        >
          {modifierText}
        </button>
      </div>

      {/* Bottom Oval/Notched Total Score Medallion */}
      <button
        type="button"
        onClick={onInspectScore}
        title={`Inspect ${label} Breakdown`}
        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 min-w-[42px] px-2.5 py-0.5 rounded-full bg-[#181a20] border border-[var(--sheet-frame,#7f292e)] hover:border-white/60 text-[#e5e7eb] font-mono-num text-xs font-bold shadow cursor-pointer transition"
      >
        {scoreTotal}
      </button>
    </div>
  );
}

/**
 * Stylized Shield frame for Armor Class matching D&D Beyond silhouette.
 */
export function AcShieldBadge({
  ac,
  onClick,
}: {
  ac: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-[84px] h-[94px] flex flex-col items-center justify-center text-center cursor-pointer group shrink-0"
      title="View Armor Class Calculation"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 112"
        className="absolute inset-0 w-full h-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
        fill="none"
      >
        <path
          d="M50 4L92 14V56C92 80 73 98 50 108C27 98 8 80 8 56V14L50 4Z"
          fill="var(--sheet-panel-bg, rgba(14,16,20,0.92))"
          stroke="var(--sheet-frame, #7f292e)"
          strokeWidth="2.4"
        />
        <path
          d="M50 10L86 19V55C86 76 69 92 50 101C31 92 14 76 14 55V19L50 10Z"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center leading-none">
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#a8b0ba]">
          Armor
        </span>
        <span className="font-mono-num text-2xl font-extrabold text-white my-0.5 group-hover:scale-105 transition-transform">
          {ac}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#a8b0ba]">
          Class
        </span>
      </div>
    </button>
  );
}

/**
 * Stylized Notched Initiative Box matching D&D Beyond header label + crest.
 */
export function InitiativeHexBadge({
  initiativeText,
  onRoll,
}: {
  initiativeText: string;
  onRoll: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center shrink-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#d1d5db] mb-1">
        Initiative
      </div>
      <button
        type="button"
        aria-label="Roll Initiative"
        onClick={onRoll}
        className="relative w-[72px] h-[54px] flex items-center justify-center cursor-pointer group"
        title="Roll Initiative"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 88 64"
          className="absolute inset-0 w-full h-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
          fill="none"
        >
          <path
            d="M16 4H72L84 20V44L72 60H16L4 44V20L16 4Z"
            fill="var(--sheet-panel-bg, rgba(14,16,20,0.92))"
            stroke="var(--sheet-frame, #7f292e)"
            strokeWidth="2.2"
          />
          <path
            d="M18 9H70L79 21V43L70 55H18L9 43V21L18 9Z"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1"
          />
        </svg>
        <span className="relative z-10 font-mono-num text-2xl font-extrabold text-white group-hover:scale-105 transition-transform">
          {initiativeText}
        </span>
      </button>
    </div>
  );
}
