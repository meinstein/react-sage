import * as React from 'react'

import { useMutation } from '.'

interface Resource {
  id: number
  title: string
  body: string
  userId: number
}

const client = {
  async createResource(resource: Resource): Promise<Resource> {
    const args = {
      method: 'POST',
      body: JSON.stringify(resource),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    }
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', args)
    return await response.json()
  }
}

export const UseMutationDemo: React.FC = () => {
  const mutation = useMutation<Resource>(client.createResource)

  return (
    <>
      <button
        onClick={(): void => {
          mutation.invoke({
            title: 'foo',
            body: 'bar',
            userId: 1
          })
        }}
      >
        Create Resource
      </button>
      <pre>{JSON.stringify(mutation.result.response)}</pre>
    </>
  )
}
