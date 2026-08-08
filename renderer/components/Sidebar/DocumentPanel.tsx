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
      <div className="rounded-md border border-[#2a2a2a] bg-[#111111] p-4">
        <h3 className="text-sm font-medium text-white">No documents found</h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          PDFs, invoices, bills, reports, and spreadsheets will appear here when detected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={`${doc.type}:${doc.url}`}
          className="p-2.5 rounded-md bg-[#111111] border border-[#242424]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm text-white font-medium truncate">{doc.title || 'Untitled document'}</div>
              <div className="mt-1 text-xs text-gray-500 truncate">{doc.type}</div>
              <div className="mt-1 text-[10px] text-gray-600 truncate">{doc.url}</div>
            </div>
            {onExtractDocument && (
              <button
                onClick={() => onExtractDocument(doc)}
                className="px-2 py-1 text-xs rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-indigo-500 transition-colors"
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
