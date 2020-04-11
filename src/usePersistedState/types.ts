export interface UsePersistedStateStorageOptions {
  storage: Storage
  key: string
  version?: number
}

export interface UsePersistedStateOptions<S> extends UsePersistedStateStorageOptions {
  initialState?: S
}

export interface PersistedStateData<S> {
  version: number
  data: S
}

// Dispatch and SetStateAction are lifted directly from React types.
export type Dispatch<S> = (value: S | ((prevState: S) => S)) => void
export type SetStateAction<S> = S | ((prevState: S) => S)
