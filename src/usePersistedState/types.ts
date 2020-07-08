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
