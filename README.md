# dsh-magpie

在 **DeepSeek Harness (DSH)** 里管理 [Magpie](https://github.com/yetone/magpie)（yetone/magpie，Go 编写的模型路由网关）：一键启动服务、管理供应商与模型，并把 **Magpie 官方 Web 界面**直接显示在 DSH 工作区里。

> 本项目是一个 DSH 插件（Client + Host 双面），不是 Magpie 本身。它调用你本机已安装的 Magpie。

## 功能

- **服务控制**：启动 / 停止 / 重启本机 Magpie（`magpie serve --web`，网关 `127.0.0.1:3425` + Web `127.0.0.1:3430`）；网关未运行时插件加载会自动拉起。
- **工作区面板**：左侧边栏出现 **Magpie** 图标，点击后在中间工作区直接显示 **Magpie 官方 Web 管理界面**（用量/概览、供应商卡片、账号、签到、模型、设置等），与浏览器打开 `http://127.0.0.1:3430/` 完全一致。
- **原生管理页**：设置页内也有「magpie 网关」区块，可增删/测试供应商、查看路由模型与内置预设。
- **聊天工具**（给 Agent 用）：`magpie_status`、`magpie_provider_add/remove/test`、`magpie_models`、`magpie_provider_presets`、`magpie_server_start/stop/restart`、`magpie_web_status`。

### 为什么需要一个内置 Web 主机

DSH 桌面客户端运行在 `app://` 自定义协议下，直接 `<iframe>` 打开 `http://127.0.0.1:3430` 属于第三方上下文，Magpie 的登录 cookie 会被浏览器丢弃，因此会卡在登录页。插件因此：

1. 把 Magpie 的 Web 前端资产内置到 `webui/`（来自 Magpie 仓库 `internal/gui/assets/`）；
2. 在本机回环地址起一个 Web 主机（默认 `http://127.0.0.1:3450/`），**优先**返回内置静态文件，缺失的资源与 `/api/*`、动态 `boot.js` 转发到 `127.0.0.1:3430`，并在服务端注入 Magpie 的登录 cookie。

这样内嵌页面与其 API 同源，无需浏览器 cookie 即可正常工作。

## 环境要求

- DeepSeek Harness（桌面客户端或 Web）。
- 本机已安装 **Magpie**（Windows 单文件 `magpie-windows-amd64.exe`，或 Linux/macOS 的 `magpie`）。
- Node.js ≥ 22（DSH 运行时自带）。

本仓库**不包含** Magpie 可执行文件，请自行获取：https://github.com/yetone/magpie

## 安装

方式一：本地目录（开发/自用）

```bash
# 在 DSH profile 中把本包作为 bundle 链接安装（参考你的 DSH profile 的 package.json）
```

方式二：从 Git 仓库安装，用 DSH 的插件管理器添加该包（`dsh plugin add <path-or-git-url>`）。

安装后，DSH 会读取 `cordis.patch.yml` 插入插件行。

## 配置

推荐用**环境变量**指定 Magpie 可执行文件：

```powershell
# Windows（PowerShell，写入用户环境变量，新进程生效）
setx MAGPIE_EXE "C:\path\to\magpie-windows-amd64.exe"
setx MAGPIE_CWD "C:\path\to\magpie"        # 可选：含 .portable / data 的目录
```

```bash
# Linux / macOS
export MAGPIE_EXE=/usr/local/bin/magpie
export MAGPIE_CWD=/path/to/magpie
```

`cordis.patch.yml` 里 `exe`/`cwd` 已经是**环境变量占位**：

```yaml
config:
  exe: !!js "process.env.MAGPIE_EXE || 'magpie-windows-amd64.exe'"
  cwd: !!js "process.env.MAGPIE_CWD || undefined"
```

`exe` 解析顺序：`config.exe`（上面的表达式）→ 环境变量 `MAGPIE_EXE` → PATH 中的 `magpie-windows-amd64.exe` / `magpie`。
不想用环境变量，也可以把上面 `exe`/`cwd` 直接改成普通字符串路径。

可选（插件行 config 里）：`webPort`（Magpie Web，默认 3430）、`gatewayPort`（默认 3425）、`webProxyPort`（本插件内置 Web 主机，默认 3450）、`autoStart`（默认 true）。

> 安全：内置 Web 主机只绑定 `127.0.0.1`，不对外暴露。

## 目录结构

```
index.js            Host 入口：注册工具、Remote、启动内置 Web 主机、自动拉起 Magpie
src/service.js      共享服务层（CLI 封装、解析）
src/remote.js       Host 侧 Typert Remote 描述符
src/server.js       Magpie 进程管理（启动/停止/重启/健康探测）
src/web-proxy.js    内置 Web 主机（内置静态 + 反代 + 注入登录 cookie）
lib/client.js       浏览器端产物（工作区面板、设置页、原生管理 UI）
src/client/index.jsx 上述客户端源码
webui/              Magpie 官方 Web 前端资产（MIT，见 THIRD_PARTY_NOTICES.md）
cordis.patch.yml    Loader 行
scripts/build-client.mjs  构建客户端产物（esbuild）
```

重新构建客户端：`npm run build:client`（需要 `npm install` 安装 esbuild 等 devDependencies）。

## 归属与许可

- 本插件：MIT（见 [LICENSE](./LICENSE)）。
- 内置的 Magpie Web 前端与图标：来自 [yetone/magpie](https://github.com/yetone/magpie)，MIT，详见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
