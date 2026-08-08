/**
 * Sidebar.tsx
 * Main semantic workspace panel.
 */

import React, { useEffect, useState } from 'react';
import { EntityPanel } from './EntityPanel';
import { ActionPanel } from './ActionPanel';
import { DocumentPanel } from './DocumentPanel';
import { MemoryPanel } from './MemoryPanel';
import { usePageContext } from '../../hooks/usePageContext';
import { useMemory } from '../../hooks/useMemory';
import { extractDomain } from '../../../shared/utils';

type Tab = 'entities' | 'actions' | 'documents' | 'memory';

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('entities');
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

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'entities', label: 'Entities', count: model?.entities?.length || 0 },
    { id: 'actions', label: 'Actions', count: model?.actions?.length || 0 },
    { id: 'documents', label: 'Docs', count: model?.documents?.length || 0 },
    { id: 'memory', label: 'Memory', count: memoriesList.length },
  ];

  const runAction = (label: string) => {
    // @ts-ignore
    window.electronAPI?.runTask?.({ intent: label });
  };

  return (
    <div className="h-full flex flex-col bg-[rgba(15,15,15,0.94)] backdrop-blur-[20px] text-white">
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Page Context</h2>
            <p className="text-xs text-gray-500 truncate max-w-[230px]">
              {model?.title || model?.url || 'Waiting for page'}
            </p>
          </div>
          <button
            onClick={refreshModel}
            className="px-2 py-1 text-xs rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-indigo-500 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 grid grid-cols-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-w-0 px-2 py-2.5 text-xs font-medium transition-colors border-b ${
              activeTab === tab.id
                ? 'text-white bg-[#242424] border-indigo-500'
                : 'text-gray-500 border-transparent hover:text-gray-200'
            }`}
          >
            <span className="block truncate">{tab.label}</span>
            <span className="mt-0.5 block text-[10px] text-gray-500">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'entities' && <EntityPanel entities={model?.entities || []} />}
        {activeTab === 'actions' && (
          <ActionPanel
            actions={model?.actions || []}
            onActionClick={(action) => runAction(`${action.type === 'submit' ? 'Submit' : 'Click'} ${action.label}`)}
          />
        )}
        {activeTab === 'documents' && (
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
      </div>

      <div className="flex-shrink-0 px-4 py-2 border-t border-[#2a2a2a] text-xs text-gray-500">
        <div className="flex items-center justify-between gap-3">
          <span>Intent</span>
          <span className="text-gray-300 font-medium truncate">{model?.pageIntent || 'unknown'}</span>
        </div>
      </div>
    </div>
  );
};
