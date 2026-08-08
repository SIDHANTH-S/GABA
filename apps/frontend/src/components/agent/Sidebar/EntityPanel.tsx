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
      <div className="rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-subtle-soft)] p-[16px]">
        <h3 className="text-[12px] font-[590] text-[var(--color-ink)]">No entities yet</h3>
        <p className="mt-1 text-[11px] leading-[16px] text-[rgba(46,46,46,0.5)]">
          Refresh after the page finishes loading, or navigate to a page with prices, dates, contacts, or order details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedEntities).map(([type, items]) => (
        <section key={type} className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-semibold text-[rgba(46,46,46,0.4)] uppercase tracking-[0.5px]">{type}</h3>
            <span className="text-[10px] text-[rgba(46,46,46,0.4)]">{items.length}</span>
          </div>

          <div className="space-y-[6px]">
            {items.map((entity) => (
              <button
                key={entity.id}
                className="group w-full flex items-start justify-between gap-2 p-[10px] rounded-[10px] bg-white border border-[var(--color-hairline)] hover:border-[var(--color-accent)] hover:shadow-chip transition-all text-left"
                onClick={() => copyToClipboard(entity.value)}
                title="Copy value"
              >
                <span className="min-w-0">
                  <span className="block text-[12px] text-[var(--color-ink)] font-mono truncate tracking-tight">{entity.value}</span>
                  {entity.normalizedValue && entity.normalizedValue !== entity.value && (
                    <span className="block text-[10px] text-[rgba(46,46,46,0.5)] truncate mt-[2px]">{entity.normalizedValue}</span>
                  )}
                </span>
                <span className="text-[9px] px-[6px] py-[2px] rounded-[4px] bg-[var(--color-subtle)] border border-[var(--color-hairline)] text-[var(--color-ink)] font-medium">
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
