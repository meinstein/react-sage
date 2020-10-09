import * as React from 'react'

import { useMutation } from '../../../src/useMutation'

interface ResourceCreationParams {
  title: string
  body: string
  userId: number
}
interface Resource {
  id: number
}

export const client = {
  async createResource(params: ResourceCreationParams): Promise<Resource> {
    const args = {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    }
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', args)
    return await response.json()
  }
}

export const UseMutationDemo: React.FC = () => {
  const [onSuccessMsg, setOnSuccessMsg] = React.useState('')
  const mutation = useMutation(client.createResource, (data) => {
    console.log('[useMutation] onSuccess callback:', data)
    setOnSuccessMsg(`useMutation successful: ${JSON.stringify(data)}`)
  })

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
      {<pre>{mutation.result.loading ? 'Mutation loading...' : 'Mutation ready for action!'}</pre>}
      <pre>
        <b>On success callback:</b>
      </pre>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{onSuccessMsg}</pre>
    </>
  )
}
