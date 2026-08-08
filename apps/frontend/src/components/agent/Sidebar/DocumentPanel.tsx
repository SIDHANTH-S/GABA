import React from 'react';
import { DetectedDocument } from '../../../shared/types';

interface DocumentPanelProps {
  documents: DetectedDocument[];
  onExtractDocument?: (doc: DetectedDocument) => void;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  onExtractDocument,
}) => {
  if (documents.length === 0) {
    return (
      <div className="rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-subtle-soft)] p-[16px]">
        <h3 className="text-[12px] font-[590] text-[var(--color-ink)]">No documents found</h3>
        <p className="mt-1 text-[11px] leading-[16px] text-[rgba(46,46,46,0.5)]">
          PDFs, invoices, bills, reports, and spreadsheets will appear here when detected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[6px]">
      {documents.map((doc) => (
        <div
          key={`${doc.type}:${doc.url}`}
          className="p-[12px] rounded-[10px] bg-white border border-[var(--color-hairline)] shadow-chip"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[12px] text-[var(--color-ink)] font-[590] truncate tracking-tight">{doc.title || 'Untitled document'}</div>
              <div className="mt-[2px] text-[11px] text-[rgba(46,46,46,0.6)] truncate">{doc.type}</div>
              <div className="mt-1 text-[9px] text-[rgba(46,46,46,0.4)] truncate">{doc.url}</div>
            </div>
            {onExtractDocument && (
              <button
                onClick={() => onExtractDocument(doc)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-[6px] bg-white border border-[var(--color-hairline)] text-[var(--color-ink)] hover:bg-[var(--color-subtle)] transition-colors shadow-sm"
              >
                Open
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
