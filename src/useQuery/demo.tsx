import * as React from 'react'

import { useQuery } from '.'

interface Resource {
  userId: number
  id: number
  title: string
  completed: boolean
}

const client = {
  async getResource(): Promise<Resource> {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1')
    return await response.json()
  }
}

export const UseQueryDemo: React.FC = () => {
  const query = useQuery<Resource>(client.getResource)

  if (query.loading) {
    return <div>Loading...</div>
  }

  return <pre>{query.result.title}</pre>
}
