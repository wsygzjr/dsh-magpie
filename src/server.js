/**
 * Magpie service supervisor (Host half).
 *
 * This is the piece that *starts* Magpie rather than merely probing it. It
 * spawns `magpie serve --web` — the headless service that runs the LLM gateway
 * on 127.0.0.1:3425 and Magpie's own web UI on 127.0.0.1:3430 — tracks the
 * child process, waits for the gateway to answer, and can stop/restart it.
 *
 * Detection: `status()` probes the gateway over HTTP. If the gateway answers
 * but we did not spawn it, it is reported as `external` (someone else started
 * it, e.g. the tray app or start_magpie_Web.cmd). `start()` never fights an
 * already-running instance: if the gateway is healthy it simply reports
 * `alreadyRunning`.
 *
 * Testability: `spawnImpl` and `probeImpl` are injectable so the state machine
 * can be exercised without launching/killing the real gateway (which, in DSH's
 * own setup, may be the very process serving the agent's model calls).
 */

import { spawn as nodeSpawn } from 'node:child_process';
import http from 'node:http';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** HTTP GET / on the gateway. Any non-5xx answer means the gateway is listening. */
function httpProbe({ host = '127.0.0.1', port = 3425, path = '/', timeoutMs = 1500 } = {}) {
	return new Promise((resolve) => {
		const req = http.request({ host, port, path, method: 'GET', timeout: timeoutMs }, (res) => {
			const code = res.statusCode || 0;
			res.resume();
			res.on('end', () => resolve({ ok: code > 0 && code < 500, statusCode: code }));
			res.on('error', () => resolve({ ok: code > 0 && code < 500, statusCode: code }));
		});
		req.on('timeout', () => {
			req.destroy();
			resolve({ ok: false, detail: 'timeout' });
		});
		req.on('error', (err) => resolve({ ok: false, detail: String(err.code || err.message || err) }));
		req.end();
	});
}

/**
 * @param {object} opts
 * @param {string} opts.exe            absolute path to the magpie executable
 * @param {string} [opts.cwd]          working directory (holds the .portable marker)
 * @param {string} [opts.gatewayHost]  default 127.0.0.1
 * @param {number} [opts.gatewayPort]  default 3425
 * @param {string} [opts.webHost]      default 127.0.0.1
 * @param {number} [opts.webPort]      default 3430
 * @param {string} [opts.webKey]       MAGPIE_WEB_KEY so the web URL is stable
 * @param {number} [opts.startupTimeoutMs] default 20000
 * @param {Function} [opts.spawnImpl]  injectable child_process.spawn
 * @param {Function} [opts.probeImpl]  injectable gateway probe -> { ok, statusCode?, detail? }
 * @param {Function} [opts.killByImageImpl] injectable force-stop by image name
 */
export function createMagpieServer(opts = {}) {
	const {
		exe,
		cwd,
		gatewayHost = '127.0.0.1',
		gatewayPort = 3425,
		webHost = '127.0.0.1',
		webPort = 3430,
		webKey = 'magpie-local-2026',
		startupTimeoutMs = 20000,
		spawnImpl = nodeSpawn,
		probeImpl = httpProbe,
		killByImageImpl,
	} = opts;

	let child = null;
	let startedAt = null;
	let lastError = '';

	const gatewayUrl = `http://${gatewayHost}:${gatewayPort}`;
	const webUrl = `http://${webHost}:${webPort}/?k=${encodeURIComponent(webKey)}`;

	function probe() {
		return probeImpl({ host: gatewayHost, port: gatewayPort });
	}

	function isManaged() {
		return !!(child && child.pid && !child.killed);
	}

	async function status() {
		let healthy = false;
		let detail = '';
		try {
			const p = await probe();
			healthy = !!p.ok;
			detail = p.detail || (p.statusCode ? `HTTP ${p.statusCode}` : '');
		} catch (err) {
			detail = String((err && err.message) || err);
		}
		const managed = isManaged();
		return {
			healthy,
			managed,
			running: managed || healthy,
			external: healthy && !managed,
			pid: managed ? child.pid : null,
			since: startedAt || null,
			gateway: gatewayUrl,
			web: webUrl,
			gatewayHost,
			gatewayPort,
			webHost,
			webPort,
			detail,
			lastError: lastError || null,
		};
	}

	async function waitHealthy(timeoutMs) {
		const deadline = Date.now() + timeoutMs;
		while (Date.now() < deadline) {
			const p = await probe().catch(() => ({ ok: false }));
			if (p.ok) return { ok: true };
			await sleep(400);
		}
		return { ok: false, reason: `等待网关 ${gatewayUrl} 就绪超时（${Math.round(timeoutMs / 1000)}s）` };
	}

	async function waitDown(timeoutMs) {
		const deadline = Date.now() + timeoutMs;
		while (Date.now() < deadline) {
			const p = await probe().catch(() => ({ ok: false }));
			if (!p.ok) return true;
			await sleep(400);
		}
		return false;
	}

	async function start() {
		const before = await status();
		if (before.healthy) {
			return { ok: true, alreadyRunning: true, started: false, data: before };
		}

		const args = ['serve', `--web=${webHost}:${webPort}`];
		const env = {
			...process.env,
			MAGPIE_WEB_KEY: webKey,
			NO_PROXY: 'localhost,127.0.0.1',
			HTTP_PROXY: '',
			HTTPS_PROXY: '',
			ALL_PROXY: '',
		};

		let spawned;
		try {
			spawned = spawnImpl(exe, args, {
				cwd,
				detached: true,
				windowsHide: true,
				stdio: 'ignore',
				env,
			});
		} catch (err) {
			lastError = String((err && err.message) || err);
			return { ok: false, reason: lastError, data: await status() };
		}

		child = spawned;
		startedAt = Date.now();
		lastError = '';

		if (typeof spawned.once === 'function') {
			spawned.once('exit', (code, signal) => {
				if (child !== spawned) return;
				child = null;
				startedAt = null;
				lastError = `magpie serve 退出（code ${code}${signal ? `, ${signal}` : ''}）`;
			});
			spawned.once('error', (err) => {
				if (child !== spawned) return;
				child = null;
				startedAt = null;
				lastError = String((err && err.message) || err);
			});
		}
		try {
			spawned.unref?.();
		} catch {
			/* non-fatal */
		}

		const ready = await waitHealthy(startupTimeoutMs);
		const after = await status();
		if (!ready.ok || !after.healthy) {
			return { ok: false, reason: ready.reason || lastError || '服务未能就绪', data: after };
		}
		return { ok: true, started: true, alreadyRunning: false, data: after };
	}

	async function stop({ force = false } = {}) {
		if (isManaged()) {
			const pid = child.pid;
			try {
				child.kill('SIGTERM');
			} catch {
				/* already gone */
			}
			let down = await waitDown(6000);
			if (!down) {
				try {
					child.kill('SIGKILL');
				} catch {
					/* already gone */
				}
				down = await waitDown(3000);
			}
			if (down && child && child.pid === pid) {
				child = null;
				startedAt = null;
			}
			const after = await status();
			return { ok: after.healthy === false, stopped: after.healthy === false, managed: true, pid, data: after };
		}

		const s = await status();
		if (!s.healthy) {
			return { ok: true, stopped: true, managed: false, data: s };
		}

		// Healthy but not spawned here: an external instance. Only a forced stop
		// touches it (mirrors stop_magpie.cmd). Default path reports it instead.
		if (!force) {
			return {
				ok: false,
				stopped: false,
				managed: false,
				external: true,
				reason: '服务由外部启动，未由本插件托管；如需强制停止请使用强制停止。',
				data: s,
			};
		}

		if (killByImageImpl) {
			await killByImageImpl();
		} else if (process.platform === 'win32') {
			await new Promise((resolve) => {
				try {
					const k = spawnImpl('taskkill', ['/IM', 'magpie-windows-amd64.exe', '/F'], {
						windowsHide: true,
						stdio: 'ignore',
					});
					k?.once?.('exit', () => resolve());
					k?.once?.('error', () => resolve());
					setTimeout(resolve, 5000);
				} catch {
					resolve();
				}
			});
		}
		const down = await waitDown(6000);
		const after = await status();
		return { ok: down, stopped: !after.healthy, managed: false, external: true, data: after };
	}

	async function restart() {
		const before = await status();
		if (before.external) {
			const stopped = await stop({ force: true });
			if (!stopped.stopped) {
				return { ok: false, reason: '无法停止外部运行的服务', data: await status() };
			}
		} else if (before.managed) {
			const stopped = await stop();
			if (!stopped.stopped) {
				return { ok: false, reason: '无法停止托管中的服务', data: await status() };
			}
		}
		return start();
	}

	return { status, start, stop, restart, gatewayUrl, webUrl };
}
