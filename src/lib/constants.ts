// Centralized localStorage keys to prevent typos and make refactoring easier
export const STORAGE_KEYS = {
  MOCK_USER: 'machine-brain-mock-user',
  CART: 'machine-brain-cart',
  COLLECTION_SETS: 'machine-brain-sets',
  ACHIEVEMENTS: 'machine-brain-achievements',
  ACTIVE_ACHIEVEMENTS: 'machine-brain-active-achievements',
  UNLOCKED_STORIES: 'machine-brain-unlocked-stories',
  LAST_PROVIDER: 'machine-brain-last-provider',
} as const;

// Cookie names
export const COOKIE_NAMES = {
  MOCK_USER: 'machine-brain-mock-user',
} as const;

// Helper to generate user-specific storage keys
export const getUserStorageKey = (baseKey: string, userId: string) => 
  `${baseKey}-${userId}`;

