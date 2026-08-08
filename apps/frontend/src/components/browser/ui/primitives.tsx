import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Design-system primitives for the browser shell. Each primitive owns its
 * variants and interaction states (hover / pressed / focus) so composed
 * surfaces stay declarative.
 */

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
};

/** Toolbar affordance: a tap target wrapping a fixed-size glyph. */
export function IconButton({ label, children, className = "", ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={
        "flex items-center justify-center rounded-[6px] p-[3px] text-[#2f2f2f] transition duration-150 " +
        "hover:bg-black/[0.06] active:bg-black/[0.1] active:scale-[0.94] " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40 " +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
}

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  glyph: string;
  children: ReactNode;
};

/** Contextual quick-action chip. */
export function Chip({ glyph, children, className = "", ...rest }: ChipProps) {
  return (
    <button
      type="button"
      className={
        "group relative rounded-[var(--radius-pill)] bg-[var(--color-subtle)] shadow-[var(--shadow-chip)] " +
        "transition duration-150 hover:bg-white hover:-translate-y-px hover:shadow-[0px_2px_6px_0px_rgba(0,0,0,0.1)] " +
        "active:translate-y-0 active:shadow-[var(--shadow-chip)] " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40 " +
        className
      }
      {...rest}
    >
      <span className="flex items-center gap-[6px] whitespace-nowrap px-[12px] py-[8px] font-[510] leading-[normal]" style={{ fontVariationSettings: '"wdth" 100' }}>
        <span className="shrink-0 text-[10px] text-[var(--color-accent)]">{glyph}</span>
        <span className="shrink-0 text-[10.5px] text-[rgba(46,46,46,0.85)]">{children}</span>
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[var(--radius-pill)] border border-[var(--color-hairline)]" />
    </button>
  );
}

/** List row used in the Recent activity feed. */
export function ListItem({ glyph, title, meta }: { glyph: string; title: string; meta: string }) {
  return (
    <button
      type="button"
      className="group relative w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-subtle-soft)] text-left transition duration-150 hover:bg-[var(--color-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40"
    >
      <span
        className="flex items-center gap-[10px] px-[10px] py-[8px] font-normal leading-[normal]"
        style={{ fontVariationSettings: '"wdth" 100' }}
      >
        <span className="shrink-0 text-[12px] text-[var(--color-accent)]">{glyph}</span>
        <span className="min-w-px flex-1 text-[10.5px] text-[var(--color-ink)]">{title}</span>
        <span className="shrink-0 text-right text-[9px] text-[rgba(46,46,46,0.45)]">{meta}</span>
      </span>
    </button>
  );
}

/** Section eyebrow label (e.g. "Recent"). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="w-full font-[510] leading-[normal] tracking-[0.06px] text-[11px] text-[rgba(46,46,46,0.5)]"
      style={{ fontVariationSettings: '"wdth" 100' }}
    >
      {children}
    </p>
  );
}
