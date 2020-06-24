import * as React from 'react'

import { useBatchQuery } from '.'
import { client } from '../useQuery/demo'
import { cache } from '../useQuery/cache'

export const UseBatchQueryDemo: React.FC = () => {
  const args = [{ id: 1 }, { id: 2 }, { id: 3 }]
  const query = useBatchQuery(client.getResource, {
    args,
    caching: { key: 'getResources', ttl: 100 }
  })

  return (
    <>
      <button disabled={query.loading} onClick={() => query.refresh()}>
        Refresh Query
      </button>
      {<pre>{query.loading ? 'Batch Query loading...' : 'Batch Query successful!'}</pre>}
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Response:</b> {JSON.stringify(query.result)}
      </pre>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Query Cache:</b> {JSON.stringify(cache.cache)}
      </pre>
    </>
  )
}
