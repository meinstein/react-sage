# react-sage

Handy-dandy hooks.

## Use

```bash
# Install
npm i react-sage
```

```jsx
// Import specific hooks one by one.
import { useForm } from 'react-sage/useForm'
import { useQuery } from 'react-sage/useQuery'
import { useMutation } from 'react-sage/useMutation'
import { useFilePicker } from 'react-sage/useFilePicker'
import { usePersistedState } from 'react-sage/usePersistedState'
```

## Demo

Each hook has a small demo included (see `src/{useHookName}/demo.tsx` for more details).

You can also run a stand-alone demo environment as follows:

```bash
# Starts dev server on http://localhost:1234
npm run demo
```
