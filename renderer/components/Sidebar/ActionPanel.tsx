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
      <div className="rounded-md border border-[#2a2a2a] bg-[#111111] p-4">
        <h3 className="text-sm font-medium text-white">No actions detected</h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Buttons and links will appear here once the page exposes interactive elements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedActions).map(([type, items]) => (
        <section key={type} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">{type}</h3>
            <span className="text-[10px] text-gray-500">{items.length}</span>
          </div>

          <div className="space-y-1.5">
            {items.map((action) => (
              <button
                key={action.id}
                className="group w-full p-2.5 rounded-md bg-[#111111] border border-[#242424] hover:border-indigo-500/60 transition-colors text-left"
                onClick={() => onActionClick?.(action)}
              >
                <span className="block text-sm text-white font-medium truncate">{action.label}</span>
                <span className="mt-1 block text-xs text-gray-500 truncate">{action.context}</span>
                <code className="mt-1.5 block text-[10px] text-gray-600 truncate">{action.selector}</code>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
