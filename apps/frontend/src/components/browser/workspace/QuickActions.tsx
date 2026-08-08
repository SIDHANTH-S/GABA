import { Chip } from "../ui/primitives";

const ACTIONS = [
  { glyph: "✎", label: "Rewrite this in my tone" },
  { glyph: "✦", label: "Summarize this page" },
  { glyph: "↩", label: "Draft a quick reply" },
  { glyph: "✓", label: "Fix grammar & clarity" },
];

/** Contextual quick actions shown while the workspace is idle. */
export default function QuickActions() {
  return (
    <div className="flex w-[332px] max-w-full flex-wrap content-center items-center justify-center gap-[8px]">
      {ACTIONS.map((action) => (
        <Chip key={action.label} glyph={action.glyph}>
          {action.label}
        </Chip>
      ))}
    </div>
  );
}
