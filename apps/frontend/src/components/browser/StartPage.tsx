import { useState } from "react";
import startBg from "./assets/start-bg.png";
import doodleCoil from "./assets/doodle-coil.png";
import doodleRocket from "./assets/doodle-rocket.png";
import { SparkSpiritIcon, SearchSubmitIcon } from "./icons/start";

const CHIPS = [
  { glyph: "🔍", label: "Research anything" },
  { glyph: "⚖", label: "Compare" },
  { glyph: "✏", label: "Write or draft" },
  { glyph: "📅", label: "Plan something" },
  { glyph: "⚡", label: "Automate a task" },
];

type Tile = { name: string; badge: string; color: string; wide?: boolean };
const TILES: Tile[] = [
  { name: "Google", badge: "G", color: "#4285f4" },
  { name: "GitHub", badge: "GH", color: "#181717" },
  { name: "Gmail", badge: "M", color: "#ea4335" },
  { name: "Figma", badge: "F", color: "#f24e1e" },
  { name: "YouTube", badge: "▶", color: "#ff0000", wide: true },
  { name: "Notion", badge: "N", color: "#000000" },
];

function QuickAccessTile({ tile }: { tile: Tile }) {
  return (
    <button
      type="button"
      onClick={() => window.browser?.navigate(`https://${tile.name.toLowerCase()}.com`)}
      className="group flex aspect-square w-full flex-col items-center justify-center gap-[10px] rounded-[13px] bg-white shadow-[0px_2.156px_3.233px_rgba(0,0,0,0.08)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0px_8px_20px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072ed]/40"
    >
      <span
        className={"flex items-center justify-center rounded-[13px] text-white " + (tile.wide ? "h-[45px] w-[65px]" : "size-[47px]")}
        style={{ backgroundColor: tile.color }}
      >
        <span className="font-bold leading-none" style={{ fontSize: tile.badge.length > 1 ? 16 : 21 }}>
          {tile.badge}
        </span>
      </span>
      <span className="text-[11.856px] text-[#666]">{tile.name}</span>
    </button>
  );
}

function AddTile() {
  return (
    <button
      type="button"
      className="flex aspect-square w-full flex-col items-center justify-center gap-[6px] rounded-[13px] border-[1.617px] border-dashed border-[#ccc] bg-white/70 shadow-[0px_2.156px_3.233px_rgba(0,0,0,0.08)] transition duration-150 hover:border-[#0072ed] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072ed]/40"
    >
      <span className="text-[30px] font-bold leading-none text-[#888]">+</span>
      <span className="text-[11.856px] text-[#666]">Add</span>
    </button>
  );
}

/**
 * The browser's new-tab / start page, rendered inside the Chromium WebView.
 * Rebuilt from the fixed Figma canvas into a centered, responsive column:
 * greeting, GABA search, quick prompts, and a Quick Access grid.
 */
export default function StartPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="relative h-full w-full" style={{ fontFamily: "var(--font-inter)" }}>
      {/* Fixed background image that doesn't scroll */}
      <img alt="" aria-hidden className="pointer-events-none fixed inset-0 h-full w-full object-cover" src={startBg} />

      {/* Scrolling content over the background */}
      <div className="relative h-full w-full overflow-y-auto">
        <div className="relative mx-auto flex min-h-full w-full max-w-[900px] flex-col px-6 py-16 sm:py-20">
        {/* Greeting with flanking doodles */}
        <div className="relative flex flex-col items-center text-center">
          <img
            alt=""
            aria-hidden
            src={doodleRocket}
            className="pointer-events-none absolute -left-2 top-2 hidden w-[92px] -translate-x-full drop-shadow-[10px_10px_40px_rgba(92,40,212,0.4)] lg:block"
            style={{ transform: "translateX(-100%) rotate(18.78deg) scaleY(-1)" }}
          />
          <img
            alt=""
            aria-hidden
            src={doodleCoil}
            className="pointer-events-none absolute -right-4 -top-8 hidden w-[150px] translate-x-full lg:block"
          />
          <h1 className="text-[clamp(2.5rem,6vw,62px)] font-semibold leading-[1.05] tracking-[-0.02em] text-[#17151f]">
            Good morning, Alex
          </h1>
          <p className="mt-4 text-[17.244px] text-[#6b7280]">What would you like to accomplish today?</p>
        </div>

        {/* GABA search */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!query.trim() || !window.browser) return;
            
            let finalUrl = query.trim();
            if (!finalUrl.includes('.') && !finalUrl.startsWith('http')) {
              finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
            } else if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
              finalUrl = "https://" + finalUrl;
            }
            
            window.browser.navigate(finalUrl);
          }}
          className="mx-auto mt-9 flex h-[56px] w-full max-w-[646px] items-center gap-3 rounded-[15px] border-[1.078px] border-black/[0.08] bg-white pl-[9px] pr-[9px] shadow-[0px_1.078px_2.156px_0px_rgba(0,0,0,0.04),0px_8.622px_30.178px_-4.311px_rgba(0,114,237,0.14)] transition focus-within:border-[#0072ed]/40 focus-within:shadow-[0px_1px_2px_rgba(0,0,0,0.04),0px_10px_34px_-4px_rgba(0,114,237,0.22)]"
        >
          <SparkSpiritIcon className="ml-2 size-[26px] shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask GABA, search the web, or enter a URL"
            aria-label="Ask GABA, search the web, or enter a URL"
            className="min-w-px flex-1 bg-transparent text-[15px] text-[#333] outline-none placeholder:text-[#aaa]"
          />
          <button type="submit" aria-label="Submit" className="shrink-0 rounded-full transition duration-150 hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072ed]/50">
            <SearchSubmitIcon className="size-[38.8px]" />
          </button>
        </form>

        {/* Prompt chips */}
        <div className="mx-auto mt-4 flex max-w-[760px] flex-wrap items-center justify-center gap-[10px]">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="flex h-[36.6px] items-center gap-2 whitespace-nowrap rounded-full border-[1.078px] border-[#e0e0e0] bg-[#f8f8f8] px-[14px] text-[14px] text-[#444] transition duration-150 hover:border-[#0072ed]/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072ed]/40"
            >
              <span>{chip.glyph}</span>
              {chip.label}
            </button>
          ))}
        </div>

        {/* Quick access */}
        <section className="mt-12 w-full">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-[#1a1a1a]">Quick Access</h2>
            <button type="button" className="text-[14px] text-[#0072ed] transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072ed]/40">
              Edit
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-[17px] sm:grid-cols-[repeat(auto-fill,110px)]">
            {TILES.map((tile) => (
              <QuickAccessTile key={tile.name} tile={tile} />
            ))}
            <AddTile />
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
