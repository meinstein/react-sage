import * as React from 'react'

import { useBatchQuery, cache } from '.'
import { client } from '../useQuery/demo'

export const UseBatchQueryDemo: React.FC = () => {
  const query = useBatchQuery(client.getResource, {
    args: [{ id: 1 }, { id: 1 }, { id: 1 }],
    caching: { key: 'getResources', ttl: 10 }
  })

  return (
    <>
      <button
        disabled={query.loading}
        onClick={(): void => {
          query.refresh()
        }}
      >
        Refresh Query
      </button>
      {<pre>{query.loading ? 'Query loading...' : 'Query successful!'}</pre>}
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Response:</b> {JSON.stringify(query.result)}
      </pre>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Query Cache:</b> {JSON.stringify(cache.cache)}
      </pre>
    </>
  )
}
