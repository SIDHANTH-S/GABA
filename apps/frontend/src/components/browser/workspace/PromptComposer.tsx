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
    <div className="w-full">
      {/* Composer */}
      <form onSubmit={handleSubmit} className="relative h-[68px] w-full rounded-t-[20px] bg-[var(--color-subtle)] shadow-[var(--shadow-composer)]">
        <div className="flex size-full items-center gap-[12px] overflow-hidden rounded-t-[20px] px-[20px]">
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
            className="min-w-px flex-1 bg-transparent text-[11px] font-normal leading-[normal] text-[var(--color-ink)] outline-none placeholder:text-[rgba(46,46,46,0.4)] disabled:opacity-50"
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

      {/* Benefits */}
      <div className="flex h-[34px] items-center justify-center gap-[5.656px] rounded-b-[20px] bg-[var(--color-success-wash)] px-[5.656px] pb-[4.525px] pt-[3.394px]">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-[2.765px]">
            <Icon />
            <p className="whitespace-nowrap text-[6.452px] font-[510] leading-[normal] text-[var(--color-success)]" style={{ fontVariationSettings: '"wdth" 100' }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
