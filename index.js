import { fileURLToPath } from 'node:url';
import { createMagpie } from './lib/magpie.js';
import { createMagpieService } from './src/service.js';
import { createMagpieServer } from './src/server.js';
import { createWebProxy } from './src/web-proxy.js';
import { registerMagpieRemote } from './src/remote.js';

/** Cordis plugin name. */
const name = 'magpie';
/** Services required: the tool registry. No shell is provided; we spawn the CLI directly. */
const inject = ['tools'];

// Portable defaults: an explicit config.exe (see cordis.patch.yml) wins, then
// the MAGPIE_EXE environment variable, then the binary on PATH. This keeps the
// package usable on any machine instead of baking in one absolute path.
const DEFAULT_EXE =
	process.platform === 'win32'
		? 'magpie-windows-amd64.exe'
		: 'magpie';

/**
 * dsh-magpie — manage yetone/magpie (provider add/remove, model listing,
 * gateway health testing) from inside DSH chat via agent tools, and expose the
 * same operations to an admin page through the settings Remote.
 *
 * All behavior lives in `src/service.js` (wrapping the magpie CLI). The chat
 * tools here and the Remote surface (`src/remote.js`) both call that one layer,
 * so a single operation has exactly one implementation.
 *
 * Descriptors: parameters = { type:'object', properties, additionalProperties:false },
 * output.schema = { type:'object', properties:{text} }, execute returns
 * { text }, and render unwraps value.text.
 * @param ctx - tool registry.
 * @param config - { exe, cwd }.
 */
function apply(ctx, config) {
	const exe = config?.exe || process.env.MAGPIE_EXE || DEFAULT_EXE;
	const cwd = config?.cwd;
	const m = createMagpie(exe, cwd);
	const server = createMagpieServer({
		exe,
		cwd,
		gatewayPort: config?.gatewayPort ?? 3425,
		webPort: config?.webPort ?? 3430,
		webKey: config?.webKey || 'magpie-local-2026',
	});
	const service = createMagpieService(m, { server });

	// Loopback proxy that serves Magpie's real web UI with its sign-in cookie
	// injected server-side, so a cross-origin iframe in the DSH client (app://)
	// works without relying on third-party browser cookies.
	const webProxy = createWebProxy({
		webKey: config?.webKey || 'magpie-local-2026',
		port: config?.webProxyPort ?? 3450,
		upstreamPort: config?.webPort ?? 3430,
		staticRoot: fileURLToPath(new URL('./webui/', import.meta.url)),
	});
	void webProxy.start().then((ok) => {
		if (!ok) console.error('[dsh-magpie] Web 代理启动失败:', webProxy.status().lastError);
		else console.log('[dsh-magpie] Web 代理已启动:', webProxy.url);
	});
	ctx.effect(() => () => {
		void webProxy.stop();
	}, 'dsh-magpie: web proxy');

	registerMagpieRemote(ctx, service);

	// The plugin also *starts* Magpie: if the gateway is not already up when the
	// plugin activates, spawn `magpie serve --web`. Fire-and-forget so plugin
	// activation is never blocked; an already-running instance is left alone.
	if (config?.autoStart !== false) {
		void (async () => {
			try {
				const st = await server.status();
				if (!st.healthy) {
					const res = await server.start();
					if (!res.ok) console.error('[dsh-magpie] 自动启动 magpie 服务失败:', res.reason);
					else console.log('[dsh-magpie] 已自动启动 magpie 服务:', res.data?.gateway);
				}
			} catch (err) {
				console.error('[dsh-magpie] 自动启动 magpie 服务异常:', err);
			}
		})();
	}

	const textOutput = (render) => ({
		schema: {
			type: 'object',
			properties: { text: { type: 'string' } },
			required: ['text'],
			additionalProperties: false,
		},
		render: (_args, value) => [{ type: 'text', text: render(value) }],
	});

	ctx.tools.register({
		name: 'magpie_status',
		description: 'Check whether the local magpie LLM gateway is up (healthcheck) and list all configured providers with their host, key/sign-in state, and model counts. Returns the providers table and gateway health.',
		parameters: { type: 'object', properties: {}, additionalProperties: false },
		output: textOutput((value) => value.text),
		async execute() {
			const res = await service.status();
			return { text: res.ok ? res.text : res.reason };
		},
	});

	ctx.tools.register({
		name: 'magpie_provider_add',
		description: 'Add a model provider to magpie. Two forms: (1) a known preset by key — magpie provider add <preset> <key> (e.g. deepseek, openai, anthropic, google, etc.); (2) a custom vendor — magpie provider add <name> k=v... (fields per `magpie provider`). Use magpie_provider_presets to list known presets first.',
		parameters: {
			type: 'object',
			properties: {
				form: {
					type: 'string',
					enum: ['preset', 'custom'],
					description: 'preset = provider add <preset> <key>; custom = provider add <name> k=v…',
				},
				preset: { type: 'string', description: 'Known vendor/feature preset name (required when form=preset).' },
				key: { type: 'string', description: 'API key for the preset (required when form=preset).' },
				name: { type: 'string', description: 'Custom vendor name shown in magpie (required when form=custom).' },
				kv: { type: 'string', description: 'Space-separated k=v fields for a custom vendor (required when form=custom), e.g. host=https://... key=sk-...' },
			},
			additionalProperties: false,
		},
		output: textOutput((value) => value.text),
		async execute(args) {
			const res = await service.addProvider(args ?? {});
			return { text: res.ok ? res.text : res.reason };
		},
	});

	ctx.tools.register({
		name: 'magpie_provider_remove',
		description: 'Remove a provider from magpie by its id (magpie provider rm <id>). Use magpie_status to list provider ids first.',
		parameters: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'Provider id to remove, e.g. workbuddy-ai.' },
			},
			additionalProperties: false,
		},
		output: textOutput((value) => value.text),
		async execute(args) {
			const res = await service.removeProvider(args ?? {});
			return { text: res.ok ? res.text : res.reason };
		},
	});

	ctx.tools.register({
		name: 'magpie_provider_test',
		description: 'Test a provider connection through magpie (magpie provider test <id> [model...] [--as codex|claude-code]). Confirms the key/sign-in works and which models respond.',
		parameters: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'Provider id to test.' },
				model: { type: 'string', description: 'Optional single model to probe, e.g. deepseek/deepseek-chat.' },
				as: { type: 'string', enum: ['codex', 'claude-code'], description: 'Optional: test as a specific API dialect.' },
			},
			additionalProperties: false,
		},
		output: textOutput((value) => value.text),
		async execute(args) {
			const res = await service.testProvider(args ?? {});
			return { text: res.ok ? res.text : res.reason };
		},
	});

	ctx.tools.register({
		name: 'magpie_models',
		description: 'List every model magpie can route to, as provider/model, and why others are not available for an agent. Omit agent to list all. Useful to find a free or fallback model.',
		parameters: {
			type: 'object',
			properties: {
				agent: { type: 'string', description: 'Agent id (e.g. dsh, claude, codex, workbuddy-ai); omit for all models.' },
			},
			additionalProperties: false,
		},
		output: textOutput((value) => value.text),
		async execute(args) {
			const res = await service.models({ agent: args?.agent });
			return { text: res.ok ? res.text : res.reason };
		},
	});

	ctx.tools.register({
		name: 'magpie_provider_presets',
		description: 'List the vendors magpie knows natively (magpie presets), so you can add one with just a key via magpie_provider_add.',
		parameters: { type: 'object', properties: {}, additionalProperties: false },
		output: textOutput((value) => value.text),
		async execute() {
			const res = await service.presets();
			return { text: res.ok ? res.text : res.reason };
		},
	});

	ctx.tools.register({
		name: 'magpie_server_start',
		description: 'Start the local magpie service (magpie serve --web): the LLM gateway on http://127.0.0.1:3425 and Magpie\'s own web UI on http://127.0.0.1:3430, running together. A no-op if the gateway is already answering. The plugin also auto-starts this when it loads if the gateway is down.',
		parameters: { type: 'object', properties: {}, additionalProperties: false },
		output: textOutput((value) => value.text),
		async execute() {
			const res = await service.serverStart();
			return { text: res.ok ? res.text : res.reason };
		},
	});

	ctx.tools.register({
		name: 'magpie_server_stop',
		description: 'Stop the local magpie service (gateway + web UI). By default only a service this plugin started is stopped; set force=true to also stop an externally-started magpie.',
		parameters: {
			type: 'object',
			properties: {
				force: { type: 'boolean', description: 'Also stop an externally-started magpie (not spawned by this plugin).' },
			},
			additionalProperties: false,
		},
		output: textOutput((value) => value.text),
		async execute(args) {
			const res = await service.serverStop({ force: args?.force });
			return { text: res.ok ? res.text : res.reason };
		},
	});

	ctx.tools.register({
		name: 'magpie_server_restart',
		description: 'Restart the local magpie service (stop then start magpie serve --web).',
		parameters: { type: 'object', properties: {}, additionalProperties: false },
		output: textOutput((value) => value.text),
		async execute() {
			const res = await service.serverRestart();
			return { text: res.ok ? res.text : res.reason };
		},
	});

	ctx.tools.register({
		name: 'magpie_web_status',
		description: 'Report the plugin-internal web host that serves Magpie\'s bundled UI (default http://127.0.0.1:3450/): whether it is listening, its static root and upstream. Useful when the workspace panel is blank.',
		parameters: { type: 'object', properties: {}, additionalProperties: false },
		output: textOutput((value) => value.text),
		async execute() {
			return { text: JSON.stringify(webProxy.status(), null, 2) };
		},
	});
}

export { apply, inject, name };