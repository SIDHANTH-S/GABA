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
    // w-full instead of a fixed base width — flex-wrap + gap already
    // handles reflow correctly at any container size.
    <div className="flex w-full min-w-0 flex-wrap content-center items-center justify-center gap-2">
      {ACTIONS.map((action) => (
        <Chip key={action.label} glyph={action.glyph}>
          {action.label}
        </Chip>
      ))}
    </div>
  );
}