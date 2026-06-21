/**
 * Central query key registry.
 *
 * All keys are functions so they compose predictably and can be
 * individually or collectively invalidated from anywhere in the app:
 *
 *   queryClient.invalidateQueries({ queryKey: queryKeys.orders.byUser(uid) })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
 *
 * Key hierarchy (used for partial-match invalidation):
 *
 *   ['products']                    → invalidates everything products-related
 *   ['products', 'list']            → the main product list
 *
 *   ['orders']                      → invalidates all order queries
 *   ['orders', uid]                 → orders for a specific user
 *   ['orders', 'admin']             → all orders (admin view)
 *
 *   ['profile']                     → invalidates all profile queries
 *   ['profile', uid]                → profile for a specific user
 *
 *   ['cart']                        → invalidates all cart queries
 *   ['cart', uid]                   → cloud cart for a specific user
 */
export const queryKeys = {
  products: {
    all:  ['products'],
    list: () => ['products', 'list'],
  },
  orders: {
    all:     ['orders'],
    byUser:  (uid) => ['orders', uid],
    admin:   () => ['orders', 'admin'],
  },
  profile: {
    all:    ['profile'],
    byUser: (uid) => ['profile', uid],
  },
  cart: {
    all:    ['cart'],
    byUser: (uid) => ['cart', uid],
  },
};
