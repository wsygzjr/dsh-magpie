/**
 * Host side of the magpie admin-page Remote.
 *
 * DSH's own packages use generated Typert artifacts. A plugin installed as a
 * plain npm link hands-writes the same descriptor shape: one Cordis service
 * with a visible `typertRemote` binding plus a contribution registered with
 * `ctx.typert.register()`. The Client half mounts the matching descriptors and
 * calls `magpie.status()/list()/addProvider()/...`.
 *
 * This module intentionally imports no `@deepseek-ai/*` package. Every method
 * forwards to the shared service layer (`src/service.js`), returning the
 * service's `{ ok, data?, reason?, text? }` result unchanged — the browser UI
 * renders `data` for structured payloads and surfaces `reason` on failure.
 */

const PACKAGE = 'dsh-magpie'
const SERVICE = 'magpieRemote'
const NAMESPACE = 'magpie'

function parseObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('magpie remote result must be an object')
  }
  return value
}

function parseString(value) {
  if (typeof value !== 'string') throw new TypeError('magpie argument must be a string')
  return value
}

function codec(typeName, parse) {
  return {
    mode: 'strict',
    typeSymbol: `${PACKAGE}#${typeName}`,
    create: () => ({ parse }),
  }
}

const snapshotCodec = codec('UiSnapshot', parseObject)
const stringCodec = codec('String', parseString)

function descriptor(method, parameters, result) {
  return {
    id: `${PACKAGE}#${NAMESPACE}/${method}`,
    service: SERVICE,
    namespace: NAMESPACE,
    method,
    invocation: { kind: 'direct' },
    parameters,
    result,
  }
}

/** The exact descriptor list shared by the Host registry and Client mount. */
export const MAGPIE_REMOTE_DESCRIPTORS = Object.freeze([
  descriptor('status', [], snapshotCodec),
  descriptor('list', [], snapshotCodec),
  descriptor('presets', [], snapshotCodec),
  descriptor(
    'models',
    [{ name: 'agent', wire: 'agent', source: 'json', codec: stringCodec }],
    snapshotCodec,
  ),
  descriptor(
    'addProvider',
    [{ name: 'args', wire: 'args', source: 'json', codec: snapshotCodec }],
    snapshotCodec,
  ),
  descriptor(
    'removeProvider',
    [{ name: 'id', wire: 'id', source: 'json', codec: stringCodec }],
    snapshotCodec,
  ),
  descriptor(
    'testProvider',
    [{ name: 'args', wire: 'args', source: 'json', codec: snapshotCodec }],
    snapshotCodec,
  ),
  descriptor('ping', [], snapshotCodec),
  descriptor('serverStatus', [], snapshotCodec),
  descriptor('serverStart', [], snapshotCodec),
  descriptor(
    'serverStop',
    [{ name: 'args', wire: 'args', source: 'json', codec: snapshotCodec }],
    snapshotCodec,
  ),
  descriptor('serverRestart', [], snapshotCodec),
])

/** Host registry contribution: invocations + the package-face declaration. */
export const MAGPIE_HOST_CONTRIBUTION = Object.freeze({
  package: PACKAGE,
  face: 'host',
  schemas: [],
  model: {
    services: [],
    events: [],
    objects: [],
  },
  invocations: MAGPIE_REMOTE_DESCRIPTORS,
})

/** Client mount contribution: the same endpoints in `descriptors` form. */
export const MAGPIE_CLIENT_CONTRIBUTION = Object.freeze({
  package: PACKAGE,
  descriptors: MAGPIE_REMOTE_DESCRIPTORS,
})

/**
 * Register the service + descriptors when the Host has a Typert registry.
 * Profiles without the web stack simply never activate this half.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {{ status: Function, list: Function, presets: Function, models: Function, addProvider: Function, removeProvider: Function, testProvider: Function, ping: Function }} service the shared service layer
 */
export function registerMagpieRemote(ctx, service) {
  if (typeof ctx.inject !== 'function') return
  ctx.inject(['typert'], (remoteCtx) => {
    const remote = {
      typertRemote: undefined,
      status: () => service.status(),
      list: () => service.list(),
      presets: () => service.presets(),
      models: (agent) => service.models({ agent }),
      addProvider: (args) => service.addProvider(args ?? {}),
      removeProvider: (id) => service.removeProvider({ id }),
      testProvider: (args) => service.testProvider(args ?? {}),
      ping: () => service.ping(),
      serverStatus: () => service.serverStatus(),
      serverStart: () => service.serverStart(),
      serverStop: (args) => service.serverStop(args ?? {}),
      serverRestart: () => service.serverRestart(),
    }
    remote.typertRemote = Object.freeze({
      service: remote,
      serviceKey: SERVICE,
      namespace: NAMESPACE,
    })

    const disposeService = remoteCtx.provide(SERVICE, remote)
    const unregister = remoteCtx.typert.register(MAGPIE_HOST_CONTRIBUTION)
    remoteCtx.effect(
      () => () => {
        try {
          unregister()
        } finally {
          void disposeService()
        }
      },
      'magpie: admin remote',
    )
  })
}