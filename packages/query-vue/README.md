# @fari-brussels/query-vue

Small [TanStack Vue Query](https://tanstack.com/query/latest/docs/framework/vue/overview)
helpers for FARI apps — mutation factories that wire up cache invalidation so you
don't repeat it on every write.

## Install

```bash
pnpm add @fari-brussels/query-vue @tanstack/vue-query vue
```

## Usage

```ts
import { createMutation, createOptimisticMutation } from '@fari-brussels/query-vue'
import { queryKeys } from '@/api/queryKeys'

// Invalidate the asset list whenever an asset is created.
export const useCreateAsset = createMutation(
  (body: NewAsset) => apiClient.post('assets', { json: body }).json<Asset>(),
  [queryKeys.assets.all],
)

// In a component:
const { mutate, isPending } = useCreateAsset()
mutate(newAsset)
```

Optimistic update with rollback:

```ts
export const useRenameAsset = createOptimisticMutation(
  (vars: { id: string; name: string }) =>
    apiClient.patch(`assets/${vars.id}`, { json: { name: vars.name } }).json<Asset>(),
  {
    invalidateKeys: [queryKeys.assets.all],
    onMutate: (vars) => {
      /* snapshot + patch the cache, return a rollback context */
    },
    onError: (_err, _vars, ctx) => {
      /* restore from ctx */
    },
  },
)
```

## API

| Export                     | Notes                                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createMutation`           | `(mutationFn, invalidateKeys, options?)` → a `useMutation` hook that invalidates on success. Extra `useMutation` options merge; your `onSuccess` runs after invalidation. |
| `createOptimisticMutation` | `(mutationFn, { invalidateKeys, onMutate, onError })` → invalidates on success **and** settle for optimistic flows.                                                       |
