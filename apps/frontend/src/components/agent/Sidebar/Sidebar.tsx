/**
 * Sidebar.tsx
 * Main semantic workspace panel.
 */

import React, { useEffect, useState } from 'react';
import { EntityPanel } from './EntityPanel';
import { ActionPanel } from './ActionPanel';
import { DocumentPanel } from './DocumentPanel';
import { MemoryPanel } from './MemoryPanel';
import { usePageContext } from '../../../hooks/usePageContext';
import { useMemory } from '../../../hooks/useMemory';
import { extractDomain } from '../../../shared/utils';

type SidebarTab = 'page' | 'docs' | 'memory' | 'tools';

interface SidebarProps {
  activeTab: SidebarTab;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab }) => {
  const { model, refreshModel } = usePageContext();
  const { profile, domainMemory, loadDomainMemory } = useMemory();

  useEffect(() => {
    if (model?.url) loadDomainMemory(extractDomain(model.url));
  }, [model?.url, loadDomainMemory]);

  const formattedProfile = profile
    ? { name: `${profile.firstName} ${profile.lastName}`.trim() || profile.email, email: profile.email }
    : null;

  const memoriesList = domainMemory
    ? [
        ...Object.entries(domainMemory.formInputs || {}),
        ...Object.entries(domainMemory.preferences || {}),
      ].map(([key, value], index) => ({
        id: index + 1,
        key,
        value: String(value),
        timestamp: new Date(domainMemory.lastVisited).toISOString(),
      }))
    : [];

  const runAction = (label: string) => {
    // @ts-ignore
    window.electronAPI?.runTask?.({ intent: label });
  };

  return (
    <div className="flex h-full min-w-0 flex-col bg-white text-[var(--color-ink)]">
      <div className="shrink-0 border-b border-[var(--color-hairline)] bg-[var(--color-subtle)] px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          {/* min-w-0 is required for `truncate` to actually engage on a
              flex item — without it the title just overflows instead. */}
          <div className="min-w-0 flex-1">
            <h2 className="text-[13px] font-[590] tracking-[0.2px] text-[var(--color-ink)]">Page Context</h2>
            <p className="mt-1 truncate text-[11px] text-[rgba(46,46,46,0.6)]">
              {model?.title || model?.url || 'Waiting for page'}
            </p>
          </div>
          <button
            onClick={refreshModel}
            className="shrink-0 rounded-[6px] border border-[var(--color-hairline)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink)] shadow-sm transition-colors hover:bg-[var(--color-subtle)]"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-8 overflow-y-auto px-4 py-5 sm:px-6">
        {activeTab === 'page' && (
          <>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="mb-2 text-[11px] font-[590] uppercase tracking-[0.5px] text-[rgba(46,46,46,0.5)]">Entities</h3>
              <EntityPanel entities={model?.entities || []} />
            </div>
            <div className="mt-2 flex min-w-0 flex-col gap-1">
              <h3 className="mb-2 text-[11px] font-[590] uppercase tracking-[0.5px] text-[rgba(46,46,46,0.5)]">Actions</h3>
              <ActionPanel
                actions={model?.actions || []}
                onActionClick={(action) => runAction(`${action.type === 'submit' ? 'Submit' : 'Click'} ${action.label}`)}
              />
            </div>
          </>
        )}
        {activeTab === 'docs' && (
          <DocumentPanel
            documents={model?.documents || []}
            onExtractDocument={(doc) => runAction(`Download ${doc.title}`)}
          />
        )}
        {activeTab === 'memory' && (
          <MemoryPanel profile={formattedProfile} memories={memoriesList} />
        )}
        {activeTab === 'tools' && (
          <div className="py-10 text-center text-sm italic text-gray-500">Tools available for this page</div>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--color-hairline)] bg-[var(--color-subtle-soft)] px-4 py-3 text-[11px] text-[rgba(46,46,46,0.6)] sm:px-6">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className="shrink-0 font-[510]">Intent</span>
          {/* Same fix: min-w-0 on the truncated span's flex context. */}
          <span className="min-w-0 truncate font-[590] text-[var(--color-ink)]">{model?.pageIntent || 'unknown'}</span>
        </div>
      </div>
    </div>
  );
};