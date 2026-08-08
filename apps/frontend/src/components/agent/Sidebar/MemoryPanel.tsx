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
        <div className="p-3 rounded-[10px] bg-[var(--color-subtle-soft)] border border-[var(--color-hairline)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-[var(--color-accent)] flex items-center justify-center text-[16px] text-white font-semibold shadow-sm">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-[590] text-[var(--color-ink)] truncate tracking-tight">{profile.name}</div>
              {profile.email && <div className="text-[11px] text-[rgba(46,46,46,0.5)] truncate">{profile.email}</div>}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-[590] text-[rgba(46,46,46,0.5)] uppercase tracking-[0.5px]">Memory</h3>
          {onAddMemory && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-[10px] font-medium px-2 py-1 rounded-[6px] bg-white border border-[var(--color-hairline)] text-[var(--color-ink)] hover:bg-[var(--color-subtle)] transition-colors shadow-sm"
            >
              {showAddForm ? 'Close' : 'Add'}
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-4 p-3 rounded-[10px] bg-white border border-[var(--color-hairline)] shadow-chip space-y-2">
            <input
              type="text"
              placeholder="Key"
              value={newKey}
              onChange={(event) => setNewKey(event.target.value)}
              className="w-full px-[8px] py-[6px] text-[11px] rounded-[6px] bg-[var(--color-subtle-soft)] text-[var(--color-ink)] border border-[var(--color-hairline)] focus:border-[var(--color-accent)] focus:bg-white focus:outline-none transition-colors"
              autoFocus
            />
            <input
              type="text"
              placeholder="Value"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              className="w-full px-[8px] py-[6px] text-[11px] rounded-[6px] bg-[var(--color-subtle-soft)] text-[var(--color-ink)] border border-[var(--color-hairline)] focus:border-[var(--color-accent)] focus:bg-white focus:outline-none transition-colors"
            />
            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 px-2 py-1.5 text-[11px] font-medium rounded-[6px] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)] transition-colors shadow-sm">
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2 py-1.5 text-[11px] font-medium rounded-[6px] bg-white border border-[var(--color-hairline)] text-[var(--color-ink)] hover:bg-[var(--color-subtle)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-[6px]">
          {memories.length === 0 && !showAddForm && (
            <div className="rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-subtle-soft)] p-[16px]">
              <h3 className="text-[12px] font-[590] text-[var(--color-ink)]">No memory for this domain</h3>
              <p className="mt-1 text-[11px] leading-[16px] text-[rgba(46,46,46,0.5)]">
                Successful tasks and saved preferences will appear here.
              </p>
            </div>
          )}

          {memories.map((memory) => (
            <div
              key={memory.id}
              className="group p-[12px] rounded-[10px] bg-white border border-[var(--color-hairline)] shadow-chip hover:border-[var(--color-accent)] transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-[rgba(46,46,46,0.4)] truncate tracking-[0.5px] uppercase mb-1">{memory.key}</div>
                  <div className="text-[12px] text-[var(--color-ink)] break-words leading-tight">{memory.value}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] text-[rgba(46,46,46,0.4)]">{formatTimestamp(memory.timestamp)}</span>
                    {memory.source && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[rgba(10,132,255,0.1)] text-[var(--color-accent-strong)] font-medium">
                        {memory.source}
                      </span>
                    )}
                  </div>
                </div>

                {onDeleteMemory && (
                  <button
                    onClick={() => onDeleteMemory(memory.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-red-500 hover:text-red-700 font-medium px-2 py-1 bg-red-50 rounded-[4px]"
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
