import * as React from 'react'

import { useQuery } from '../../../src/useQuery'
import { queryCache } from '../../../src/queryCache'

export interface Resource {
  userId: number
  id: number
  title: string
  completed: boolean
}

export const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
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
  const [wait, setWait] = React.useState(true)

  const query = useQuery(client.getResource, {
    wait,
    args: { id },
    caching: { key: 'getResource', ttl: 10 }
  })

  React.useEffect(() => {
    window.setTimeout(() => setWait(false), 2000)
  }, [])
  console.log(query.loading)
  return (
    <>
      <button disabled={query.loading} onClick={() => setId(getRandomInt(5))}>
        Refresh Query
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
