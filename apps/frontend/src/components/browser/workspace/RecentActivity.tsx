import { ListItem, SectionLabel } from "../ui/primitives";

const RECENT = [
  { glyph: "✉", title: "Reply to Sarah — Product roadmap", meta: "2h ago" },
  { glyph: "✍", title: "LinkedIn post draft", meta: "Yesterday" },
  { glyph: "✎", title: "Meeting follow-up email", meta: "2 days ago" },
];

/** Feed of the assistant's recent tasks. */
export default function RecentActivity() {
  return (
    <div className="flex w-full flex-col gap-[6px] pb-[2px]">
      <SectionLabel>Recent</SectionLabel>
      {RECENT.map((item) => (
        <ListItem key={item.title} glyph={item.glyph} title={item.title} meta={item.meta} />
      ))}
    </div>
  );
}
