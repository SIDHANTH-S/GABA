import heroImg from "../assets/hero.png";

/** Marketing hero: gradient artwork, headline, supporting copy, and CTA. */
export default function HeroCard() {
  return (
    <div className="relative flex w-full flex-col gap-[9.993px] overflow-hidden rounded-[4.996px] p-[9.993px]">
      <img alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full max-w-none rounded-[4.996px] object-cover" src={heroImg} />
      <div aria-hidden className="pointer-events-none absolute inset-[-0.416px] rounded-[5.412px] border-[0.416px] border-[#e0e0ca]" />

      <div className="relative flex flex-col gap-[6.662px]">
        <p className="w-[307.167px] leading-[normal] tracking-[-0.7491px] text-[18.729px] text-white" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
          Your browser just became your assistant.
        </p>
        <p className="w-[318px] leading-[0] tracking-[-0.1982px] text-[9.911px] text-[rgba(255,255,255,0.54)]" style={{ fontFamily: "var(--font-display)" }}>
          <span className="leading-[1.5]">Understand pages, </span>
          <span className="leading-[1.5] text-white">fill forms, automate repetitive work</span>
          <span className="leading-[1.5]">, and </span>
          <span className="leading-[1.5] text-white">complete tasks</span>
          <span className="leading-[1.5]"> using </span>
          <span className="leading-[1.5] text-white">natural language</span>
          <span className="leading-[1.5]">—without switching tabs.</span>
        </p>
      </div>

      <button
        type="button"
        className="relative flex shrink-0 items-center justify-center gap-[4.164px] self-start rounded-[3.331px] bg-[#2b2830] p-[5.829px] transition duration-150 hover:bg-[#37333f] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <span className="whitespace-nowrap text-[5.829px] leading-[normal] text-white" style={{ fontWeight: 510 }}>
          Start now
        </span>
        <span aria-hidden className="absolute right-[-6.19px] top-[-6.27px] h-[12.505px] w-[12.477px]">
          <span className="absolute inset-[-6.66%_-6.67%]">
            <svg className="block size-full" fill="none" height="14.1702" preserveAspectRatio="none" viewBox="0 0 14.1428 14.1702" width="14.1428">
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
