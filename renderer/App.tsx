/**
 * App.tsx
 * Main application container.
 */

import React, { useEffect, useState } from 'react';
import { HUD } from './components/HUD/HUD';
import { CommandBar } from './components/CommandBar/CommandBar';
import { CheckpointModal } from './components/Checkpoint/CheckpointModal';
import { Sidebar } from './components/Sidebar/Sidebar';
import { useAgent } from './hooks/useAgent';
import { useCommandBar } from './hooks/useCommandBar';
import { usePageContext } from './hooks/usePageContext';

export const App: React.FC = () => {
  const { agentState, submitTask } = useAgent();
  const { isOpen: isCommandBarOpen, open: openCommandBar, close: closeCommandBar } = useCommandBar();
  const { model } = usePageContext();
  const [urlInput, setUrlInput] = useState('https://example.com');

  useEffect(() => {
    if (model?.url) setUrlInput(model.url);
  }, [model?.url]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isCommandBarOpen) closeCommandBar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandBarOpen, closeCommandBar]);

  const handleNavigateSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!urlInput.trim()) return;
    // @ts-ignore
    window.electronAPI?.navigatePage?.(urlInput.trim());
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] text-white">
      <div className="h-12 flex-shrink-0 bg-[#111111] border-b border-[#2a2a2a] flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center font-semibold text-xs text-indigo-300">
            AI
          </div>
          <span className="text-xs font-semibold text-gray-200">Execution Browser</span>
        </div>

        <form onSubmit={handleNavigateSubmit} className="flex-1 max-w-2xl">
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-[10px] font-medium text-gray-500">URL</span>
            <input
              type="text"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="Enter URL"
              className="w-full pl-10 pr-16 py-1.5 text-xs rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-0.5 text-[10px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors cursor-pointer"
            >
              Go
            </button>
          </div>
        </form>

        <button
          onClick={() => (isCommandBarOpen ? closeCommandBar() : openCommandBar())}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors cursor-pointer flex-shrink-0"
        >
          <span>Run</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-black/25 rounded text-indigo-100 font-mono">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          {agentState.status === 'idle' && !isCommandBarOpen && (
            <div className="absolute bottom-4 left-4 flex gap-2 z-20">
              <button
                onClick={() => submitTask('Search for flights from SFO to NYC')}
                className="px-3 py-1.5 rounded-md bg-[#111111]/90 border border-[#2a2a2a] hover:border-indigo-500 backdrop-blur-md text-xs text-gray-200 shadow-xl transition-colors cursor-pointer"
              >
                Book Flight Demo
              </button>
              <button
                onClick={() => submitTask('Search for hotels in Paris')}
                className="px-3 py-1.5 rounded-md bg-[#111111]/90 border border-[#2a2a2a] hover:border-indigo-500 backdrop-blur-md text-xs text-gray-200 shadow-xl transition-colors cursor-pointer"
              >
                Find Paris Hotels
              </button>
            </div>
          )}
        </div>

        <div className="w-[340px] flex-shrink-0 h-full border-l border-[#2a2a2a]">
          <Sidebar />
        </div>
      </div>

      <HUD />
      <CommandBar />
      <CheckpointModal />
    </div>
  );
};
