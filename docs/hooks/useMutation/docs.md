# useMutation

**_NOTE: See tests at `src/hooks/useMutation.test.tsx`_**

This hook invokes methods that are typically associated with mutating data. The only required argument is the method to call. Optionally, you can provide an onSuccess and/or onError callback.

```js
const api = {
  users: {
    update: (args) => {...}
  }
}
const updateUser = useMutation(api.users.update, onSuccess, onError)
```

This hook returns a plan object with a variety of methods for both controlling and introspecting its progress.

```js
const {
  // How you call the underlying method that mutates the data.
  invoke,
  // A list of previous invocations.
  invocations,
  // A way to reset the hook's internal state (ie, clear all past invocations and data results)
  reset,
  result: { loading, response, error }
} = useMutation(api.users.update, onSuccess, onError)
```

Use the provided invoke method and pass in the necessary args.

```js
const updateUser = useMutation(api.users.update)
updateUser.invoke({ id: 1, name: 'foo' })
```
