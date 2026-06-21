import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton QueryClient — imported everywhere a queryClient reference is needed
 * outside of the React tree (e.g. to imperatively invalidate after a mutation).
 *
 * Cache strategy per data type:
 *  • products  → 5 min stale / 10 min GC  (public catalogue, changes rarely)
 *  • orders    → 2 min stale / 5 min GC   (user-specific, changes on actions)
 *  • profile   → 5 min stale / 10 min GC  (rarely changes after save)
 *  • cart      → 0 stale (always re-sync on mount)  — managed by CartContext
 *
 * refetchOnWindowFocus is OFF globally — the bakery app is not a dashboard
 * that needs second-by-second accuracy. Realtime subscriptions handle live updates.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            5 * 60 * 1000,  // 5 min
      gcTime:               10 * 60 * 1000, // 10 min (formerly cacheTime)
      retry:                1,
      refetchOnWindowFocus: false,
      refetchOnReconnect:   true,
    },
    mutations: {
      retry: 0,
    },
  },
});
