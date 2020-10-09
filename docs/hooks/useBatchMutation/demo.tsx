import * as React from 'react'

import { useBatchMutation } from '../../../src/useBatchMutation'
import { client } from '../useMutation/demo'

export const UseBatchMutationDemo: React.FC = () => {
  const [onSuccessMsg, setOnSuccessMsg] = React.useState('')
  const mutation = useBatchMutation(client.createResource, (data) => {
    console.log('[useBatchMutation] onSuccess callback:', data)
    setOnSuccessMsg(`useBatchMutation successful: ${JSON.stringify(data)}`)
  })

  return (
    <>
      <button
        onClick={(): void => {
          mutation.invoke([
            {
              title: 'foo 1',
              body: 'bar 2',
              userId: 1
            },
            {
              title: 'foo 2',
              body: 'bar 2',
              userId: 2
            }
          ])
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
