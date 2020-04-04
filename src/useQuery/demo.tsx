import * as React from 'react'

import { useQuery } from '.'

interface Todo {
  userId: number
  id: number
  title: string
  completed: boolean
}

class Client {
  constructor() {
    this.retrieveData = this.retrieveData.bind(this)
  }

  async retrieveData(): Promise<Todo> {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1')
    return await response.json()
  }
}

const client = new Client()

export const UseQueryDemo: React.FC = () => {
  const query = useQuery<Todo>({ method: client.retrieveData })
  console.log(query)

  if (query.loading) {
    return <div>Loading...</div>
  }

  return <pre>{query.result.title}</pre>
}
