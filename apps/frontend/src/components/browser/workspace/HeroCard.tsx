import heroImg from "../assets/hero.png";

/**
 * Marketing hero: gradient artwork, headline, supporting copy, and CTA.
 * Fully fluid — no fixed pixel widths anywhere — so it can never push
 * wider than its parent as the sidebar is resized.
 */
export default function HeroCard() {
  return (
    <div className="relative flex w-full min-w-0 flex-col gap-2.5 overflow-hidden rounded-md p-2.5">
      {/* object-cover always fills whatever box this resolves to */}
      <img
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full max-w-none rounded-md object-cover"
        src={heroImg}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-md border border-[#e0e0ca]" />

      {/* min-w-0 is the fix: without it a flex-col child can't shrink
          below its content's intrinsic width, which is what was
          forcing the card (and image) past the sidebar's edge. */}
      <div className="relative flex min-w-0 flex-col gap-1.5">
        <p
          className="max-w-full text-balance break-words text-[15px] leading-snug tracking-tight text-white"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
        >
          Your browser just became your assistant.
        </p>
        <p
          className="max-w-full break-words text-[10px] leading-[1.5] tracking-tight text-[rgba(255,255,255,0.54)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span>Understand pages, </span>
          <span className="text-white">fill forms, automate repetitive work</span>
          <span>, and </span>
          <span className="text-white">complete tasks</span>
          <span> using </span>
          <span className="text-white">natural language</span>
          <span>—without switching tabs.</span>
        </p>
      </div>

      <button
        type="button"
        className="relative flex shrink-0 items-center justify-center gap-1 self-start rounded-sm bg-[#2b2830] px-2 py-1 transition duration-150 hover:bg-[#37333f] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <span className="whitespace-nowrap text-[7px] font-medium leading-normal text-white">
          Start now
        </span>
        {/* Offsets here are relative to the button's own box, not the
            card, so they stay correct regardless of card width. */}
        <span aria-hidden className="absolute -right-1.5 -top-1.5 h-3 w-3">
          <span className="absolute inset-[-6.66%_-6.67%]">
            <svg className="block size-full" fill="none" viewBox="0 0 14.1428 14.1702">
              <rect fill="#A16AFF" fillOpacity="0.8" height="12.5047" rx="6.23867" width="12.4773" x="0.832735" y="0.832735" />
              <rect height="13.3375" rx="6.65504" stroke="#A16AFF" strokeOpacity="0.4" strokeWidth="0.832735" width="13.3101" x="0.416367" y="0.416367" />
              <ellipse cx="7.07155" cy="7.0851" fill="#753DB0" rx="2.075" ry="2.0887" />
            </svg>
          </span>
        </span>
      </button>
    </div>
  );
}