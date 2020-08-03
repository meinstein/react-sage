import * as React from 'react'

import { Hook } from '..'

interface NavLinkProps {
  onClick(): void
  isActive: boolean
}

const NavLink: React.FC<NavLinkProps> = (props) => {
  return (
    <span
      onClick={props.onClick}
      style={{
        cursor: 'pointer',
        textDecoration: props.isActive ? 'underline' : 'none',
        color: 'blue',
        margin: '0.5rem 0.5rem 0.5rem 0.5rem'
      }}
    >
      {props.children}
    </span>
  )
}

interface NavProps {
  hook: Hook
  setHook(hook: Hook): void
}

export const Nav: React.FC<NavProps> = (props) => {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        maxWidth: '48rem',
        margin: '0px auto',
        padding: '1.5rem 1rem 0 1rem'
      }}
    >
      <NavLink onClick={() => props.setHook('useBatchMutation')} isActive={props.hook === 'useBatchMutation'}>
        useBatchMutation
      </NavLink>
      <span>|</span>
      <NavLink onClick={() => props.setHook('useBatchQuery')} isActive={props.hook === 'useBatchQuery'}>
        useBatchQuery
      </NavLink>
      <span>|</span>
      <NavLink onClick={() => props.setHook('useFilePicker')} isActive={props.hook === 'useFilePicker'}>
        useFilePicker
      </NavLink>
      <span>|</span>
      <NavLink onClick={() => props.setHook('useForm')} isActive={props.hook === 'useForm'}>
        useForm
      </NavLink>
      <span>|</span>
      <NavLink onClick={() => props.setHook('useMutation')} isActive={props.hook === 'useMutation'}>
        useMutation
      </NavLink>
      <span>|</span>
      <NavLink onClick={() => props.setHook('usePersistedState')} isActive={props.hook === 'usePersistedState'}>
        usePersistedState
      </NavLink>
      <span>|</span>
      <NavLink onClick={() => props.setHook('useQuery')} isActive={props.hook === 'useQuery'}>
        useQuery
      </NavLink>
    </nav>
  )
}
