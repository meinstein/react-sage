import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { UseFormDemo } from '../src/useForm/demo'
import { UseQueryDemo } from '../src/useQuery/demo'
import { UseMutationDemo } from '../src/useMutation/demo'
import { UseFilePickerDemo } from '../src/useFilePicker/demo'
import { UseBatchMutationDemo } from '../src/useBatchMutation/demo'
import { UsePersistedStateDemo } from '../src/usePersistedState/demo'
import { UseBatchQueryDemo } from '../src/UseBatchQuery/demo'

interface ContainerProps {
  title: string
}

const Container: React.FC<ContainerProps> = ({ title, children }) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}

ReactDOM.render(
  <>
    <Container title="useForm">
      <UseFormDemo />
    </Container>
    <Container title="usePersistedState">
      <UsePersistedStateDemo />
    </Container>
    <Container title="useQuery">
      <UseQueryDemo />
    </Container>
    <Container title="useBatchQuery">
      <UseBatchQueryDemo />
    </Container>
    <Container title="useMutation">
      <UseMutationDemo />
    </Container>
    <Container title="useBatchMutation">
      <UseBatchMutationDemo />
    </Container>
    <Container title="useFilePicker">
      <UseFilePickerDemo />
    </Container>
  </>,
  document.getElementById('root')
)
