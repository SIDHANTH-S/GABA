/**
 * renderer/components/CommandBar/SuggestionList.tsx
 * Context-aware command suggestions
 */

import React from 'react';
import type { PageIntent } from '../../../shared/types';

interface SuggestionListProps {
  pageIntent: PageIntent;
  onSelect: (suggestion: string) => void;
}

export function SuggestionList({ pageIntent, onSelect }: SuggestionListProps) {
  const suggestions = getSuggestionsForIntent(pageIntent);
  
  return (
    <div className="border-t border-[#2a2a2a] max-h-56 overflow-y-auto py-1">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-[#242424] transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

/**
 * Get context-aware suggestions based on page intent
 */
function getSuggestionsForIntent(intent: PageIntent): string[] {
  const intentSuggestions: Record<PageIntent, string[]> = {
    'form-fill': [
      'Fill out this form with my profile',
      'Fill name and email fields',
      'Complete this form',
      'Auto-fill shipping address',
    ],
    checkout: [
      'Fill my shipping address',
      'Review checkout details',
      'Extract order summary',
      'Save order confirmation',
    ],
    'product-listing': [
      'Find the cheapest item',
      'Extract all products to CSV',
      'Show me items under $50',
      'Sort by price',
    ],
    article: [
      'Extract article as text',
      'Summarize this article',
      'Save to reading list',
      'Export as markdown',
    ],
    document: [
      'Download this document',
      'Extract text content',
      'Save PDF',
      'Summarize document',
    ],
    search: [
      'Filter results',
      'Click first result',
      'Extract search results',
      'Refine search',
    ],
    dashboard: [
      'Navigate to settings',
      'Extract data table',
      'Take screenshot',
      'Export dashboard data',
    ],
    login: [
      'Fill login credentials',
      'Submit login form',
      'Remember password',
      'Auto-login',
    ],
    unknown: [
      'Fill out form',
      'Extract page data',
      'Navigate to...',
      'Click button',
    ],
  };
  
  return intentSuggestions[intent] || intentSuggestions.unknown;
}
