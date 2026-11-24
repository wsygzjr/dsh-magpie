/**
 * Host service layer for dsh-magpie.
 *
 * Every operation is implemented here ONCE, as an async method that wraps the
 * underlying magpie CLI gateway (`lib/magpie.js`). Both consumer surfaces —
 * the chat agent tools (`index.js`) and the settings Remote (`src/remote.js`)
 * — call these same methods with the same arguments and meaning, so one action
 * has exactly one implementation (per user-actions.md).
 *
 * Return convention: every method resolves to `{ ok, data?, reason?, text? }`.
 *  - `ok: true`  → `data` carries structured, parseable payloads that the UI
 *                  renders; `text` carries the same for the chat tool.
 *  - `ok: false` → `reason` is a human-readable failure message surfaced by
 *                  both the UI (error banner) and the tool (tool result).
 *
 * The magpie CLI has no JSON output for `providers`/`presets`/`models`, so the
 * structured `data` here is produced by parsing CLI text (see the parsers at
 * the bottom). This module imports no `@deepseek-ai/*` package.
 */

/**
 * Build the service that wraps one magpie gateway.
 * @param {ReturnType<import('./lib/magpie.js').createMagpie>} m a magpie CLI handle
 * @param {object} [opts]
 * @param {string} [opts.banner] override text prepended to `status` (tests).
 * @param {object} [opts.server] magpie service supervisor (src/server.js)
 */
export function createMagpieService(m, { banner, server } = {}) {
  const healthMessage = (healthy, healthText) => {
    if (typeof banner === 'string' && banner) return banner
    const head = healthy
      ? '[gateway] magpie is UP (healthcheck exited 0).'
      : '[gateway] magpie did not answer healthcheck.'
    return `${head}\n${(healthText || '').trim()}`.trim()
  }

  /** Full status snapshot: gateway health + parsed providers table. */
  async function status() {
    let healthy = false
    let healthText = ''
    try {
      const h = await m.status()
      healthy = !!h.ok
      healthText = h.text
    } catch (err) {
      healthText = err instanceof Error ? err.message : String(err)
    }

    let provRes
    try {
      provRes = await m.list()
    } catch (err) {
      provRes = { ok: false, code: -1, text: err instanceof Error ? err.message : String(err) }
    }

    const providers = provRes.ok ? parseProviders(provRes.text) : []
    const providerError = provRes.ok ? null : provRes.text

    /** Local magpie-service (process) state, when a supervisor is attached. */
    let serverInfo = null
    if (server) {
      try {
        serverInfo = await server.status()
      } catch (err) {
        serverInfo = { error: err instanceof Error ? err.message : String(err) }
      }
    }

    return {
      ok: true,
      data: {
        healthy,
        healthText: healthText.trim(),
        providers,
        providerCount: providers.length,
        providerError,
        server: serverInfo,
        at: Date.now(),
      },
      text: statusText(healthy, healthText, provRes, serverInfo),
    }
  }

  /** Structured provider directory (gateway gate, no parse needed on failure). */
  async function list() {
    let res
    try {
      res = await m.list()
    } catch (err) {
      return { ok: false, reason: failReason(err) }
    }
    if (!res.ok) return { ok: false, reason: dumpResult(res), code: res.code }
    return { ok: true, data: parseProviders(res.text), text: res.text }
  }

  /** Known presets, grouped like the CLI prints them. */
  async function presets() {
    let res
    try {
      res = await m.presets()
    } catch (err) {
      return { ok: false, reason: failReason(err) }
    }
    if (!res.ok) return { ok: false, reason: dumpResult(res), code: res.code }
    return { ok: true, data: parsePresets(res.text), text: res.text }
  }

  /** Add a provider. preset form: addProvider(preset, key); custom: split kv. */
  async function addProvider({ form, preset, key, name, kv }) {
    if (form !== 'preset' && form !== 'custom') {
      return { ok: false, reason: 'form 必须是 "preset" 或 "custom"。' }
    }
    let res
    try {
      if (form === 'preset') {
        const p = (preset || '').trim()
        const k = (key || '').trim()
        if (!p) return { ok: false, reason: 'form=preset 需要 preset 名称。' }
        if (!k) return { ok: false, reason: 'form=preset 需要 API key。' }
        res = await m.addProvider(p, k)
      } else {
        const n = (name || '').trim()
        if (!n) return { ok: false, reason: 'form=custom 需要 provider 名称。' }
        const kvArr = (kv || '').trim().split(/\s+/).filter(Boolean)
        if (kvArr.length === 0) return { ok: false, reason: 'form=custom 需要至少一个 k=v 字段。' }
        res = await m.addProvider(n, kvArr)
      }
    } catch (err) {
      return { ok: false, reason: failReason(err) }
    }
    if (!res.ok) return { ok: false, reason: dumpResult(res), code: res.code }
    return { ok: true, data: { text: res.text }, text: res.text }
  }

  /** Remove a provider by id. */
  async function removeProvider({ id }) {
    const providerId = (id || '').trim()
    if (!providerId) return { ok: false, reason: '需要 provider id。' }
    let res
    try {
      res = await m.removeProvider(providerId)
    } catch (err) {
      return { ok: false, reason: failReason(err) }
    }
    if (!res.ok) return { ok: false, reason: dumpResult(res), code: res.code }
    return { ok: true, data: { text: res.text }, text: res.text }
  }

  /** Test a provider. Returns structured probe when CLI reports success. */
  async function testProvider({ id, model, as }) {
    const providerId = (id || '').trim()
    if (!providerId) return { ok: false, reason: '需要 provider id。' }
    let res
    try {
      res = await m.testProvider(providerId, {
        model: (model || '').trim() || undefined,
        as: as || undefined,
      })
    } catch (err) {
      return { ok: false, reason: failReason(err) }
    }
    if (!res.ok) return { ok: false, reason: dumpResult(res), code: res.code }
    return { ok: true, data: { text: res.text }, text: res.text }
  }

  /** List models magpie can route to (all or for one agent). */
  async function models({ agent } = {}) {
    let res
    try {
      res = await m.models(agent || undefined)
    } catch (err) {
      return { ok: false, reason: failReason(err) }
    }
    if (!res.ok) return { ok: false, reason: dumpResult(res), code: res.code }
    return { ok: true, data: parseModels(res.text), text: res.text }
  }

  /** Whether the underlying magpie CLI is present/answering (cheap probe). */
  async function ping() {
    const s = await m.status()
    return { ok: !!s.ok, healthy: !!s.ok, reason: s.ok ? undefined : dumpResult(s) }
  }

  /* ---- Local magpie service (process lifecycle) -------------------------- */

  /** Star/stop/restart require an attached supervisor. */
  function noServer() {
    return { ok: false, reason: '未启用本地 magpie 服务管理（缺少 supervisor）。' }
  }

  /** Process + gateway state of the local magpie service. */
  async function serverStatus() {
    if (!server) return noServer()
    try {
      const st = await server.status()
      return { ok: true, data: st, text: serverText(st) }
    } catch (err) {
      return { ok: false, reason: failReason(err) }
    }
  }

  /** Start the local magpie service (magpie serve --web). No-op if healthy. */
  async function serverStart() {
    if (!server) return noServer()
    try {
      const res = await server.start()
      const st = res.data ?? (await server.status())
      if (!res.ok) return { ok: false, reason: res.reason || '启动失败', data: st }
      return { ok: true, data: st, text: serverActionText(res.started ? '已启动' : '已在运行', st) }
    } catch (err) {
      return { ok: false, reason: failReason(err) }
    }
  }

  /** Stop the local magpie service. `force` also stops an externally-started one. */
  async function serverStop({ force } = {}) {
    if (!server) return noServer()
    try {
      const res = await server.stop({ force: !!force })
      const st = res.data ?? (await server.status())
      if (!res.ok) return { ok: false, reason: res.reason || '停止失败', data: st }
      return { ok: true, data: st, text: serverActionText('已停止', st) }
    } catch (err) {
      return { ok: false, reason: failReason(err) }
    }
  }

  /** Restart the local magpie service. */
  async function serverRestart() {
    if (!server) return noServer()
    try {
      const res = await server.restart()
      const st = res.data ?? (await server.status())
      if (!res.ok) return { ok: false, reason: res.reason || '重启失败', data: st }
      return { ok: true, data: st, text: serverActionText('已重启', st) }
    } catch (err) {
      return { ok: false, reason: failReason(err) }
    }
  }

  return {
    status,
    list,
    presets,
    addProvider,
    removeProvider,
    testProvider,
    models,
    ping,
    serverStatus,
    serverStart,
    serverStop,
    serverRestart,
  }
}

/* ------------------------------------------------------------------------- *
 * Parsers (magpie prints human-readable CLI text; we extract structure).
 * ------------------------------------------------------------------------- */

/**
 * Parse `magpie providers` table output.
 *
 * Rows look like:
 *   `  OpenCode Zen    opencode-zen    opencode.ai    ● ••••••   1 of 85 models · fetched Nov 11`
 *   `  Trae CN         trae-cn         trae-cn        ● signed in as 用户6108167786   1 of 94 models · fetched 8m ago   ← DeepSeek Harness`
 * There is no real column-header row we can rely on, so we split on runs of
 * whitespace. Leading 2-space indentation is fine — our split drops it.
 */
export function parseProviders(text) {
  if (!text || typeof text !== 'string') return []
  const providers = []
  const lines = text.split('\n')
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || /^providers\s*$/i.test(line)) continue
    // A row line: starts with a display name and contains the "of N models"
    // model-count marker. Anything else (blank, headers, instructions) is skipped.
    if (!/\bmodels\b/.test(line)) continue

    const parts = line.split(/\s{2,}|\t+/).map((s) => s.trim()).filter(Boolean)
    if (parts.length < 4) continue

    // Optional trailing attribution like "← DeepSeek Harness".
    let attribution = ''
    let rowForParse = line
    const arrowParts = line.split('←')
    if (arrowParts.length > 1) {
      attribution = arrowParts.pop().trim()
      rowForParse = arrowParts.join('←').trim()
    }

    const rowParts = rowForParse.split(/\s{2,}|\t+/).map((s) => s.trim()).filter(Boolean)
    const name = rowParts[0]
    const id = rowParts[1]
    const host = rowParts[2] || ''
    const tail = rowParts.slice(3).join(' ') || ''

    // authInfo: everything up to the "N of M models" segment.
    const modelMatch = tail.match(/^(.*?)\s*(\d+)\s+of\s+(\d+)\s+models\s*[·•]?\s*fetched\s+(.*)$/)
    let auth = tail
    let modelsCount = null
    let totalModels = null
    let fetched = ''
    if (modelMatch) {
      auth = (modelMatch[1] || '').trim()
      modelsCount = Number.parseInt(modelMatch[2], 10)
      totalModels = Number.parseInt(modelMatch[3], 10)
      fetched = (modelMatch[4] || '').trim()
      // leftover attribution may live after fetched in the non-arrow case
      const at = fetched.split('←')[0].trim()
      fetched = at
    }

    let authState = 'key'
    let authDetail = auth.replace(/^●\s*/, '').trim()
    if (/no key needed/i.test(authDetail)) authState = 'none'
    else if (/signed in as/i.test(authDetail)) authState = 'signedin'
    else if (/••••••|•{3,}/.test(authDetail)) authState = 'masked'
    else if (/api key/i.test(authDetail)) authState = 'key'

    providers.push({
      name,
      id,
      host,
      authState,
      authDetail,
      modelsCount,
      totalModels,
      fetched,
      attribution,
    })
  }
  return providers
}

/**
 * Parse `magpie presets` output: grouped vendor columns.
 *
 * The CLI prints grouped blocks, e.g.
 *   `  Kimi Code             kimi            magpie provider add kimi <key>`
 * Group (heading) lines end with `:` and precede a run of `name id add-cmd`
 * rows. We treat any non-empty line that does not look like an add-cmd / page
 * footer as a group heading.
 */
export function parsePresets(text) {
  if (!text || typeof text !== 'string') return []
  const groups = []
  let current = null
  const lines = text.split('\n')
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    // add-cmd tail `magpie provider add <id> ...`
    if (/\bmagpie\s+provider\s+add\b/.test(line)) {
      const nameMatch = line.match(/^(.+?)\s{2,}([^\s]+)\s+.+magpie\s+provider\s+add\s+([^\s]+)(?:\s+(.*))?$/)
      const name = nameMatch ? nameMatch[1].trim() : line.replace(/\s*magpie\s+provider\s+add.*/, '').trim()
      const id = nameMatch ? nameMatch[2] : ''
      const addId = nameMatch ? nameMatch[3] : ''
      const params = nameMatch ? (nameMatch[4] || '').trim() : ''
      if (!current) current = { name: 'Vendors', items: [] }
      current.items.push({ name, id, addCommand: `magpie provider add ${addId}${params ? ' ' + params : ''}`, params })
      continue
    }
    // Heuristic group heading: ends with a colon and is not an add-cmd.
    if (/:\s*$/.test(line) && !/\smagpie\s+provider\s+add/.test(line)) {
      current = { name: line.replace(/:+$/, '').trim(), items: [] }
      groups.push(current)
      continue
    }
    // Any other line without a pushable tail is ignored (headings/footers).
  }
  // If the CLI never printed group headings, ensure a default bucket exists.
  if (groups.length === 0 && (current ? current.items.length : 0) > 0) {
    if (current && current.items.length) groups.push(current)
  }
  // Filter out empty groups.
  return groups.filter((g) => g.items.length > 0)
}

/**
 * Parse `magpie models` output.
 *
 * Structure (best-effort): a first "Routing groups" prose section, then
 * per-vendor sections whose heading lines end with `:`; under each heading the
 * rows look like `  auto/deepseek-v4.1-flash   DeepSeek V4.1 Flash   low/high/max`
 * (name  group/model · display · efforts-opt). Footer lines (e.g. `  N more
 * models in its list ...`) and the trailing gateway URL are discarded.
 */
export function parseModels(text) {
  if (!text || typeof text !== 'string') return []
  const sections = []
  let current = null
  const lines = text.split('\n')
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    // Skip the footer/instructions noise.
    if (/\bmodels? in its list\b/i.test(line)) continue
    if (/\bmagpie\s+provider\s+models\b/.test(line)) continue
    if (/^http:\/\/\S+$/.test(line)) continue

    // Vendor-section heading: ends with `:`, short-ish, not a model row.
    if (/:\s*$/.test(line) && !/\//.test(line)) {
      current = { name: line.replace(/:+$/, '').trim(), models: [] }
      sections.push(current)
      continue
    }
    // Model row: ` <group>/<model>  <Display>  [efforts]` (path contains a slash).
    const slash = line.indexOf('/')
    if (slash > 0) {
      // Full id = everything before the display column (2+ spaces).
      const displayMatch = line.split(/\s{2,}/)
      const full = displayMatch[0]
      const display = displayMatch[1] ? displayMatch[1].trim() : ''
      const efforts = displayMatch[2]
        ? displayMatch[2].split('/').map((s) => s.trim()).filter(Boolean)
        : []
      if (!full) continue
      if (!current) {
        current = { name: 'Models', models: [] }
        sections.push(current)
      }
      current.models.push({ id: full.trim(), display, efforts })
      continue
    }
    // Anything else: ignore (intro prose, routing hints).
  }
  return dedupeSections(sections)
}

function dedupeSections(sections) {
  const seen = new Map()
  for (const s of sections) {
    if (!s || s.models.length === 0) continue
    const key = s.name
    if (seen.has(key)) seen.get(key).models.push(...s.models)
    else seen.set(key, { name: s.name, models: [...s.models] })
  }
  return [...seen.values()]
}

function statusText(healthy, healthText, provRes, serverInfo) {
  const head = healthy
    ? '[gateway] magpie is UP (healthcheck exited 0).'
    : '[gateway] magpie did not answer healthcheck.'
  const svc = serverInfo ? `\n[service] ${serverText(serverInfo)}` : ''
  return `${head}\n${(healthText || '').trim()}${svc}\n${(provRes.text || '').trim()}`.trim()
}

/** One concise line describing the local service process + gateway state. */
export function serverText(st) {
  if (!st || typeof st !== 'object') return '状态未知'
  if (st.error) return `读取失败：${st.error}`
  const state = st.healthy ? '运行中' : st.managed ? '已启动但未响应' : '已停止'
  const owner = st.external ? '（外部启动）' : st.managed ? `（本插件托管 pid ${st.pid}）` : ''
  return `${state}${owner} · 网关 ${st.gateway || ''}${st.web ? ` · Web ${st.web}` : ''}`
}

function serverActionText(action, st) {
  return `[service] ${action}：${serverText(st)}`
}

function dumpResult(res) {
  if (res.ok) return res.text || 'OK'
  return `magpie 以退出码 ${res.code || -1} 返回:\n${res.text || '(无输出)'}`
}

function failReason(err) {
  return err instanceof Error ? err.message : String(err)
}