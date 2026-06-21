import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCloudCart, syncCartToCloud } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

/**
 * useCartQuery — manages cloud cart synchronisation via React Query.
 *
 * The CART is unusual: the source of truth for UI state is a useReducer in
 * CartContext (for instant local updates). React Query handles only the
 * cloud I/O layer:
 *
 *  READ  → useQuery fetches the merged cloud+local cart on sign-in.
 *  WRITE → useMutation debounces the sync to Supabase.
 *
 * staleTime = 0 means the cloud cart is always considered stale and will
 * be re-fetched whenever the component mounts — i.e. on every sign-in.
 * This ensures the cart is always merged with the latest server state.
 *
 * @param {string|null} userId
 */
export function useCartQuery(userId) {
  const queryClient = useQueryClient();

  // ── Fetch (load + merge) cloud cart ────────────────────────────────────
  const {
    data: cloudCart = null,
    isLoading: isLoadingCloud,
    error: loadError,
    refetch: refetchCloud,
  } = useQuery({
    queryKey:  queryKeys.cart.byUser(userId),
    queryFn:   () => fetchCloudCart(userId),
    enabled:   !!userId,
    staleTime: 0,              // always stale → re-fetch on every sign-in mount
    gcTime:    5 * 60 * 1000,
  });

  // ── Sync mutation (write local items → cloud) ───────────────────────────
  const syncMutation = useMutation({
    mutationFn: (items) => syncCartToCloud(userId, items),
    onError: (err) => {
      console.error('[useCartQuery] cart sync error:', err.message);
    },
  });

  return {
    cloudCart,
    isLoadingCloud,
    loadError:    loadError?.message ?? null,
    refetchCloud,
    syncCart:     (items) => syncMutation.mutate(items),
    isSyncing:    syncMutation.isPending,
    // Allow callers to invalidate / clear the cart cache on sign-out
    clearCartCache: () => queryClient.removeQueries({ queryKey: queryKeys.cart.byUser(userId) }),
  };
}
