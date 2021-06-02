import * as React from 'react'

import { useBatchQuery } from '../../../src/useBatchQuery'
import { queryCache } from '../../../src/queryCache'
import { client } from '../useQuery/demo'

queryCache.configure({ maxAge: 5, maxSize: 100, type: 'LOCAL_STORAGE' })

export const UseBatchQueryDemo: React.FC = () => {
  const [delay, setDelay] = React.useState(null)
  const args = [{ id: 1 }, { id: 2 }, { id: 3 }]
  const query = useBatchQuery(client.getResource, {
    args,
    polling: { delay },
    caching: { key: 'getResources', ttl: 10 }
  })

  return (
    <>
      <button disabled={query.loading} onClick={() => query.refresh()}>
        Refresh Query
      </button>
      <button disabled={delay !== null} onClick={() => setDelay(2000)}>
        Start Polling (2000ms)
      </button>
      <button disabled={delay === null} onClick={() => setDelay(null)}>
        Stop Polling
      </button>
      <button disabled={delay === null} onClick={() => setDelay(null)}>
        Stop Polling
      </button>
      {<pre>{query.loading ? 'Batch Query loading...' : 'Batch Query successful!'}</pre>}
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Response:</b> {JSON.stringify(query.result)}
      </pre>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Query Cache (from localStorage):</b> {JSON.stringify(Array.from(queryCache.cache.entries()))}
      </pre>
    </>
  )
}
