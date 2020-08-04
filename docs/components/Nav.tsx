import * as React from 'react'
import { NavLink as Link, NavLinkProps } from 'react-router-dom'

export const NavLink: React.FC<NavLinkProps> = (props) => {
  return (
    <Link
      style={{ margin: '0.5rem', textDecoration: 'none' }}
      activeStyle={{ textDecoration: 'underline' }}
      {...props}
    />
  )
}

export const Nav: React.FC = (props) => {
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
      {...props}
    />
  )
}
