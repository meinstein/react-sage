export interface CachingOptions {
  refreshOnMount?: boolean
  // in seconds
  ttl?: number
}

interface MethodArgs {
  [key: string]: string | number
}

export interface Options {
  args?: MethodArgs
  caching?: CachingOptions
  retries?: number
}

export interface QueryArgs<T> {
  method: (...args: MethodArgs[]) => Promise<T>
  wait?: boolean
  options?: Options
}

export interface QueryResult<T> {
  result: T | null
  error: Error | null
  loading: boolean
  refresh: () => Promise<void>
}
