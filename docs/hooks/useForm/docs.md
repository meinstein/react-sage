# useForm

This hook handles form-related state. To use it, you must provide it with your form's initial state such that all keys and the type for each key are known. Optionally, you can provide validators for any (or none) of the form keys.

```js
const form = useForm({
  initialState: {
    email: '',
    password: ''
  },
  validators: {
    email: (val) => !isEmail(val),
    password: (val) => !val
  }
})
```

This hook returns an object with a mixture of methods and data. See the below snippet for further details:

```js
const {
  set,
  hasErrors,
  data,
  reset,
  getValue,
  getError,
  isFieldDirty,
  isDirty,
} = useForm({
    initialState: {...},
    validators: {...}
  })
```
