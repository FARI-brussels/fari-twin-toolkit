import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationReturnType,
} from '@tanstack/vue-query'

/** The lifecycle callbacks {@link createMutation} forwards alongside invalidation. */
export interface MutationCallbacks<TData, TVariables, TError> {
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => void
  onError?: (error: TError, variables: TVariables, context: unknown) => void
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: unknown,
  ) => void
}

/**
 * Build a mutation hook that invalidates the given query keys on success — the
 * everyday "write, then refetch what it touched" pattern without the
 * boilerplate.
 *
 * Improvement over the original app helper: accepts extra lifecycle callbacks
 * (`onError` / `onSuccess` / `onSettled`), merged so invalidation still runs and
 * then your `onSuccess` fires.
 *
 * @param mutationFn     performs the write
 * @param invalidateKeys query keys to invalidate once it succeeds
 * @param callbacks      extra lifecycle callbacks
 */
export function createMutation<TData, TVariables = void, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys: QueryKey[],
  callbacks: MutationCallbacks<TData, TVariables, TError> = {},
) {
  return (): UseMutationReturnType<TData, TError, TVariables, unknown> => {
    const queryClient = useQueryClient()
    return useMutation<TData, TError, TVariables>({
      mutationFn,
      onError: callbacks.onError,
      onSettled: callbacks.onSettled,
      onSuccess: (data, variables, context) => {
        for (const key of invalidateKeys) void queryClient.invalidateQueries({ queryKey: key })
        callbacks.onSuccess?.(data, variables, context)
      },
    })
  }
}

/**
 * Like {@link createMutation}, but for optimistic updates: snapshot/patch the
 * cache in `onMutate`, roll back in `onError`, and invalidate on both success
 * and settle so the server's truth wins in the end.
 */
export function createOptimisticMutation<TData, TVariables, TContext = unknown, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    invalidateKeys: QueryKey[]
    onMutate?: (variables: TVariables) => Promise<TContext> | TContext
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void
  },
) {
  return (): UseMutationReturnType<TData, TError, TVariables, TContext> => {
    const queryClient = useQueryClient()
    const invalidate = () => {
      for (const key of options.invalidateKeys)
        void queryClient.invalidateQueries({ queryKey: key })
    }
    return useMutation<TData, TError, TVariables, TContext>({
      mutationFn,
      onMutate: options.onMutate,
      onError: options.onError,
      onSuccess: invalidate,
      onSettled: invalidate,
    })
  }
}
