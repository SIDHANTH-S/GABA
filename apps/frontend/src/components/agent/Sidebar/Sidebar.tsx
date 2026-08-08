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
    <div className="h-full flex flex-col bg-white text-[var(--color-ink)]">
      <div className="flex-shrink-0 px-[24px] py-[16px] border-b border-[var(--color-hairline)] bg-[var(--color-subtle)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-[590] text-[var(--color-ink)] tracking-[0.2px]">Page Context</h2>
            <p className="text-[11px] text-[rgba(46,46,46,0.6)] truncate max-w-[230px] mt-1">
              {model?.title || model?.url || 'Waiting for page'}
            </p>
          </div>
          <button
            onClick={refreshModel}
            className="px-2.5 py-1 text-[11px] font-medium rounded-[6px] bg-white border border-[var(--color-hairline)] text-[var(--color-ink)] hover:bg-[var(--color-subtle)] transition-colors shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>



      <div className="flex-1 overflow-y-auto px-[24px] py-[20px] flex flex-col gap-8">
        {activeTab === 'page' && (
          <>
            <div className="flex flex-col gap-1">
              <h3 className="text-[11px] font-[590] text-[rgba(46,46,46,0.5)] uppercase tracking-[0.5px] mb-2">Entities</h3>
              <EntityPanel entities={model?.entities || []} />
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <h3 className="text-[11px] font-[590] text-[rgba(46,46,46,0.5)] uppercase tracking-[0.5px] mb-2">Actions</h3>
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
          <MemoryPanel
            profile={formattedProfile}
            memories={memoriesList}
          />
        )}
        {activeTab === 'tools' && (
          <div className="text-sm text-gray-500 italic text-center py-10">Tools available for this page</div>
        )}
      </div>

      <div className="flex-shrink-0 px-[24px] py-[12px] border-t border-[var(--color-hairline)] text-[11px] text-[rgba(46,46,46,0.6)] bg-[var(--color-subtle-soft)]">
        <div className="flex items-center justify-between gap-3">
          <span className="font-[510]">Intent</span>
          <span className="text-[var(--color-ink)] font-[590] truncate">{model?.pageIntent || 'unknown'}</span>
        </div>
      </div>
    </div>
  );
};
