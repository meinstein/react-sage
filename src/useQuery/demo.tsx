import * as React from 'react'

import { useQuery } from '.'

interface Resource {
  userId: number
  id: number
  title: string
  completed: boolean
}

const client = {
  async getResource({ id }: { id: number }): Promise<Resource> {
    const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)
    return await response.json()
  }
}

export const UseQueryDemo: React.FC = () => {
  const query = useQuery(client.getResource, { args: { id: 1 } })

  if (query.loading) {
    return <div>Loading...</div>
  }

  return <pre>{query.result.title}</pre>
}
