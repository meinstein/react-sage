# useQuery

**_NOTE: See tests at `src/hooks/useBatchQuery.test.tsx`_**

This hook is used to perform queries in a declarative manner. This hook requires the following:

- a) a method to invoke, and
- b) args to pass into said method upon invocation

```js
const api = {
  users: {
    retrieveById: (args: { id: string }) => {...}
  }
}
const updateUser = useQuery(api.users.retrieveById, { args: { id: 1 } } )
```

This hook will fetch data as soon as it mounts (unless specified otherwise - see `wait` option).

```js
const {
  // The anticipated data to be returned by the method (typed)
  result,
  // Any errors caught in the hook's try/catch
  error,
  // Whether the query is actively pending
  loading,
  // A way to re-trigger the network query (bypasses the cached result if it is available)
  refresh,
} = useQuery(api.users.retrieveById, {
  // required - the args to pass into the query's method upon invocation
  args: { id: 1 },
  // optional (default true) - whether the query should wait before being invoked (good to control flow in dependent situations)
  wait: true,
  // optional - whether to poll the query on some interval
  polling: { delay: 10000 },
  // optional (default 0) - the number of times to retry to the query before throwing
  retries: 3
  // optional
  caching: {
    // whether you want to cache the query's results - to do so, provide a key.
    // NOTE: the provided key is combined with the args in order to create a unique key per query under the hood.
    key: "GET_USER_BY_ID",
    // the amount of time in MS to keep the cached result for this query warm
    ttl: 60000
  }
})
```
