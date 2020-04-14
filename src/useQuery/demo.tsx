import * as React from 'react'

import { useQuery, cache } from '.'

interface Resource {
  userId: number
  id: number
  title: string
  completed: boolean
}

const getRandomInt = (max: number): number => {
  return Math.floor(Math.random() * Math.floor(max)) + 1
}

const client = {
  async getResource({ id }: { id: number }): Promise<Resource> {
    const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)
    return await response.json()
  }
}

export const UseQueryDemo: React.FC = () => {
  const [id, setId] = React.useState(1)
  const query = useQuery(client.getResource, { args: { id } })

  if (query.loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Response:</b> {JSON.stringify(query.result)}
      </pre>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        <b>Cache:</b> {JSON.stringify(cache.cache)}
      </pre>
      <button
        onClick={(): void => {
          setId(getRandomInt(5))
        }}
      >
        Refresh Query
      </button>
    </>
  )
}
