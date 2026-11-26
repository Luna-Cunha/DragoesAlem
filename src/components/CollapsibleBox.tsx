import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

export function CollapsibleBox({
  title,
  subtitle,
  badge,
  alertDot = false,
  accent = 'red',
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  headerRight,
  bodyClassName,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  alertDot?: boolean;
  accent?: 'red' | 'blue' | 'muted' | 'plain';
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  headerRight?: React.ReactNode;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggleOpen = () => {
    const next = !open;
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const headerModifier =
    accent === 'blue'
      ? 'ddb-accordion-header--blue'
      : accent === 'muted'
        ? 'ddb-accordion-header--muted'
        : accent === 'plain'
          ? 'ddb-accordion-header--plain'
          : '';

  return (
    <div className="ddb-accordion relative">
      {alertDot && (
        <span
          className="absolute -top-0.5 -left-0.5 z-10 w-4 h-4 rounded-full bg-[#1b9af0] text-white flex items-center justify-center shadow"
          title="Choice needed"
        >
          <AlertCircle className="w-3 h-3" />
        </span>
      )}
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className={`ddb-accordion-header ${headerModifier}`}
      >
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm text-[var(--text-primary)]">{title}</span>
            {badge && <span className="ddb-choice-badge">{badge}</span>}
          </div>
          {subtitle && (
            <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{subtitle}</div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerRight}
          {open ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
        </div>
      </button>
      {open && (
        <div
          className={
            bodyClassName ??
            'p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]'
          }
        >
          {children}
        </div>
      )}
    </div>
  );
}
