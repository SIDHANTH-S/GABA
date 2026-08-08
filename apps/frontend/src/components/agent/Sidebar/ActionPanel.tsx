import React from 'react';
import { PageAction } from '../../../shared/types';

interface ActionPanelProps {
  actions: PageAction[];
  onActionClick?: (action: PageAction) => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ actions, onActionClick }) => {
  const groupedActions = actions.reduce((acc, action) => {
    if (!acc[action.type]) acc[action.type] = [];
    acc[action.type].push(action);
    return acc;
  }, {} as Record<string, PageAction[]>);

  if (actions.length === 0) {
    return (
      <div className="rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-subtle-soft)] p-[16px]">
        <h3 className="text-[12px] font-[590] text-[var(--color-ink)]">No actions detected</h3>
        <p className="mt-1 text-[11px] leading-[16px] text-[rgba(46,46,46,0.5)]">
          Buttons and links will appear here once the page exposes interactive elements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedActions).map(([type, items]) => (
        <section key={type} className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-semibold text-[rgba(46,46,46,0.4)] uppercase tracking-[0.5px]">{type}</h3>
            <span className="text-[10px] text-[rgba(46,46,46,0.4)]">{items.length}</span>
          </div>

          <div className="space-y-[6px]">
            {items.map((action) => (
              <button
                key={action.id}
                className="group w-full p-[10px] rounded-[10px] bg-white border border-[var(--color-hairline)] hover:border-[var(--color-accent)] hover:shadow-chip transition-all text-left"
                onClick={() => onActionClick?.(action)}
              >
                <span className="block text-[12px] text-[var(--color-ink)] font-[590] truncate tracking-tight">{action.label}</span>
                <span className="mt-[2px] block text-[11px] text-[rgba(46,46,46,0.6)] truncate">{action.context}</span>
                <code className="mt-1.5 block text-[9px] text-[rgba(46,46,46,0.4)] truncate bg-[var(--color-subtle)] px-1.5 py-0.5 rounded-[4px]">{action.selector}</code>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
