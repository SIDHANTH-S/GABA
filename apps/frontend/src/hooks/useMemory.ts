/**
 * renderer/hooks/useMemory.ts
 * Hook for memory operations
 * Dependencies: react, shared/types
 */

import { useCallback, useEffect, useState } from 'react';
import type { UserProfile, DomainMemory } from '../shared/types';

export function useMemory() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [domainMemory, setDomainMemory] = useState<DomainMemory | null>(null);
  
  const loadProfile = useCallback(async () => {
    try {
      // @ts-ignore
      const p = await window.electronAPI?.getUserProfile?.();
      setProfile(p);
    } catch (err) {
      console.error('[useMemory] Failed to load profile:', err);
    }
  }, []);
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  const updateProfile = useCallback(async (update: Partial<UserProfile>) => {
    try {
      // @ts-ignore
      await window.electronAPI?.setUserProfile?.(update);
      // Reload profile
      // @ts-ignore
      const p = await window.electronAPI?.getUserProfile?.();
      setProfile(p);
    } catch (err) {
      console.error('[useMemory] Failed to update profile:', err);
    }
  }, []);
  
  const loadDomainMemory = useCallback(async (domain: string) => {
    try {
      // @ts-ignore
      const mem = await window.electronAPI?.getDomainMemory?.({ domain });
      setDomainMemory(mem);
    } catch (err) {
      console.error('[useMemory] Failed to load domain memory:', err);
    }
  }, []);
  
  return {
    profile,
    domainMemory,
    updateProfile,
    loadDomainMemory,
  };
}
