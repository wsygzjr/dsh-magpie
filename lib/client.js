window.__ModuleLoader__.load({
	id: "dsh-magpie",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/remote.js
var PACKAGE = "dsh-magpie";
var SERVICE = "magpieRemote";
var NAMESPACE = "magpie";
function parseObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("magpie remote result must be an object");
  }
  return value;
}
function parseString(value) {
  if (typeof value !== "string") throw new TypeError("magpie argument must be a string");
  return value;
}
function codec(typeName, parse) {
  return {
    mode: "strict",
    typeSymbol: `${PACKAGE}#${typeName}`,
    create: () => ({ parse })
  };
}
var snapshotCodec = codec("UiSnapshot", parseObject);
var stringCodec = codec("String", parseString);
function descriptor(method, parameters, result) {
  return {
    id: `${PACKAGE}#${NAMESPACE}/${method}`,
    service: SERVICE,
    namespace: NAMESPACE,
    method,
    invocation: { kind: "direct" },
    parameters,
    result
  };
}
var MAGPIE_REMOTE_DESCRIPTORS = Object.freeze([
  descriptor("status", [], snapshotCodec),
  descriptor("list", [], snapshotCodec),
  descriptor("presets", [], snapshotCodec),
  descriptor(
    "models",
    [{ name: "agent", wire: "agent", source: "json", codec: stringCodec }],
    snapshotCodec
  ),
  descriptor(
    "addProvider",
    [{ name: "args", wire: "args", source: "json", codec: snapshotCodec }],
    snapshotCodec
  ),
  descriptor(
    "removeProvider",
    [{ name: "id", wire: "id", source: "json", codec: stringCodec }],
    snapshotCodec
  ),
  descriptor(
    "testProvider",
    [{ name: "args", wire: "args", source: "json", codec: snapshotCodec }],
    snapshotCodec
  ),
  descriptor("ping", [], snapshotCodec),
  descriptor("serverStatus", [], snapshotCodec),
  descriptor("serverStart", [], snapshotCodec),
  descriptor(
    "serverStop",
    [{ name: "args", wire: "args", source: "json", codec: snapshotCodec }],
    snapshotCodec
  ),
  descriptor("serverRestart", [], snapshotCodec)
]);
var MAGPIE_HOST_CONTRIBUTION = Object.freeze({
  package: PACKAGE,
  face: "host",
  schemas: [],
  model: {
    services: [],
    events: [],
    objects: []
  },
  invocations: MAGPIE_REMOTE_DESCRIPTORS
});
var MAGPIE_CLIENT_CONTRIBUTION = Object.freeze({
  package: PACKAGE,
  descriptors: MAGPIE_REMOTE_DESCRIPTORS
});

// src/client/index.jsx
var import_jsx_runtime = require("react/jsx-runtime");
function resultOf(value) {
  var _a, _b, _c, _d, _e;
  if (value === null || typeof value !== "object") throw new Error("\u8FDC\u7A0B\u8FD4\u56DE\u4E86\u65E0\u6548\u6570\u636E");
  if ("value" in value || "error" in value) {
    if (value.ok !== true) throw new Error((_c = (_b = (_a = value.error) == null ? void 0 : _a.message) != null ? _b : value.reason) != null ? _c : "\u8FDC\u7A0B\u8C03\u7528\u5931\u8D25");
    const inner = value.value;
    if (inner && typeof inner === "object" && "ok" in inner) {
      if (inner.ok !== true) throw new Error((_d = inner.reason) != null ? _d : "Remote \u8C03\u7528\u5931\u8D25");
      return inner.data;
    }
    return inner;
  }
  if (value.ok !== true) throw new Error((_e = value.reason) != null ? _e : "Remote \u8C03\u7528\u5931\u8D25");
  return value.data;
}
var messageOf = (cause) => cause instanceof Error ? cause.message : String(cause);
var esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var AUTH = {
  signedin: { color: "#22c55e", label: "\u5DF2\u767B\u5F55" },
  none: { color: "#94a3b8", label: "\u514D\u5BC6\u94A5" },
  masked: { color: "#eab308", label: "\u5DF2\u5B58\u5BC6\u94A5" },
  key: { color: "#22c55e", label: "\u6709\u5BC6\u94A5" }
};
var STYLE = `
.mg-root{color:inherit;font:inherit;max-width:920px}
.mg-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.mg-title{margin:0;font-size:17px;font-weight:650}
.mg-badge{display:inline-flex;align-items:center;gap:6px;padding:2px 9px;border-radius:999px;font-size:12px;border:1px solid rgba(148,163,184,.32)}
.mg-dot{width:7px;height:7px;border-radius:999px;display:inline-block}
.mg-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:16px}
.mg-cell{border:1px solid rgba(148,163,184,.18);border-radius:10px;padding:9px 11px}
.mg-key{font-size:11.5px;opacity:.6;letter-spacing:.03em;text-transform:uppercase}
.mg-val{margin-top:3px;font-size:13px;word-break:break-all}
.mg-sec{margin-top:22px}
.mg-sec h3,.mg-h3{margin:0 0 10px;font-size:14.5px;font-weight:600;display:inline-block}
.mg-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.mg-table{width:100%;border-collapse:collapse;font-size:13px}
.mg-table th{text-align:left;font-weight:600;padding:6px 10px;border-bottom:1px solid rgba(148,163,184,.2);opacity:.7}
.mg-table td{padding:6px 10px;border-bottom:1px solid rgba(148,163,184,.12);vertical-align:top}
.mg-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}
.mg-input{border:1px solid rgba(148,163,184,.35);border-radius:8px;padding:7px 10px;background:transparent;color:inherit;font:inherit;font-size:13px;min-width:120px}
.mg-btn{border:1px solid rgba(148,163,184,.35);border-radius:9px;padding:7px 13px;background:transparent;color:inherit;cursor:pointer;font:inherit}
.mg-primary{border:0;border-radius:9px;padding:8px 14px;font-weight:600;cursor:pointer;color:#04121f;background:linear-gradient(135deg,#22c55e,#0ea5e9);font:inherit}
.mg-danger{border:1px solid rgba(239,68,68,.45);border-radius:9px;padding:5px 10px;color:inherit;background:transparent;cursor:pointer;font-size:12.5px;font:inherit}
.mg-err{margin:12px 0 0;font-size:13px;color:#fca5a5}
.mg-okmsg{margin:12px 0 0;font-size:13px;color:#86efac}
.mg-pre{margin:10px 0 0;padding:10px;border-radius:8px;background:rgba(148,163,184,.08);font-size:12px;white-space:pre-wrap;word-break:break-all;max-height:260px;overflow:auto}
.mg-text{margin:10px 0 0;font-size:13.5px;opacity:.8;line-height:1.6}
`;
var STYLE_EXTRA = `
.mg-root{padding:24px 28px;max-width:1080px;margin:0 auto;box-sizing:border-box}
.mg-title{font-size:22px;font-weight:700}
.mg-sec{border:1px solid rgba(148,163,184,.22);border-radius:14px;padding:16px 18px;background:rgba(148,163,184,.045);margin-top:16px}
.mg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.mg-pcard{border:1px solid rgba(148,163,184,.22);border-radius:12px;padding:12px 14px;background:rgba(148,163,184,.03);display:flex;flex-direction:column;gap:7px}
.mg-pc-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.mg-pc-name{font-weight:600;font-size:14px}
.mg-pc-row{font-size:12.5px;display:flex;justify-content:space-between;gap:8px;opacity:.88}
.mg-pc-actions{display:flex;gap:8px;margin-top:4px}
`;
var SKELETON = `
<style>${STYLE}${STYLE_EXTRA}</style>
<div class="mg-root">
  <div class="mg-h">
    <h2 class="mg-title">magpie \u7F51\u5173\u7BA1\u7406</h2>
    <span class="mg-badge" id="mg-ver">v1.0.26</span>
    <span class="mg-badge" id="mg-health">\u8BFB\u53D6\u4E2D\u2026</span>
    <button type="button" class="mg-btn" data-act="open-web" style="margin-left:auto">\u6253\u5F00 Magpie Web\uFF08\u5168\u5C4F\uFF09</button>
  </div>
  <p class="mg-text">\u7BA1\u7406\u672C\u673A magpie LLM \u7F51\u5173\uFF1A\u63D0\u4F9B\u5546\u589E\u5220\u6539\u67E5\u3001\u8FDE\u63A5\u6D4B\u8BD5\u3001\u8DEF\u7531\u6A21\u578B\u4E0E\u5185\u7F6E\u9884\u8BBE\u3002\u4E0E Agent \u5DE5\u5177\u5171\u4EAB\u540C\u4E00\u5B9E\u73B0\u3002</p>
  <div class="mg-meta" id="mg-meta"></div>

  <div class="mg-sec">
    <div class="mg-row"><h3>\u670D\u52A1\u63A7\u5236\uFF08\u542F\u52A8 Magpie\uFF09</h3><span class="mg-badge" id="mg-svc-badge">\u2026</span></div>
    <div class="mg-meta" id="mg-svc"></div>
    <div class="mg-row" style="margin-top:12px">
      <button type="button" class="mg-primary" data-act="start">\u542F\u52A8\u670D\u52A1</button>
      <button type="button" class="mg-btn" data-act="restart">\u91CD\u542F</button>
      <button type="button" class="mg-danger" data-act="stop">\u505C\u6B62</button>
      <span class="mg-key" id="mg-svc-err"></span>
    </div>
  </div>

  <div class="mg-row"><h3 class="mg-h3">\u6DFB\u52A0\u63D0\u4F9B\u5546</h3><button type="button" class="mg-btn" data-act="toggle-form" id="mg-form-lbl">\u5207\u6362\u5230\u81EA\u5B9A\u4E49</button></div>
  <form id="mg-add" class="mg-row" style="margin-bottom:10px">
    <span id="mg-grp-preset" class="mg-row">
      <input class="mg-input" id="mg-preset" placeholder="\u9884\u8BBE\u540D\uFF0C\u5982 deepseek" autocomplete="off">
      <input class="mg-input" id="mg-key" type="password" placeholder="API key" autocomplete="off" style="min-width:240px">
      <button type="submit" class="mg-primary">\u6DFB\u52A0</button>
      <button type="button" class="mg-btn" data-act="presets">\u67E5\u770B\u5185\u7F6E\u9884\u8BBE</button>
    </span>
    <span id="mg-grp-custom" class="mg-row" style="display:none">
      <input class="mg-input" id="mg-name" placeholder="\u540D\u79F0\uFF0C\u5982 my-openai" autocomplete="off">
      <input class="mg-input" id="mg-kv" placeholder="k=v \u5B57\u6BB5\uFF0C\u5982 host=https://\u2026 key=sk-\u2026" autocomplete="off" style="min-width:240px">
      <button type="submit" class="mg-primary">\u6DFB\u52A0</button>
    </span>
  </form>

  <div id="mg-msg"></div>

  <div class="mg-sec">
    <div class="mg-row"><h3>\u63D0\u4F9B\u5546</h3><button type="button" class="mg-btn" data-act="refresh">\u5237\u65B0</button></div>
    <div id="mg-providers"></div>
  </div>

  <div class="mg-sec">
    <div class="mg-row">
      <h3>\u8DEF\u7531\u6A21\u578B</h3>
      <select class="mg-input" id="mg-agent">
        <option value="">\u5168\u90E8\u6A21\u578B</option>
        <option value="dsh">dsh</option>
        <option value="claude">claude</option>
        <option value="codex">codex</option>
        <option value="workbuddy-ai">workbuddy-ai</option>
      </select>
      <button type="button" class="mg-btn" data-act="models">\u67E5\u770B</button>
    </div>
    <div id="mg-models"></div>
  </div>

  <div class="mg-sec" id="mg-presets-sec" style="display:none">
    <h3>\u5185\u7F6E\u9884\u8BBE</h3>
    <div id="mg-presets"></div>
  </div>
</div>
`;
var inject = ["slots", "remote"];
var BIRD_PATH = "M1.5 5.5C1.3 5.7 1.2 6.5 1.2 6.9C1.2 6.9 1.2 7 1.2 7.1C1.1 7.4 1.3 8 1.4 8.3C1.4 8.4 1.5 8.5 1.5 8.7C1.5 8.9 1.7 9 1.8 9.3C2.2 9.9 2.2 10 2.3 10.1C2.4 10.2 2.5 10.3 2.6 10.5C2.8 10.8 3 11.1 3.2 11.3C3.3 11.3 3.4 11.6 3.6 11.8C3.8 12 4.1 12.4 4.2 12.5C4.7 13 5.2 13.7 5.4 13.9C6 14.5 6.5 15.1 6.7 15.3C6.7 15.4 6.9 15.5 6.9 15.7C7.3 15.9 7.7 16.5 7.9 16.8C7.9 16.8 8 16.9 8 16.9C8.1 16.9 8.2 17.2 8.2 17.3C8.2 17.3 8.1 17.2 8.1 17.1C7.9 16.9 7.9 16.9 7.6 16.6C7.5 16.5 7.4 16.5 7.4 16.3C7.2 16.2 6.7 15.7 6.3 15.2C6.1 15.1 6 14.9 6 14.9C5.9 14.8 5.7 14.7 5.7 14.6C5.6 14.5 5.4 14.3 5.3 14.2C5.1 14.1 4.9 13.8 4.7 13.5C4.5 13.3 4.2 13.1 4.1 12.9C4.1 12.9 3.8 12.7 3.8 12.5C3.5 12.3 3 11.8 2.8 11.4C1.8 10.5 0.9 9.6 0.7 9.6C0.6 9.7 0.6 9.8 0.5 10C0.5 10.1 0.6 10.2 0.5 10.3C0.5 10.4 0.6 10.5 0.6 10.6C0.5 10.7 0.5 10.9 0.6 11C0.5 11.1 0.6 11.4 0.6 11.5C0.9 12.9 1.3 13.8 2.8 14.9C2.9 15.1 3.3 15.3 3.4 15.4C3.4 15.5 3.6 15.6 3.7 15.7C4.2 16 6.4 17.8 7 18.4C7.4 18.8 7.4 18.8 7.5 18.9C7.6 19 7.7 19 7.7 19.1C7.7 19.2 7.8 19.2 7.9 19.2C7.9 19.3 8.1 19.4 8.1 19.5C8.2 19.6 8.2 19.7 8.3 19.7C8.3 19.7 8.3 19.7 8.2 19.7C8.2 19.6 8.1 19.6 8 19.6C7.9 19.5 7.9 19.4 7.8 19.4C7.7 19.3 7.6 19.2 7.6 19.2C7.6 19.1 7.5 19 7.3 18.9C7.2 18.9 6.9 18.6 6.7 18.4C6.1 17.8 4.5 16.6 3.5 16C3.4 15.8 3 15.6 2.9 15.5C2.6 15.3 1.5 14.6 0.9 14.3C0.7 14.1 0.6 14.1 0.6 14.2C0.5 14.5 0.8 15.9 0.9 16.1C0.9 16.2 1 16.2 0.9 16.3C1.2 16.8 1.9 17.6 2.7 18.3C2.8 18.5 4 19.2 4.7 19.5C6.2 20.5 6.6 20.7 7.4 21.5C8.2 22.2 8.7 22.7 9.3 23.6C9.5 24.1 9.9 24.4 10.3 25.3C10.4 25.5 10.5 25.8 10.5 25.8C10.7 25.8 10.8 25.7 11 25.4C11.6 25 11.9 24.6 12.3 24.3C12.8 24 13 23.8 13 23.7C13.1 23.7 13.1 23.8 13 24C12 24.8 11 26 10.2 26.9C10.1 27.1 9.9 27.5 9.7 27.7C9.5 27.8 9.4 28 9.4 28C9.4 28 9.3 28.3 9.1 28.5C8.6 29.2 7.7 30.8 7.7 30.9C7.7 31 7.8 31 8.3 30.8C9 30.4 9.5 30.2 10.4 30C11.7 29.6 12.5 29.6 11.6 30C10.5 30.2 9.7 30.6 9.2 31.2C8.8 31.7 8.8 31.7 9.3 31.7C10.1 31.8 10.9 31.9 11.6 32.2C12.8 32.7 13.5 33.1 15.5 34.8C16.4 35.5 17.3 36.2 17.8 36.4C17.9 36.5 18.1 36.7 18.2 36.8C19.1 37.3 21.2 38.1 22.3 38.3C22.4 38.3 22.7 38.3 22.8 38.3C22.8 38.5 23 38.5 23 38.5C23.1 38.5 23.2 38.5 23.3 38.5C23.6 38.6 25.9 38.6 26.1 38.5C26.2 38.5 26.3 38.5 26.4 38.5C26.5 38.5 26.6 38.5 26.7 38.3C26.7 38.3 27 38.3 27.1 38.3C28.3 38.1 30.2 37.3 31.4 36.7C31.5 36.7 31.7 36.4 31.8 36.4C32.2 36.2 33.2 35.4 33.4 35.2C34.2 34.5 35.5 33 35.8 32.6C35.8 32.5 36 32.2 36.1 32C36.4 31.8 36.6 31.4 36.6 31.2C36.7 31.1 36.8 30.9 36.9 30.8C37.2 30.4 37.5 29.6 37.7 29.2C37.7 29.1 37.8 28.7 37.9 28.7C38.1 28.5 38.4 27.1 38.5 26.8C39 25.2 39.1 23.7 39 22.4C39 22.2 38.9 21.9 38.9 21.8C38.9 21.7 38.9 21.6 38.9 21.4C38.6 20.5 38.5 19.9 38.2 19C37.9 18.5 37.5 17.5 37.3 17.2C37 16.8 36.8 15.8 36.8 15.2C36.8 13.8 37.7 12.7 39.6 12.2C40.1 12.1 41.3 11.8 42.1 11.7C43.5 11.5 43.5 11.5 43.4 11.3C42.9 10.7 40.9 9.9 39.2 9.7C37.9 9.5 38.1 9.5 37.6 9C37 8.6 36.4 8 36 7.9C36 7.8 35.8 7.8 35.7 7.7C35.1 7.3 34.2 7 33.1 6.9C32.6 6.7 31.6 6.9 31 7C29.6 7.3 28.3 8 27.3 9.2C26.7 9.8 26.2 10.8 25.7 11.7C25.5 12.1 24.8 13.4 24.7 13.7C24.6 13.9 24.5 14.1 24.1 14.7C23.5 15.7 22.1 16.9 20.6 17.8C20.5 18 20.3 18.2 20.1 18.3C19.7 18.5 19.4 18.8 19.1 19C18.9 19.1 18.7 19.3 18.5 19.4C18 19.8 17.2 20.3 17 20.5C16.9 20.5 16.8 20.6 16.7 20.7C16.3 20.8 16.1 20.9 16 20.9C15.5 20.8 14.9 20.5 14.2 20.2C13.7 19.8 12.7 18.9 12.4 18.6C12.3 18.5 12.2 18.4 12.1 18.2C11.9 18 11.2 17.1 11 16.6C10.9 16.5 10.8 16.4 10.7 16.3C10.7 16.2 10.6 16.1 10.6 15.9C10.5 15.9 10.4 15.7 10.4 15.6C10.3 15.5 10.2 15.2 10.1 15C10 14.8 9.8 14.4 9.7 14.2C9.6 14 9.5 13.7 9.4 13.6C9.4 13.4 9.3 13.2 9.2 13C9.2 12.8 9 12.6 9 12.5C8.9 12.3 8.7 12.1 8.7 12C8.7 12 8.5 11.7 8.5 11.7C8.3 11.2 8.2 10.9 7.5 10C6.4 8.3 4.2 6.4 2.7 5.8C2 5.5 1.6 5.4 1.5 5.5ZM28.4 16.7C29.2 16.9 29.7 17.2 29.9 17.7C30.1 18.2 30 18.9 29.6 19.4C29.2 19.9 28.2 20.9 27.6 21.2C26.8 21.7 25.3 22.4 24.2 22.7C23.9 22.8 23.6 22.9 23.5 22.9C22.8 23.2 20.7 23.7 19.6 24C19 24.2 18.4 24.3 18.1 24.4C17.9 24.4 16.1 24.9 15.3 25.1C14.6 25.2 14.7 25.1 15.7 23.6C16.4 22.7 18.5 20.6 19.4 19.9C20.8 18.8 21.4 18.4 23.2 17.6C23.8 17.4 25.6 16.8 25.9 16.8C25.9 16.8 26.3 16.8 26.6 16.7C26.8 16.7 28.2 16.7 28.4 16.7ZM30.4 20.2C30.5 20.3 30.6 20.6 30.6 20.7C31.7 23.1 33.4 24.6 35.6 25.3C36.1 25.5 36.7 25.7 37.2 25.8C37.7 25.8 37.8 25.9 37.8 26.1C37.7 26.2 37.7 26.3 37.7 26.5C37.7 26.6 37.7 26.8 37.6 27C37.4 28.5 36.8 29.9 36.1 31C36.1 31.2 35.9 31.4 35.9 31.6C35.7 31.9 35.2 32.6 34.7 33.3C32.6 35.6 29.7 37.3 26.6 37.8C26.5 37.8 26.3 37.9 26.2 37.9C25.8 37.9 23.7 37.9 23.3 37.9C23.2 37.9 23 37.8 22.9 37.8C21.1 37.6 19.3 36.8 18 35.7C17.7 35.4 17 34.7 16.8 34.5C16.3 33.8 16.1 33 16.3 32.5C16.5 31.8 16.8 31.6 17.9 31.1C19.1 30.5 19.4 30.4 20.2 30C21.4 29.4 23.2 28.4 23.9 27.9C23.9 27.8 24.2 27.7 24.5 27.6C26.3 26.3 28 24.6 28.9 22.9C29.5 22.2 29.7 21.6 29.9 20.7C30.1 20 30.2 19.9 30.4 20.2Z";
function MagpieIcon(owner) {
  const size = owner && owner.size ? owner.size : 16;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: size, height: size, viewBox: "0 0 44 44", "aria-hidden": "true", style: { display: "block" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", fillRule: "evenodd", d: BIRD_PATH }) });
}
function makeView() {
  let teardown = null;
  let currentProps = null;
  const ref = (node) => {
    if (teardown) {
      try {
        teardown();
      } catch {
      }
      teardown = null;
    }
    if (node) teardown = mountPanel(node, currentProps);
  };
  function View(props) {
    currentProps = props;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mg-root", ref });
  }
  return View;
}
var MAGPIE_WEB_KEY = "magpie-local-2026";
var PROXY_URL = "http://127.0.0.1:3450/";
function defaultWebUrl(key) {
  const k = key || MAGPIE_WEB_KEY;
  return "http://127.0.0.1:3430/?k=" + encodeURIComponent(k);
}
function mountWebView(root, props) {
  root.style.width = "100%";
  root.style.height = "100%";
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.gap = "8px";
  const btnStyle = "border:1px solid rgba(148,163,184,.35);border-radius:8px;padding:4px 10px;background:transparent;color:inherit;cursor:pointer;font:inherit;font-size:12px";
  const bar = document.createElement("div");
  bar.setAttribute("style", "display:flex;align-items:center;gap:8px;font-size:12px");
  const label = document.createElement("span");
  label.textContent = "Magpie Web";
  label.setAttribute("style", "font-weight:600");
  const urlText = document.createElement("span");
  urlText.textContent = PROXY_URL;
  urlText.setAttribute("style", "flex:1;opacity:.55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
  const reloadBtn = document.createElement("button");
  reloadBtn.type = "button";
  reloadBtn.textContent = "\u5237\u65B0";
  reloadBtn.setAttribute("style", btnStyle);
  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.textContent = "\u5728\u6D4F\u89C8\u5668\u6253\u5F00";
  openBtn.setAttribute("style", btnStyle);
  bar.appendChild(label);
  bar.appendChild(urlText);
  bar.appendChild(reloadBtn);
  bar.appendChild(openBtn);
  const frame = document.createElement("iframe");
  frame.title = "Magpie";
  frame.setAttribute(
    "style",
    "width:100%;flex:1 1 auto;min-height:520px;border:0;display:block;border-radius:12px;background:#0b1220"
  );
  frame.src = PROXY_URL;
  root.appendChild(bar);
  root.appendChild(frame);
  const hint = document.createElement("div");
  hint.setAttribute(
    "style",
    "display:none;padding:12px 14px;font-size:13px;line-height:1.6;border:1px solid rgba(239,68,68,.45);border-radius:10px;margin-top:8px"
  );
  hint.textContent = "\u65E0\u6CD5\u8FDE\u63A5\u63D2\u4EF6\u5185\u7F6E Web \u670D\u52A1\uFF08127.0.0.1:3450\uFF09\u3002\u8BF7\u5B8C\u5168\u9000\u51FA\u5E76\u91CD\u5F00 DeepSeek Harness \u4EE5\u52A0\u8F7D\u65B0\u7248 Host\uFF1B\u82E5\u4ECD\u5931\u8D25\uFF0C\u53EF\u80FD\u662F 3450 \u7AEF\u53E3\u88AB\u5360\u7528\u3002";
  root.appendChild(hint);
  void (async () => {
    try {
      await fetch(PROXY_URL + "boot.js", { mode: "no-cors", cache: "no-store" });
    } catch {
      hint.style.display = "";
    }
  })();
  const openExternal = () => {
    try {
      globalThis.open(defaultWebUrl(), "_blank");
    } catch {
    }
  };
  const reload = () => {
    try {
      frame.src = frame.src;
    } catch {
    }
  };
  openBtn.addEventListener("click", openExternal);
  reloadBtn.addEventListener("click", reload);
  return () => {
    try {
      openBtn.removeEventListener("click", openExternal);
      reloadBtn.removeEventListener("click", reload);
    } catch {
    }
    frame.remove();
    hint.remove();
    bar.remove();
  };
}
function makeWebView() {
  let teardown = null;
  let currentProps = null;
  const ref = (node) => {
    if (teardown) {
      try {
        teardown();
      } catch {
      }
      teardown = null;
    }
    if (node) teardown = mountWebView(node, currentProps);
  };
  function View(props) {
    currentProps = props;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref, style: { width: "100%", height: "100%" } });
  }
  return View;
}
function mountPanel(root, props) {
  const st = {
    snapshot: null,
    error: "",
    notice: "",
    busy: "",
    view: "providers",
    detail: null,
    models: [],
    presets: [],
    modelsAgent: "",
    addForm: "preset"
  };
  root.innerHTML = SKELETON;
  const $ = (id) => root.querySelector("#" + id);
  const setMsg = () => {
    const box = $("mg-msg");
    if (!box) return;
    let html = "";
    if (st.error) html += `<div class="mg-err">${esc(st.error)}</div>`;
    else if (st.notice) html += `<div class="mg-okmsg">${esc(st.notice)}</div>`;
    if (st.detail) {
      const text = typeof st.detail === "string" ? st.detail : JSON.stringify(st.detail, null, 2);
      html += `<pre class="mg-pre">${esc(text)}</pre>`;
    }
    box.innerHTML = html;
  };
  const renderHealth = () => {
    const s = st.snapshot;
    const healthy = !!(s == null ? void 0 : s.healthy);
    const h = $("mg-health");
    if (h) {
      h.innerHTML = `<span class="mg-dot" style="background:${healthy ? "#22c55e" : "#ef4444"}"></span>${healthy ? "\u670D\u52A1\u6B63\u5E38" : s ? "\u672A\u54CD\u5E94" : "\u8BFB\u53D6\u4E2D\u2026"}`;
    }
    const meta = $("mg-meta");
    if (meta) {
      meta.innerHTML = `
        <div class="mg-cell"><div class="mg-key">\u63D0\u4F9B\u5546</div><div class="mg-val">${s ? esc(s.providerCount) : "\u2014"}</div></div>
        <div class="mg-cell"><div class="mg-key">\u5065\u5EB7\u68C0\u67E5</div><div class="mg-val">${s ? esc(s.healthText || (healthy ? "ok" : "failed")) : "\u2014"}</div></div>
        <div class="mg-cell"><div class="mg-key">\u5237\u65B0\u65F6\u95F4</div><div class="mg-val">${s ? esc(new Date(s.at).toLocaleTimeString()) : "\u2014"}</div></div>`;
    }
  };
  const renderService = () => {
    var _a;
    const srv = ((_a = st.snapshot) == null ? void 0 : _a.server) || null;
    const healthy = !!(srv == null ? void 0 : srv.healthy);
    const running = !!(srv == null ? void 0 : srv.running);
    const external = !!(srv == null ? void 0 : srv.external);
    const badge = $("mg-svc-badge");
    if (badge) {
      const color = healthy ? "#22c55e" : running ? "#eab308" : "#ef4444";
      badge.innerHTML = `<span class="mg-dot" style="background:${color}"></span>${healthy ? "\u8FD0\u884C\u4E2D" : running ? "\u5DF2\u542F\u52A8\u5F85\u54CD\u5E94" : "\u5DF2\u505C\u6B62"}${external ? " \xB7 \u5916\u90E8\u542F\u52A8" : ""}`;
    }
    const box = $("mg-svc");
    if (box) {
      const proc = srv ? srv.managed ? `\u6258\u7BA1 pid ${srv.pid}` : srv.external ? "\u5916\u90E8\u8FDB\u7A0B" : "\u672A\u8FD0\u884C" : "\u2014";
      box.innerHTML = `
        <div class="mg-cell"><div class="mg-key">\u8FDB\u7A0B</div><div class="mg-val">${esc(proc)}</div></div>
        <div class="mg-cell"><div class="mg-key">\u7F51\u5173</div><div class="mg-val mg-mono">${esc((srv == null ? void 0 : srv.gateway) || "\u2014")}</div></div>
        <div class="mg-cell"><div class="mg-key">Web \u754C\u9762</div><div class="mg-val mg-mono">${esc((srv == null ? void 0 : srv.web) || "\u2014")}</div></div>`;
    }
    const err = $("mg-svc-err");
    if (err) err.textContent = (srv == null ? void 0 : srv.lastError) || "";
  };
  const renderProviders = () => {
    const box = $("mg-providers");
    if (!box) return;
    const s = st.snapshot;
    if (!s) {
      box.innerHTML = `<p class="mg-text">\u6B63\u5728\u8BFB\u53D6\u2026</p>`;
      return;
    }
    if (s.providerError) {
      box.innerHTML = `<p class="mg-text">\u63D0\u4F9B\u5546\u5217\u8868\u8BFB\u53D6\u5931\u8D25\uFF1A${esc(s.providerError)}</p>`;
      return;
    }
    const list = s.providers || [];
    if (list.length === 0) {
      box.innerHTML = `<p class="mg-text">\u5C1A\u672A\u914D\u7F6E\u63D0\u4F9B\u5546\u3002</p>`;
      return;
    }
    const cards = list.map((p) => {
      var _a;
      const a = AUTH[p.authState] || AUTH.key;
      const detail = p.authDetail ? `<div class="mg-pc-row"><span class="mg-key">${esc(p.authDetail)}</span></div>` : "";
      const attr = p.attribution ? `<div class="mg-pc-row"><span class="mg-key">\u2190 ${esc(p.attribution)}</span></div>` : "";
      const models = p.modelsCount == null ? "\u2014" : `${esc(p.modelsCount)} / ${esc((_a = p.totalModels) != null ? _a : p.modelsCount)}`;
      return `<div class="mg-pcard">
          <div class="mg-pc-head">
            <span class="mg-pc-name">${esc(p.name)}</span>
            <span class="mg-badge" style="border-color:${a.color}66;color:${a.color}"><span class="mg-dot" style="background:${a.color}"></span>${a.label}</span>
          </div>
          <div class="mg-pc-row mg-mono"><span>${esc(p.id)}</span></div>
          <div class="mg-pc-row mg-mono"><span>${esc(p.host)}</span></div>
          <div class="mg-pc-row"><span class="mg-key">\u6A21\u578B</span><span>${models}</span></div>
          ${detail}${attr}
          <div class="mg-pc-actions">
            <button type="button" class="mg-btn" data-act="test" data-id="${esc(p.id)}">\u6D4B\u8BD5</button>
            <button type="button" class="mg-danger" data-act="remove" data-id="${esc(p.id)}">\u79FB\u9664</button>
          </div>
        </div>`;
    }).join("");
    box.innerHTML = `<div class="mg-grid">${cards}</div>`;
  };
  const renderModels = () => {
    const box = $("mg-models");
    if (!box) return;
    if (st.view !== "models") {
      box.innerHTML = "";
      return;
    }
    if (!st.models || st.models.length === 0) {
      box.innerHTML = `<p class="mg-text">\u672A\u89E3\u6790\u5230\u6A21\u578B\u3002</p>`;
      return;
    }
    box.innerHTML = st.models.map((sec) => {
      const rows = (sec.models || []).map(
        (m) => `<tr><td class="mg-mono">${esc(m.id)}</td><td>${esc(m.display)}</td><td>${esc(
          m.efforts && m.efforts.length ? m.efforts.join(" / ") : "\u2014"
        )}</td></tr>`
      ).join("");
      return `<div style="margin-top:10px"><h3 class="mg-h3">${esc(sec.name)}</h3><table class="mg-table"><tbody>${rows}</tbody></table></div>`;
    }).join("");
  };
  const renderPresets = () => {
    const sec = $("mg-presets-sec");
    if (sec) sec.style.display = st.view === "presets" ? "" : "none";
    if (st.view !== "presets") return;
    const box = $("mg-presets");
    if (!box) return;
    if (!st.presets || st.presets.length === 0) {
      box.innerHTML = `<p class="mg-text">\u672A\u89E3\u6790\u5230\u9884\u8BBE\u3002</p>`;
      return;
    }
    box.innerHTML = st.presets.map((g) => {
      const rows = (g.items || []).map(
        (it) => `<tr><td>${esc(it.name)}</td><td class="mg-mono">${esc(it.id)}</td><td class="mg-mono">${esc(
          it.addCommand || it.params
        )}</td></tr>`
      ).join("");
      return `<div style="margin-top:10px"><h3 class="mg-h3">${esc(g.name)}</h3><table class="mg-table"><thead><tr><th>\u540D\u79F0</th><th>ID</th><th>\u6DFB\u52A0\u547D\u4EE4</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }).join("");
  };
  const applyForm = () => {
    const presetGrp = $("mg-grp-preset");
    const customGrp = $("mg-grp-custom");
    const lbl = $("mg-form-lbl");
    if (presetGrp) presetGrp.style.display = st.addForm === "preset" ? "" : "none";
    if (customGrp) customGrp.style.display = st.addForm === "custom" ? "" : "none";
    if (lbl) lbl.textContent = st.addForm === "preset" ? "\u5207\u6362\u5230\u81EA\u5B9A\u4E49" : "\u5207\u6362\u5230\u5185\u7F6E\u9884\u8BBE";
  };
  const render = () => {
    renderHealth();
    renderService();
    renderProviders();
    renderModels();
    renderPresets();
    applyForm();
    setMsg();
  };
  const refresh = async () => {
    try {
      st.snapshot = resultOf(await props.status());
      st.error = "";
    } catch (cause) {
      st.error = messageOf(cause);
    }
    render();
  };
  const run = async (label, operation) => {
    st.busy = label;
    st.error = "";
    st.notice = "";
    try {
      st.detail = await operation();
    } catch (cause) {
      st.error = messageOf(cause);
    } finally {
      st.busy = "";
    }
    void refresh();
  };
  const addProvider = async () => {
    var _a, _b, _c, _d;
    if (st.addForm === "preset") {
      const preset = (((_a = $("mg-preset")) == null ? void 0 : _a.value) || "").trim();
      const key = (((_b = $("mg-key")) == null ? void 0 : _b.value) || "").trim();
      await run("add", async () => resultOf(await props.addProvider({ form: "preset", preset, key })));
      if (!st.error) {
        if ($("mg-preset")) $("mg-preset").value = "";
        if ($("mg-key")) $("mg-key").value = "";
      }
    } else {
      const name = (((_c = $("mg-name")) == null ? void 0 : _c.value) || "").trim();
      const kv = (((_d = $("mg-kv")) == null ? void 0 : _d.value) || "").trim();
      await run("add", async () => resultOf(await props.addProvider({ form: "custom", name, kv })));
      if (!st.error) {
        if ($("mg-name")) $("mg-name").value = "";
        if ($("mg-kv")) $("mg-kv").value = "";
      }
    }
  };
  const onClick = (event) => {
    var _a;
    const btn = event.target && event.target.closest ? event.target.closest("[data-act]") : null;
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "toggle-form") {
      st.addForm = st.addForm === "preset" ? "custom" : "preset";
      applyForm();
    } else if (act === "refresh") {
      void refresh();
    } else if (act === "presets") {
      void run("presets", async () => {
        st.presets = resultOf(await props.presets());
        st.view = "presets";
        return null;
      });
    } else if (act === "models") {
      st.modelsAgent = ((_a = $("mg-agent")) == null ? void 0 : _a.value) || "";
      void run("models", async () => {
        st.models = resultOf(await props.models(st.modelsAgent || void 0));
        st.view = "models";
        return null;
      });
    } else if (act === "start") {
      void run("server-start", async () => resultOf(await props.serverStart()));
    } else if (act === "stop") {
      void run("server-stop", async () => resultOf(await props.serverStop({})));
    } else if (act === "restart") {
      void run("server-restart", async () => resultOf(await props.serverRestart()));
    } else if (act === "test") {
      const id = btn.getAttribute("data-id");
      void run("test", async () => resultOf(await props.testProvider({ id })));
    } else if (act === "remove") {
      const id = btn.getAttribute("data-id");
      if (!globalThis.confirm(`\u79FB\u9664 provider\u300C${id}\u300D\uFF1F`)) return;
      void run("remove", async () => resultOf(await props.removeProvider(id)));
    } else if (act === "open-web") {
      let ok = false;
      try {
        ok = typeof props.openInPanel === "function" ? props.openInPanel() : false;
      } catch {
        ok = false;
      }
      st.error = "";
      st.notice = ok ? "\u5DF2\u5728 DSH \u6D4F\u89C8\u5668\u9762\u677F\u4E2D\u6253\u5F00 Magpie Web\u3002" : "\u65E0\u6CD5\u6253\u5F00 DSH \u6D4F\u89C8\u5668\u9762\u677F\u3002";
      setMsg();
    }
  };
  const onSubmit = (event) => {
    if (event.target && event.target.id === "mg-add") {
      event.preventDefault();
      void addProvider();
    }
  };
  root.addEventListener("click", onClick);
  root.addEventListener("submit", onSubmit);
  render();
  void refresh();
  const timer = globalThis.setInterval(() => void refresh(), 8e3);
  return () => {
    globalThis.clearInterval(timer);
    root.removeEventListener("click", onClick);
    root.removeEventListener("submit", onSubmit);
  };
}
function apply(ctx) {
  const anyCtx = ctx;
  ctx.effect(() => {
    let unmount;
    let namespace;
    let mountError;
    let sidebarRightService;
    let layoutService;
    let resolveReady;
    let rejectReady;
    const ready = new Promise((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    ready.catch(() => {
    });
    const mountRemote = async () => {
      try {
        if (!anyCtx.remote || typeof anyCtx.remote.$mount !== "function") {
          throw new Error("remote \u670D\u52A1\u4E0D\u53EF\u7528");
        }
        const dispose = await anyCtx.remote.$mount(MAGPIE_CLIENT_CONTRIBUTION);
        const ns = anyCtx.get("remote.magpie");
        if (!ns) {
          await dispose();
          throw new Error("remote.magpie \u672A\u6CE8\u518C");
        }
        unmount = dispose;
        namespace = ns;
        resolveReady(ns);
        console.info("[dsh-magpie] remote.magpie \u5DF2\u6302\u8F7D");
      } catch (cause) {
        mountError = messageOf(cause);
        console.error("[dsh-magpie] remote \u6302\u8F7D\u5931\u8D25:", cause);
        rejectReady(cause instanceof Error ? cause : new Error(mountError));
      }
    };
    void mountRemote();
    if (anyCtx.remote === void 0 && typeof anyCtx.inject === "function") {
      try {
        anyCtx.inject(["remote"], () => {
          if (namespace === void 0) void mountRemote();
        });
      } catch {
      }
    }
    try {
      if (typeof anyCtx.inject === "function") {
        anyCtx.inject(["layout", "sidebarRight"], (scoped) => {
          layoutService = scoped.layout;
          sidebarRightService = scoped.sidebarRight;
        });
      }
    } catch {
    }
    const invoke = async (method, args) => {
      const ns = await ready;
      return ns[method](...args != null ? args : []);
    };
    const buildProps = () => ({
      status: () => invoke("status"),
      list: () => invoke("list"),
      presets: () => invoke("presets"),
      models: (agent) => invoke("models", [agent]),
      addProvider: (args) => invoke("addProvider", [args]),
      removeProvider: (id) => invoke("removeProvider", [id]),
      testProvider: (args) => invoke("testProvider", [args]),
      ping: () => invoke("ping"),
      serverStatus: () => invoke("serverStatus"),
      serverStart: () => invoke("serverStart"),
      serverStop: (args) => invoke("serverStop", [args != null ? args : {}]),
      serverRestart: () => invoke("serverRestart"),
      mountError: () => mountError,
      openInPanel: () => {
        try {
          if (!sidebarRightService || typeof sidebarRightService.openTab !== "function") return false;
          sidebarRightService.openTab("browser", { params: { url: defaultWebUrl() }, revealIfOpened: true });
          if (layoutService && typeof layoutService.openRightbar === "function") {
            try {
              layoutService.openRightbar(false, true);
            } catch {
            }
          }
          return true;
        } catch {
          return false;
        }
      }
    });
    if (anyCtx.slots === void 0) {
      console.error("[dsh-magpie] slots \u670D\u52A1\u4E0D\u53EF\u7528\uFF0Cmagpie \u533A\u5757\u4E0D\u4F1A\u51FA\u73B0");
      return () => {
      };
    }
    const SettingsView = makeView();
    const WebView = makeWebView();
    const slotDispose = anyCtx.slots.inject(
      "settings.section",
      () => anyCtx.slots.register(
        {
          name: "settings.section",
          id: "magpie",
          order: 13,
          label: () => "magpie \u7F51\u5173",
          inject: buildProps
        },
        SettingsView
      )
    );
    const mainDispose = anyCtx.slots.inject(
      "main",
      () => anyCtx.slots.register({ name: "main", key: "magpie", inject: buildProps }, WebView)
    );
    const rowDispose = anyCtx.slots.inject(
      "sidebar.panellist",
      () => anyCtx.slots.register(
        { name: "sidebar.panellist", id: "magpie", order: 4, label: () => "Magpie" },
        MagpieIcon
      )
    );
    const disposeAll = (dispose) => {
      var _a;
      try {
        if (typeof dispose === "function") dispose();
        else (_a = dispose == null ? void 0 : dispose.dispose) == null ? void 0 : _a.call(dispose);
      } catch {
      }
    };
    return () => {
      disposeAll(slotDispose);
      disposeAll(mainDispose);
      disposeAll(rowDispose);
      try {
        unmount == null ? void 0 : unmount();
      } catch {
      }
    };
  }, "magpie: admin settings page");
}
		return module.exports;
	},
});
//# sourceMappingURL=client.js.map
