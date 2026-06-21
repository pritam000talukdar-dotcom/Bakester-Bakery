import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOrdersByUser,
  fetchAllOrders,
  cancelOrder,
  updateOrderStatus,
  markOrderReadyForPickup,
  adminCancelOrder,
  placeOrder,
} from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

/**
 * useOrdersQuery — user-facing orders hook.
 *
 * Caches orders per-user for 2 min. Mutations (cancel, place) automatically
 * invalidate the cache so both Orders page and Profile page see fresh data
 * without an extra network call.
 *
 * @param {string|null} userId - The authenticated user's ID
 */
export function useOrdersQuery(userId) {
  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey:  queryKeys.orders.byUser(userId),
    queryFn:   () => fetchOrdersByUser(userId),
    enabled:   !!userId,
    staleTime: 2 * 60 * 1000,   // orders are more dynamic → 2 min stale
    gcTime:    5 * 60 * 1000,
  });

  // ── Cancel Order mutation ───────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: (orderId) => cancelOrder(orderId),
    // Optimistic update: flip the status immediately in the cache
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.byUser(userId) });
      const previous = queryClient.getQueryData(queryKeys.orders.byUser(userId));
      queryClient.setQueryData(queryKeys.orders.byUser(userId), (old = []) =>
        old.map((o) => o.id === orderId ? { ...o, status: 'Cancelled' } : o)
      );
      return { previous };
    },
    onError: (_err, _orderId, context) => {
      // Roll back on failure
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.orders.byUser(userId), context.previous);
      }
    },
    onSettled: () => {
      // Always re-sync with DB after mutation settles
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byUser(userId) });
    },
  });

  // ── Place Order mutation ────────────────────────────────────────────────
  const placeMutation = useMutation({
    mutationFn: (payload) => placeOrder(payload),
    onSuccess: () => {
      // Invalidate this user's orders so Orders / Profile show the new entry
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byUser(userId) });
      // Also invalidate admin's all-orders view
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.admin() });
    },
  });

  return {
    orders,
    isLoading,
    isFetching,
    error: error?.message ?? null,
    refetch,
    // Cancel
    cancelOrder:    (orderId) => cancelMutation.mutateAsync(orderId),
    isCancelling:   cancelMutation.isPending,
    // Place
    placeOrder:     (payload) => placeMutation.mutateAsync(payload),
    isPlacingOrder: placeMutation.isPending,
    placeError:     placeMutation.error?.message ?? null,
  };
}

/**
 * useAdminOrdersQuery — all orders for the admin dashboard.
 *
 * Separate query key from user orders so they can be invalidated independently.
 * staleTime is short (30 s) because admins need near-real-time accuracy.
 * Realtime handles the rest via surgical setQueryData updates in AdminDashboard.
 */
export function useAdminOrdersQuery() {
  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey:  queryKeys.orders.admin(),
    queryFn:   fetchAllOrders,
    staleTime: 30 * 1000,        // 30 s — admins want fresh data
    gcTime:    5 * 60 * 1000,
  });

  // ── Admin: update status ────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.admin() });
      const previous = queryClient.getQueryData(queryKeys.orders.admin());
      queryClient.setQueryData(queryKeys.orders.admin(), (old = []) =>
        old.map((o) => o.id === orderId ? { ...o, status } : o)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.orders.admin(), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.admin() });
      // Also refresh user-facing order caches so statuses stay in sync
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  // ── Admin: mark ready for pickup ────────────────────────────────────────
  const readyForPickupMutation = useMutation({
    mutationFn: (orderId) => markOrderReadyForPickup(orderId),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.admin() });
      const previous = queryClient.getQueryData(queryKeys.orders.admin());
      queryClient.setQueryData(queryKeys.orders.admin(), (old = []) =>
        old.map((o) => o.id === orderId ? { ...o, ready_for_pickup: true, status: 'Shipped' } : o)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.orders.admin(), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.admin() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  // ── Admin: cancel order ─────────────────────────────────────────────────
  const cancelAdminMutation = useMutation({
    mutationFn: (orderId) => adminCancelOrder(orderId),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.admin() });
      const previous = queryClient.getQueryData(queryKeys.orders.admin());
      queryClient.setQueryData(queryKeys.orders.admin(), (old = []) =>
        old.map((o) => o.id === orderId ? { ...o, status: 'Cancelled', cancelled_by_admin: true } : o)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.orders.admin(), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.admin() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  return {
    orders,
    isLoading,
    isFetching,
    error: error?.message ?? null,
    refetch,
    updateStatus:          ({ orderId, status }) => statusMutation.mutateAsync({ orderId, status }),
    markReadyForPickup:    (orderId) => readyForPickupMutation.mutateAsync(orderId),
    cancelOrder:           (orderId) => cancelAdminMutation.mutateAsync(orderId),
    isUpdatingStatus:      statusMutation.isPending,
    isMarkingReady:        readyForPickupMutation.isPending,
    isCancellingOrder:     cancelAdminMutation.isPending,
  };
}
