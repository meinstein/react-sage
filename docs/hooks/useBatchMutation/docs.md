# useBatchMutation

**_NOTE: See tests at `src/hooks/useBatchMutation.test.tsx`_**

This hook is closely related to [useMutation](../useMutation/docs.md) with the exception that it accepts multiple args per invocation.

For example:

```js
// A normal mutation accepts a single arg.
const mutation = useMutation(api.users.update)
mutation.invoke({ id: 1, name: 'foo' })

// A batch mutation accepts a list of args.
const batchMutation = useBatchMutation(api.users.update)
mutation.invoke([
  { id: 1, name: 'foo' },
  { id: 2, name: 'bar' }
])
```

The rest of this hook's API is identical to `useMutation`.
