import * as React from 'react'
import * as ReactDOM from 'react-dom'
import ReactMarkdown from 'react-markdown'
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import 'github-markdown-css'

import Readme from '../README.md'

import { Page } from './components/Page'
import { Nav, NavLink } from './components/Nav'

import UseFormDocs from './hooks/useForm/docs.md'
import { UseFormDemo } from './hooks/useForm/demo'

import UseBatchMutationDocs from './hooks/useBatchMutation/docs.md'
import { UseBatchMutationDemo } from './hooks/useBatchMutation/demo'

import UseBatchQueryDocs from './hooks/useBatchQuery/docs.md'
import { UseBatchQueryDemo } from './hooks/useBatchQuery/demo'

import UseFilePickerDocs from './hooks/useFilePicker/docs.md'
import { UseFilePickerDemo } from './hooks/useFilePicker/demo'

import UseMutationDocs from './hooks/useMutation/docs.md'
import { UseMutationDemo } from './hooks/useMutation/demo'

import UsePersistedStateDocs from './hooks/usePersistedState/docs.md'
import { UsePersistedStateDemo } from './hooks/usePersistedState/demo'

import UseQueryDocs from './hooks/useQuery/docs.md'
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
  return (
    <main
      style={{
        fontFamily:
          '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji'
      }}
    >
      <Router>
        <Nav>
          <NavLink to="/use-batch-mutation">useBatchMutation</NavLink>
          <span>|</span>
          <NavLink to="/use-batch-query">useBatchQuery</NavLink>
          <span>|</span>
          <NavLink to="/use-file-picker">useFilePicker</NavLink>
          <span>|</span>
          <NavLink to="/use-form">useForm</NavLink>
          <span>|</span>
          <NavLink to="/use-mutation">useMutation</NavLink>
          <span>|</span>
          <NavLink to="/use-persisted-state">usePersistedState</NavLink>
          <span>|</span>
          <NavLink to="/use-query">useQuery</NavLink>
        </Nav>
        <Switch>
          <Route exact path="/">
            <Page markdown={<ReactMarkdown source={Readme} escapeHtml={false} />} />
          </Route>
          <Route exact path="/use-batch-mutation">
            <Page
              markdown={<ReactMarkdown source={UseBatchMutationDocs} escapeHtml={false} />}
              demo={<UseBatchMutationDemo />}
            />
          </Route>
          <Route exact path="/use-batch-query">
            <Page
              markdown={<ReactMarkdown source={UseBatchQueryDocs} escapeHtml={false} />}
              demo={<UseBatchQueryDemo />}
            />
          </Route>
          <Route exact path="/use-file-picker">
            <Page
              markdown={<ReactMarkdown source={UseFilePickerDocs} escapeHtml={false} />}
              demo={<UseFilePickerDemo />}
            />
          </Route>
          <Route exact path="/use-form">
            <Page markdown={<ReactMarkdown source={UseFormDocs} escapeHtml={false} />} demo={<UseFormDemo />} />
          </Route>
          <Route exact path="/use-mutation">
            <Page markdown={<ReactMarkdown source={UseMutationDocs} escapeHtml={false} />} demo={<UseMutationDemo />} />
          </Route>
          <Route exact path="/use-persisted-state">
            <Page
              markdown={<ReactMarkdown source={UsePersistedStateDocs} escapeHtml={false} />}
              demo={<UsePersistedStateDemo />}
            />
          </Route>
          <Route exact path="/use-query">
            <Page markdown={<ReactMarkdown source={UseQueryDocs} escapeHtml={false} />} demo={<UseQueryDemo />} />
          </Route>
          <Redirect to="/" />
        </Switch>
      </Router>
    </main>
  )
}

ReactDOM.render(<Docs />, document.getElementById('root'))
