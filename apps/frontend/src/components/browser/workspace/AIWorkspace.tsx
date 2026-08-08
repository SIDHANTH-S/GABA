import HeroCard from "./HeroCard";
import QuickActions from "./QuickActions";
import PromptComposer from "./PromptComposer";
import RecentActivity from "./RecentActivity";

/** Workspace status header with a live indicator. */
function WorkspaceHeader() {
  return (
    <div className="flex h-[20px] w-full items-center gap-[8px] overflow-hidden bg-white">
      <span aria-hidden className="size-[6px] shrink-0 rounded-full bg-[var(--color-accent)]" />
      <p className="min-w-px flex-1 text-[11px] font-[510] leading-[14px] tracking-[0.06px] text-[rgba(46,46,46,0.5)]" style={{ fontVariationSettings: '"wdth" 100' }}>
        Workspace
      </p>
    </div>
  );
}

/**
 * AI Workspace — the right rail of the browser. Idle state: hero, contextual
 * quick actions, prompt composer, and recent activity, in a single Auto Layout
 * column with a flexible gap that pins the composer toward the base.
 */
export default function AIWorkspace() {
  return (
    <aside
      className="relative flex w-full shrink-0 flex-col self-stretch bg-white px-[24px] pb-[40px] pt-[24px] border-l border-[var(--color-hairline)]"
      data-name="ai-workspace"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" />

      <WorkspaceHeader />
      <div className="mt-[8px] flex flex-col items-center gap-[24px] pt-[8px]">
        <HeroCard />
        <div
          className="text-center text-[22px] font-[590] leading-[0] tracking-[0.35px] text-[var(--color-ink)]"
          style={{ fontVariationSettings: '"wdth" 100' }}
        >
          <p className="mb-0 leading-[28px]">What would you like to</p>
          <p className="leading-[28px]">accomplish today?</p>
        </div>
        <QuickActions />
      </div>

      {/* Flexible gap pins the composer + recent feed to the lower rail. */}
      <div className="flex-1" />

      <div className="flex flex-col gap-[24px]">
        <PromptComposer />
        <RecentActivity />
      </div>
    </aside>
  );
}
