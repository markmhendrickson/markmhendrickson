import React from 'react'
import { renderToString } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'

export function render(url: string): string {
  return renderToString(
    <HelmetProvider>
      <App url={url} />
    </HelmetProvider>
  )
}
