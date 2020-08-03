import * as React from 'react'
import * as ReactDOM from 'react-dom'
import ReactMarkdown from 'react-markdown'
import 'github-markdown-css'

import { Page } from './components/Page'
import { Nav } from './components/Nav'

import UseFormDocs from './hooks/useForm/docs.md'
import { UseFormDemo } from './hooks/useForm/demo'

import { UseBatchMutationDemo } from './hooks/useBatchMutation/demo'
import { UseBatchQueryDemo } from './hooks/useBatchQuery/demo'
import { UseFilePickerDemo } from './hooks/useFilePicker/demo'
import { UseMutationDemo } from './hooks/useMutation/demo'
import { UsePersistedStateDemo } from './hooks/usePersistedState/demo'
import { UseQueryDemo } from './hooks/useQuery/demo'

export type Hook =
  | 'useBatchMutation'
  | 'useBatchQuery'
  | 'useFilePicker'
  | 'useForm'
  | 'useMutation'
  | 'usePersistedState'
  | 'useQuery'

const Docs: React.FC = () => {
  const [hook, setHook] = React.useState<Hook>('useForm')

  return (
    <div
      style={{
        fontFamily:
          '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji'
      }}
    >
      <Nav hook={hook} setHook={setHook} />
      <Page isActive={hook === 'useBatchMutation'} demo={<UseBatchMutationDemo />} />
      <Page isActive={hook === 'useBatchQuery'} demo={<UseBatchQueryDemo />} />
      <Page isActive={hook === 'useFilePicker'} demo={<UseFilePickerDemo />} />
      <Page
        isActive={hook === 'useForm'}
        markdown={<ReactMarkdown source={UseFormDocs} escapeHtml={false} />}
        demo={<UseFormDemo />}
      />
      <Page isActive={hook === 'useMutation'} demo={<UseMutationDemo />} />
      <Page isActive={hook === 'usePersistedState'} demo={<UsePersistedStateDemo />} />
      <Page isActive={hook === 'useQuery'} demo={<UseQueryDemo />} />
    </div>
  )
}

ReactDOM.render(<Docs />, document.getElementById('root'))
