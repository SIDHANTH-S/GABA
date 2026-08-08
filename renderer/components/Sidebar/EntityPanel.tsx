import React from 'react';
import { SemanticEntity } from '../../../shared/types';

interface EntityPanelProps {
  entities: SemanticEntity[];
}

export const EntityPanel: React.FC<EntityPanelProps> = ({ entities }) => {
  const groupedEntities = entities.reduce((acc, entity) => {
    if (!acc[entity.type]) acc[entity.type] = [];
    acc[entity.type].push(entity);
    return acc;
  }, {} as Record<string, SemanticEntity[]>);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
  };

  if (entities.length === 0) {
    return (
      <div className="rounded-md border border-[#2a2a2a] bg-[#111111] p-4">
        <h3 className="text-sm font-medium text-white">No entities yet</h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Refresh after the page finishes loading, or navigate to a page with prices, dates, contacts, or order details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedEntities).map(([type, items]) => (
        <section key={type} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">{type}</h3>
            <span className="text-[10px] text-gray-500">{items.length}</span>
          </div>

          <div className="space-y-1.5">
            {items.map((entity) => (
              <button
                key={entity.id}
                className="group w-full flex items-start justify-between gap-2 p-2 rounded-md bg-[#111111] border border-[#242424] hover:border-indigo-500/60 transition-colors text-left"
                onClick={() => copyToClipboard(entity.value)}
                title="Copy value"
              >
                <span className="min-w-0">
                  <span className="block text-sm text-white font-mono truncate">{entity.value}</span>
                  {entity.normalizedValue && entity.normalizedValue !== entity.value && (
                    <span className="block text-xs text-gray-500 truncate">{entity.normalizedValue}</span>
                  )}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-400">
                  {Math.round(entity.confidence * 100)}%
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
