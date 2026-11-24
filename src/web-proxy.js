/**
 * Loopback web host for Magpie's own UI, bundled inside the plugin.
 *
 * Why: the DSH desktop client runs on an `app://` origin, so an <iframe> to
 * http://127.0.0.1:3430 is a third-party context and Magpie's sign-in cookie is
 * dropped. This server therefore:
 *
 *   1. serves the UI assets mirrored into `webui/` (statically, same origin),
 *   2. falls back to 127.0.0.1:3430 for anything not bundled (e.g. the dynamic
 *      `boot.js`, `/api/...` calls, and icons we did not mirror), injecting the
 *      `magpie_web_3430` cookie server-side.
 *
 * The embedded page's `fetch("/api/...")` is same-origin with this server, so it
 * works without any browser cookie.
 */

import http from 'node:http';
import { createReadStream } from 'node:fs';
import { statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const DEFAULTS = {
	host: '127.0.0.1',
	port: 3450,
	cookieName: 'magpie_web_3430',
	webKey: 'magpie-local-2026',
	upstreamHost: '127.0.0.1',
	upstreamPort: 3430,
	staticRoot: '',
};

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.txt': 'text/plain; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
};

/**
 * @param {object} [opts]
 * @param {number} [opts.port]
 * @param {string} [opts.webKey]
 * @param {string} [opts.staticRoot] absolute path to the bundled `webui/` dir
 * @param {string} [opts.upstreamHost]
 * @param {number} [opts.upstreamPort]
 */
export function createWebProxy(opts = {}) {
	const cfg = { ...DEFAULTS, ...opts };
	const cookie = `${cfg.cookieName}=${encodeURIComponent(cfg.webKey)}`;
	const url = `http://${cfg.host}:${cfg.port}/`;
	const root = cfg.staticRoot ? resolve(cfg.staticRoot) : '';

	let server = null;
	let listening = false;
	let lastError = '';

	/** Serve a bundled file when it exists; returns true when handled. */
	function tryStatic(pathname, res, method) {
		if (!root) return false;
		let decoded;
		try {
			decoded = decodeURIComponent(pathname);
		} catch {
			decoded = pathname;
		}
		if (decoded === '/' || decoded === '') decoded = '/index.html';
		// Never serve the dynamic boot config from disk, and never shadow the API.
		if (decoded === '/boot.js') return false;
		if (decoded === '/api' || decoded.startsWith('/api/')) return false;
		if (decoded.includes('\0')) return false;

		const target = normalize(join(root, decoded));
		if (target !== root && !target.startsWith(root + sep)) return false;

		let st;
		try {
			st = statSync(target);
		} catch {
			return false;
		}
		if (!st.isFile()) return false;

		const type = MIME[extname(target).toLowerCase()] || 'application/octet-stream';
		res.writeHead(200, {
			'content-type': type,
			'content-length': st.size,
			'cache-control': decoded === '/index.html' ? 'no-store' : 'no-cache',
		});
		if (method === 'HEAD') {
			res.end();
			return true;
		}
		createReadStream(target)
			.on('error', () => {
				try {
					res.destroy();
				} catch {
					/* ignore */
				}
			})
			.pipe(res);
		return true;
	}

	function proxyToUpstream(req, res) {
		const headers = { ...req.headers };
		headers.host = `${cfg.upstreamHost}:${cfg.upstreamPort}`;
		headers.cookie = cookie;
		delete headers.origin;
		delete headers.referer;

		const upstream = http.request(
			{
				host: cfg.upstreamHost,
				port: cfg.upstreamPort,
				path: req.url,
				method: req.method,
				headers,
			},
			(upRes) => {
				try {
					res.writeHead(upRes.statusCode || 502, upRes.headers);
				} catch {
					/* client gone */
				}
				upRes.pipe(res);
			},
		);
		upstream.on('error', (err) => {
			lastError = String((err && err.message) || err);
			try {
				res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
				res.end(`magpie 代理无法连接上游 ${cfg.upstreamHost}:${cfg.upstreamPort}\n${lastError}`);
			} catch {
				/* ignore */
			}
		});
		req.pipe(upstream);
	}

	function onRequest(req, res) {
		const method = req.method || 'GET';
		let pathname = '/';
		try {
			pathname = new URL(req.url || '/', 'http://localhost').pathname;
		} catch {
			pathname = '/';
		}
		if ((method === 'GET' || method === 'HEAD') && tryStatic(pathname, res, method)) return;
		proxyToUpstream(req, res);
	}

	function start() {
		if (server) return Promise.resolve(true);
		return new Promise((resolvePromise) => {
			const s = http.createServer(onRequest);
			s.on('error', (err) => {
				lastError = String((err && err.message) || err);
				server = null;
				listening = false;
				resolvePromise(false);
			});
			s.listen(cfg.port, cfg.host, () => {
				server = s;
				listening = true;
				resolvePromise(true);
			});
		});
	}

	function stop() {
		return new Promise((resolvePromise) => {
			const s = server;
			server = null;
			listening = false;
			if (!s) return resolvePromise();
			try {
				s.close(() => resolvePromise());
			} catch {
				resolvePromise();
			}
		});
	}

	function status() {
		return {
			listening,
			url,
			port: cfg.port,
			staticRoot: root || null,
			upstream: `http://${cfg.upstreamHost}:${cfg.upstreamPort}`,
			lastError: lastError || null,
		};
	}

	return { start, stop, status, url };
}
