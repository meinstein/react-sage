import * as React from 'react'

import { sleep } from '../../../src/utils'
import { useQuery } from '../../../src/useQuery'
import { queryCache } from '../../../src/queryCache'

export interface Resource {
  userId: number
  id: number
  title: string
  completed: boolean
}

const getRandomInt = (max: number): number => {
  return Math.floor(Math.random() * Math.floor(max)) + 1
}

export const client = {
  async getResource({ id }: { id: number }): Promise<Resource> {
    await sleep(2000)
    return Promise.resolve({
      id,
      userId: Math.floor(Math.random() * 100),
      title: 'quis ut nam facilis et officia qui',
      completed: false
    })
  }
}

export const UseQueryDemo: React.FC = () => {
  const [id, setId] = React.useState(1)
  const [delay, setDelay] = React.useState(null)
  const [wait, setWait] = React.useState(true)

  const query = useQuery(client.getResource, {
    wait,
    retries: 2,
    polling: { delay },
    args: { id },
    caching: { key: 'getResource', ttl: 10 }
  })

  React.useEffect(() => {
    console.log('[useQuery] isWaiting: true')
    window.setTimeout(() => setWait(false), 2000)
    console.log('[useQuery] isWaiting: false')
  }, [])

  console.log('[useQuery] isLoading:', query.loading)

  return (
    <>
      <button disabled={query.loading} onClick={() => setId(getRandomInt(5))}>
        Refresh Query
      </button>
      <button disabled={delay !== null} onClick={() => setDelay(2000)}>
        Start Polling (2000ms)
      </button>
      <button disabled={delay === null} onClick={() => setDelay(null)}>
        Stop Polling
      </button>
      <pre>{query.loading && 'Query loading...'}</pre>
      <pre>{!query.loading && query.result && 'Query completed!'}</pre>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Response:</b> {JSON.stringify(query.result)}
      </pre>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Query Cache Order:</b> {JSON.stringify(queryCache.order)}
      </pre>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Query Cache:</b> {JSON.stringify(queryCache.cache)}
      </pre>
    </>
  )
}
