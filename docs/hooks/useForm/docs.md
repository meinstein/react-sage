# useForm

This hook simplifies the logic form state. To use, you must provide the form's initial state such that all keys and the type for each key are known. You may also optionally provide a validator for any or none of the provided form keys.

```js
const form = useForm({
  initialState: {
    email: '',
    password: ''
  },
  validators: {
    email: (val) => {
      return !isEmail(val)
    }
  }
})
```
