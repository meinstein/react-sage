import * as React from 'react'

interface Props {
  markdown?: React.ReactNode
  demo?: React.ReactNode
}

export const Page: React.FC<Props> = ({ markdown, demo }) => {
  return (
    <section style={{ padding: '1rem', maxWidth: '48rem', margin: '0px auto' }}>
      {markdown && <div className="markdown-body">{markdown}</div>}
      {demo && (
        <div style={{ lineHeight: 2 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>🚧 Sandbox 🚧</h1>
          <div style={{ border: '1px dashed gray', marginTop: '1rem', padding: '1rem', backgroundColor: '#f6f8fa' }}>
            <div>{demo}</div>
          </div>
        </div>
      )}
    </section>
  )
}
