import { spawn } from 'node:child_process';

/**
 * Safe wrapper around the magpie CLI. Every command resolves to a structured
 * result: { ok, code, ...raw, text } where `text` is the meaningful combined
 * output for the model.
 *
 * magpie prints its human output to stderr; we capture both streams, merge
 * them, and trim the leading Go runtime log line (e.g. "2026/11/16 16:56:21
 * plugin: ...").
 */

function run(exe, args, { timeoutMs = 30000, cwd } = {}) {
	return new Promise((resolve) => {
		const child = spawn(exe, args, {
			cwd,
			windowsHide: true,
			env: {
				...process.env,
				NO_PROXY: 'localhost,127.0.0.1',
				HTTP_PROXY: '',
				HTTPS_PROXY: '',
				ALL_PROXY: '',
			},
		});
		let stdout = '';
		let stderr = '';
		let killedByTimeout = false;
		const timer = setTimeout(() => {
			killedByTimeout = true;
			try {
				child.kill('SIGKILL');
			} catch {
				/* already gone */
			}
		}, timeoutMs);
		child.stdout.on('data', (d) => (stdout += d.toString()));
		child.stderr.on('data', (d) => (stderr += d.toString()));
		child.on('error', (err) => {
			clearTimeout(timer);
			resolve({ ok: false, code: -1, stdout, stderr, error: err });
		});
		child.on('close', (code) => {
			clearTimeout(timer);
			resolve({ ok: code === 0 && !killedByTimeout, code, stdout, stderr, killed: killedByTimeout });
		});
	});
}

function normalize(res) {
	const raw = [res.stdout, res.stderr].filter(Boolean).join('\n');
	const lines = raw
		.split('\n')
		.map((l) => l.trimEnd())
		.filter((l) => l.trim().length > 0)
		.filter((l) => !/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/.test(l.trim()));
	const text = lines.join('\n');
	return { ok: res.ok, code: res.code, text };
}

export function createMagpie(exe, cwd) {
	async function list() {
		return normalize(await run(exe, ['providers'], { cwd }));
	}

	async function status() {
		return normalize(await run(exe, ['healthcheck'], { timeoutMs: 10000, cwd }));
	}

	async function presets() {
		return normalize(await run(exe, ['presets'], { timeoutMs: 20000, cwd }));
	}

	async function addProvider(name, keyOrKv) {
		const args = ['provider', 'add', name];
		if (typeof keyOrKv === 'string') {
			args.push(keyOrKv);
		} else if (Array.isArray(keyOrKv)) {
			args.push(...keyOrKv);
		}
		return normalize(await run(exe, args, { timeoutMs: 60000, cwd }));
	}

	async function removeProvider(id) {
		return normalize(await run(exe, ['provider', 'rm', id], { cwd }));
	}

	async function testProvider(id, { model, as } = {}) {
		const args = ['provider', 'test', id];
		if (as) args.push('--as', as);
		if (model) args.push(model);
		return normalize(await run(exe, args, { timeoutMs: 120000, cwd }));
	}

	async function models(agent) {
		const args = ['models'];
		if (agent) args.push(agent);
		return normalize(await run(exe, args, { cwd }));
	}

	return { list, status, presets, addProvider, removeProvider, testProvider, models };
}