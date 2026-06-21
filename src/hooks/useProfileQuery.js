import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfileApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

/**
 * useProfileQuery — fetches and mutates a user's profile.
 *
 * Cached for 5 min. On successful updateProfile mutation the cache is
 * updated in-place (setQueryData) so the UI reflects the change instantly
 * without a round-trip refetch.
 *
 * Profile data drives:
 *  - The profile form in Profile.jsx
 *  - The checkout form pre-fill in Cart.jsx
 *  - The isAdmin flag in AuthContext and AdminRoute
 *
 * @param {string|null} userId
 */
export function useProfileQuery(userId) {
  const queryClient = useQueryClient();

  const {
    data: profile = null,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey:  queryKeys.profile.byUser(userId),
    queryFn:   () => fetchProfile(userId),
    enabled:   !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });

  // ── Update profile mutation ────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (updates) => updateProfileApi(userId, updates),
    onSuccess: (updatedProfile) => {
      // Write the fresh record directly into the cache — no refetch needed
      queryClient.setQueryData(queryKeys.profile.byUser(userId), updatedProfile);
    },
    onError: (err) => {
      console.error('[useProfileQuery] updateProfile error:', err.message);
    },
  });

  return {
    profile,
    isAdmin:       profile?.is_admin === true,
    isLoading,
    isFetching,
    error:         error?.message ?? null,
    refetch,
    updateProfile: (updates) => updateMutation.mutateAsync(updates),
    isSaving:      updateMutation.isPending,
    saveError:     updateMutation.error?.message ?? null,
  };
}
