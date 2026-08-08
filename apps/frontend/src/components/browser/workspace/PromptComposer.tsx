import { useState } from "react";
import { SparkleGlowIcon, SendActionIcon, DocumentGlyph, MoneyGlyph, RefundGlyph, SupportGlyph } from "../icons";

const BENEFITS = [
  { icon: DocumentGlyph, label: "No setup required" },
  { icon: MoneyGlyph, label: "Free to try" },
  { icon: RefundGlyph, label: "Undo anytime" },
  { icon: SupportGlyph, label: "24/7 AI support" },
];

/** Prompt input + reassurance strip. Where the user asks the assistant to act. */
export default function PromptComposer() {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim() || isSubmitting) return;

    const intent = value.trim();
    setIsSubmitting(true);

    try {
      if (window.electronAPI?.runTask) {
        await window.electronAPI.runTask({ intent });
      } else if (window.browser?.runAgentTask) {
        await window.browser.runAgentTask(intent);
      }
    } catch (err) {
      console.error("Failed to run agent task:", err);
    } finally {
      setIsSubmitting(false);
      setValue("");
    }
  };

  return (
    <div className="w-full min-w-0">
      {/* min-h instead of a hard h-[68px] so the row can grow if the
          input's placeholder/font ever needs more room. */}
      <form onSubmit={handleSubmit} className="relative min-h-[56px] w-full rounded-t-[20px] bg-[var(--color-subtle)] shadow-[var(--shadow-composer)]">
        <div className="flex size-full min-w-0 items-center gap-3 overflow-hidden rounded-t-[20px] px-4 py-3">
          <SparkleGlowIcon />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isSubmitting}
            placeholder={isSubmitting ? "Agent running..." : "Ask, automate, or tell me what to do..."}
            aria-label="Prompt the assistant"
            // min-w-0 (not min-w-px) is the correct idiom: it lets this
            // input shrink freely inside the flex row instead of
            // fighting the sibling icons for space.
            className="min-w-0 flex-1 bg-transparent text-[11px] font-normal leading-normal text-[var(--color-ink)] outline-none placeholder:text-[rgba(46,46,46,0.4)] disabled:opacity-50"
            style={{ fontVariationSettings: '"wdth" 100' }}
          />
          <button
            type="submit"
            disabled={isSubmitting || !value.trim()}
            aria-label="Send"
            className="shrink-0 rounded-full transition duration-150 hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50 disabled:opacity-40"
          >
            <SendActionIcon />
          </button>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-t-[20px] border-[1.5px] border-[rgba(10,132,255,0.22)]" />
      </form>

      {/* flex-wrap replaces whitespace-nowrap-with-no-escape-hatch:
          on a narrow rail these 4 items now wrap to a 2nd line instead
          of silently overflowing past the sidebar edge. */}
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-b-[20px] bg-[var(--color-success-wash)] px-2 py-1.5">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex shrink-0 items-center gap-1">
            <Icon />
            <p className="whitespace-nowrap text-[6.5px] font-medium leading-normal text-[var(--color-success)]" style={{ fontVariationSettings: '"wdth" 100' }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}