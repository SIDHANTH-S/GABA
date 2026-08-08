import React, { useState } from 'react';

export interface MemoryEntry {
  id: number;
  key: string;
  value: string;
  timestamp: string;
  source?: string;
}

interface MemoryPanelProps {
  profile: { name: string; email?: string } | null;
  memories: MemoryEntry[];
  onAddMemory?: (key: string, value: string) => void;
  onDeleteMemory?: (id: number) => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  profile,
  memories,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newKey.trim() || !newValue.trim() || !onAddMemory) return;
    onAddMemory(newKey.trim(), newValue.trim());
    setNewKey('');
    setNewValue('');
    setShowAddForm(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {profile && (
        <div className="p-3 rounded-md bg-[#111111] border border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center text-sm font-semibold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{profile.name}</div>
              {profile.email && <div className="text-xs text-gray-500 truncate">{profile.email}</div>}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase">Memory</h3>
          {onAddMemory && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs px-2 py-1 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-indigo-500 transition-colors"
            >
              {showAddForm ? 'Close' : 'Add'}
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-3 p-3 rounded-md bg-[#111111] border border-[#2a2a2a] space-y-2">
            <input
              type="text"
              placeholder="Key"
              value={newKey}
              onChange={(event) => setNewKey(event.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-md bg-black/30 text-white border border-[#2a2a2a] focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            <input
              type="text"
              placeholder="Value"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-md bg-black/30 text-white border border-[#2a2a2a] focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 px-2 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors">
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2 py-1.5 text-xs rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1.5">
          {memories.length === 0 && !showAddForm && (
            <div className="rounded-md border border-[#2a2a2a] bg-[#111111] p-4">
              <h3 className="text-sm font-medium text-white">No memory for this domain</h3>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Successful tasks and saved preferences will appear here.
              </p>
            </div>
          )}

          {memories.map((memory) => (
            <div
              key={memory.id}
              className="group p-2.5 rounded-md bg-[#111111] border border-[#242424] hover:border-indigo-500/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-500 truncate">{memory.key}</div>
                  <div className="text-sm text-white mt-0.5 break-words">{memory.value}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-600">{formatTimestamp(memory.timestamp)}</span>
                    {memory.source && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        {memory.source}
                      </span>
                    )}
                  </div>
                </div>

                {onDeleteMemory && (
                  <button
                    onClick={() => onDeleteMemory(memory.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-300"
                    title="Delete memory"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
