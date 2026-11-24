#!/usr/bin/env node
/**
 * Build the browser half only. The Host half is plain ESM and runs from src/.
 *
 * The DSH client module protocol is a CJS factory envelope:
 *   window.__ModuleLoader__.load({ id, factory(require) { ... } })
 * React stays external because the shell's frozen platform table supplies the
 * one React instance; bundling a second copy would break hooks.
 */

import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'

const PKG = 'dsh-magpie'

mkdirSync('lib', { recursive: true })

await build({
  entryPoints: ['src/client/index.jsx'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  // es2019 lowers class fields, optional chaining and nullish coalescing so the
  // bundle parses on any client engine. Native class fields in the output made
  // the whole bundle fail to parse (silently, no registration) on the DSH client.
  target: 'es2019',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
  banner: {
    js: [
      `window.__ModuleLoader__.load({`,
      `\tid: ${JSON.stringify(PKG)},`,
      `\tfactory: (require) => {`,
      `\t\tvar module = { exports: {} };`,
      `\t\tvar exports = module.exports;`,
    ].join('\n'),
  },
  footer: {
    js: ['\t\treturn module.exports;', '\t},', '});'].join('\n'),
  },
  sourcemap: true,
  logLevel: 'info',
})