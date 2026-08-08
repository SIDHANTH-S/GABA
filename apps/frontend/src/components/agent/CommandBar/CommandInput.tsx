/**
 * renderer/components/CommandBar/CommandInput.tsx
 * Command input with autofocus
 */

import React, { useState, useRef, useEffect } from 'react';

interface CommandInputProps {
  onSubmit: (value: string) => void;
  isLoading: boolean;
}

export function CommandInput({ onSubmit, isLoading }: CommandInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Autofocus on mount
    inputRef.current?.focus();
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What do you want to do?"
        disabled={isLoading}
        className={`w-full h-14 px-4 bg-transparent text-white placeholder-gray-500 text-base font-mono outline-none ${
          isLoading ? 'border-l-4 border-indigo-500 animate-pulse' : ''
        }`}
      />
      
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </form>
  );
}
