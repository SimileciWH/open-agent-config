<p align="center">
  <img src="public/icons/open-agent-config-icons.png" alt="Open Agent Config" width="160" />
</p>

<h1 align="center">Open Agent Config</h1>

<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <strong>One home for every agent.</strong><br/>
  A free, open-source app to manage all your AI coding agents — desktop, CLI, or web.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square" alt="License" /></a>
  <a href="#getting-started"><img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey?style=flat-square" alt="Platform" /></a>
</p>

<p align="center">
  <a href="#why-open-agent-config">Why</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="#key-features">Features</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="#getting-started">Get Started</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="#roadmap">Roadmap</a>
</p>

<br/>

<p align="center">
  <img src="media/agents-animation.gif" alt="Open Agent Config Agents Animation" width="800" />
</p>

<p align="center">
  <small><i>Every supported agent shows on the Overview by default, installed or not. In Settings → Agent Paths, switch to "Detected only" to hide and disable undetected agents, or flip a single agent's "Enabled" toggle off.</i></small>
</p>

<br/>

## Why Open Agent Config?

Every agent, a different world. Extensions, configs, memory, and rules — scattered across different directories, in different formats, with different conventions.

**Open Agent Config brings them all under one roof** — see, secure, and manage everything across every agent, from one place.

<p align="center">
  <img src="media/overview.png" alt="Open Agent Config Overview" width="800" />
</p>

---

## Key Features

### 🧩 Full Suite Extension Management

Open Agent Config manages **all five extension types** from a unified interface — **Skills**, **MCP Servers**, **Plugins**, **Hooks**, and **Agent-first CLIs**.

<div align="center">

| Agent | Skills | MCP | Plugins | Hooks | Agent-first CLIs |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Claude Code** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Codex** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Gemini CLI** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Cursor** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Antigravity** | ✓ | ✓ | — | — | ✓ |
| **Copilot** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Devin Desktop** | ✓ | ✓ | — | ✓ | ✓ |
| **OpenCode** | ✓ | ✓ | ✓ | — | ✓ |
| **Hermes** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Kiro** | ✓ | ✓ | — | ✓ | ✓ |
| **Kimi Code** | ✓ | ✓ | — | — | ✓ |
| **Oh My Pi** | ✓ | ✓ | ✓ | — | ✓ |
| **DeepSeek Harness** | ✓ | ✓ | — | — | ✓ |

<small><i>* "—" indicates the agent currently does not support this extension type. Devin Desktop support keeps legacy Windsurf paths compatible.</i></small>

</div>

- **Smart organization** — Filter by *type*, *agent*, or *source*, and search by name. Extensions from the same repo are automatically grouped into *packs* for batch management.
- **Full visibility** — Every extension shows its *agents*, *permissions*, *trust score*, and *status* at a glance. Open the detail panel for per-agent *file paths*, *directory structure*, and *audit findings*.
- **Effortless management** — Enable or disable right from the list. Check for updates across all extensions with one click.
- **Cross-agent deployment** — See which agents have the extension and which don't — deploy to any missing agent with one click. Open Agent Config handles the format differences between agents (JSON, TOML, hook conventions, MCP schemas) automatically.

<p align="center">
  <video src="https://github.com/user-attachments/assets/897611c4-4ca3-426f-91ba-fcda301e9cfe" width="800" autoplay loop muted playsinline></video>
  <video src="https://github.com/user-attachments/assets/a2a74fd1-f3f2-4525-9d64-ba00378d6eef" width="800" autoplay loop muted playsinline></video>
</p>

---

### 🤖 Agent Configs, Memory & Rules

Open Agent Config manages every agent's **Configs**, **Memory**, **Rules**, **Subagents**, and **Ignore** files from one place. Currently supporting **13 agents**: **Claude Code**, **Codex**, **Gemini CLI**, **Cursor**, **Antigravity**, **Copilot**, **Devin Desktop**, **OpenCode**, **Hermes**, **Kiro**, **Kimi Code**, **Oh My Pi**, and **DeepSeek Harness**.

- **Config file tracking** — Automatically discovers every agent's config files — both global and per-project. Add your project directories or custom paths and Open Agent Config picks them up alongside the global ones.
- **Per-agent dashboard** — Each agent gets its own page with all files organized by category, showing scope, path, file size, and a summary of installed extensions. Expand any file to preview its content right in the app.
- **Custom paths** — Add any file or folder to an agent's dashboard for tracking. Useful for custom configs or scripts that Open Agent Config doesn't auto-discover — they show up alongside everything else with the same live preview.
- **Real-time detection** — The moment a config file is modified, the dashboard reflects it.

<p align="center">
  <video src="https://github.com/user-attachments/assets/9b38494a-2ab3-4071-a450-02a30b859323" width="800" autoplay loop muted playsinline></video>
</p>

---

### 🛡️ Security Audit & Permission Transparency

Every extension is scanned by a built-in security engine with 18 static analysis rules and receives a **Trust Score** (0–100), grouped into three tiers — **Safe** (80+), **Low Risk** (60–79), and **Needs Review** (below 60). A dedicated Audit page lets you search, filter by tier, and drill into every finding.

- **One-click audit** — Run a full security scan across all extensions with a single click. The dashboard shows how many extensions were scanned and when the last audit ran.
- **Precise tracing** — Every finding pinpoints the exact file and line number, so you can trace the issue immediately.
- **Per-agent scanning** — Even if multiple agents share the same extension, each agent's copy is audited independently — because versions can drift, and a safe copy on one agent doesn't guarantee safety on another.
- **Permission transparency** — Every extension's permissions are surfaced across five dimensions — filesystem paths, network domains, shell commands, database engines, and environment variables. You see exactly what each extension can reach before you decide to keep it.

<p align="center">
  <video src="https://github.com/user-attachments/assets/5650c759-f30f-42df-83b2-cf0bafd3fb95" width="800" autoplay loop muted playsinline></video>
</p>

---

### 🏪 Marketplace Ecosystem

Discover, evaluate, and install — three marketplaces in one, each with trending lists and search:

- **Skills** — Browse and install from the [skills.sh](https://skills.sh) registry. Also supports install from **Git URL** or **local directory**.
- **MCP Servers** — Browse the [Smithery](https://smithery.ai) registry of Model Context Protocol servers.
- **Agent-first CLI** — Discover CLI tools built specifically for agents — the newest frontier of the agent extension ecosystem.

Every listing shows its description, install count, and source. For skills, you can preview the documentation, check third-party security audit scores before installing, and install to any agent with one click — Open Agent Config tracks the source so you always know where each extension came from.

<p align="center">
  <video src="https://github.com/user-attachments/assets/a80e2c95-52fe-4cd5-aab1-bd01b4c224cf" width="800" autoplay loop muted playsinline></video>
</p>

---

### 🔀 Project-Level Management

The sidebar scope picker switches between **Global**, **All scopes**, or any registered project. Agents, Extensions, and Audit all filter by the active scope — per-project setups are managed independently of your global config.

<p align="center">
  <video src="https://github.com/user-attachments/assets/321fc4b6-4f6b-4f6e-a9eb-1b0084334cb2" width="800" autoplay loop muted playsinline></video>
  <video src="https://github.com/user-attachments/assets/6392967a-e8a3-4805-9dc3-c4cf16f5c07f" width="800" autoplay loop muted playsinline></video>
</p>

---

### 📦 Kits

Pack a curated set of **skills**, **MCP servers**, **rules** and **memory** files into a portable **Kit** — then deploy the whole bundle to any project with one click. Skip the setup churn every time you spin up a new project.

- **Compose once, reuse everywhere** — Build a Kit from your existing extensions, rules, and memory files. Pick a target agent at install time and Open Agent Config writes everything to the right places.
- **Multi-project ready** — Install the same Kit to as many projects as you need. The detail drawer shows where each one is currently deployed, and removing it from a project cleans up cleanly.
- **Portable bundles** — Export any Kit as a self-contained `.oac-kit.zip` to share with teammates or carry across machines. Import is one click.
- **Origin tracking** — Kit-installed extensions merge with their marketplace origin in the Extensions list, so you always know where each extension came from.

<p align="center">
  <video src="https://github.com/user-attachments/assets/e9621e72-f47d-4ea6-99b3-fbd296692048" width="800" autoplay loop muted playsinline></video>
  <video src="https://github.com/user-attachments/assets/ec88b596-7999-436f-943e-1dce169cd6f0" width="800" autoplay loop muted playsinline></video>
  <video src="https://github.com/user-attachments/assets/c84b6513-484d-4b5d-b083-73de0b3e800e" width="800" autoplay loop muted playsinline></video>
</p>

---

### 📂 In-Place Management

Open Agent Config works directly with your agents' native directories instead of copying them into a managed folder — no shadow copies, no sync conflicts.

- **Native directories** — Reads and writes directly to each agent's own config directory. Your files stay exactly where they are.
- **Non-destructive operations** — Enabling or disabling an extension is a simple file rename in place. Nothing is moved or duplicated.
- **Zero lock-in** — Uninstall Open Agent Config and everything is exactly where it was. No migration, no cleanup needed.

---

### ⌨️ CLI Support

Open Agent Config ships a standalone command-line interface (`oac`) for terminal-first workflows, available on **macOS**, **Linux**, and **Windows**:

```shell
$ oac status
  Agents        13 detected (claude · codex · gemini · cursor · antigravity · copilot · windsurf · opencode · hermes · kiro · kimi · omp · dsh)
  Extensions    136 total (124 skills · 2 mcp · 8 plugins · 1 hooks · 1 clis)

$ oac list --kind skill --agent claude    # filter by type and agent
$ oac audit                               # security audit with trust scores
$ oac enable my-skill                     # enable by name
$ oac disable --pack owner/repo           # batch disable by source
```

---

### 🌐 Web Mode

The same full-featured UI that runs in the desktop app is also available as a **web interface** — served directly from the `oac` CLI binary. No extra dependencies, no separate install.

```shell
$ oac serve
Open Agent Config Web UI [my-host] running at http://127.0.0.1:7070/?token=a1b2c3…
```

This makes Open Agent Config usable on **Linux servers**, **HPC clusters**, or any **headless machine** where a desktop app isn't an option. Web mode has **full feature parity** with the desktop app — the only difference is that file-system operations (like "Open in Finder") are desktop-only. See [Getting Started](#getting-started) for setup instructions.

---

### ✨ Thoughtful & Interactive UX

- 💡 **Tip of the Day** — The Overview dashboard surfaces bundled OAC tips without depending on a legacy remote feed.
- 📊 **Dynamic Activity Feed** — Agent Activity and Recently Installed timelines capture every config change, extension install, and agent event in real time.
- ⚡ **Quick Actions** — One-click View Agents, Run Audit, Check Updates, and Marketplace access right from the dashboard.
- 🎯 **Playful Touches** — Smooth animations and micro-interactions throughout the app make daily use feel alive.
- 🎨 **Themes** — Multiple themes with Light, Dark, and System mode support.

<p align="center">
  <img src="media/theme-tiesen.png" alt="Tiesen Theme" width="40%" />
  <img src="media/theme-claude.png" alt="Claude Theme" width="40%" />
</p>

---

## Getting Started

**Requirements:** At least one supported AI coding agent installed.

> **Release status:** OAC's binary installers and in-app updater are intentionally disabled until this repository owns verified release artifacts, checksums, and signing keys. Build from source for now.

### 🖥️ Desktop App (macOS)

1. Download the DMG for your architecture from the [latest release](https://github.com/SimileciWH/open-agent-config/releases/latest):

   | Chip | File |
   |------|------|
   | Apple Silicon (M1/M2/M3/M4) | `Open Agent Config_x.x.x_aarch64.dmg` |
   | Intel | `Open Agent Config_x.x.x_x64.dmg` |

2. Open the DMG and drag **Open Agent Config** to the Applications folder.
3. Launch Open Agent Config. It will automatically detect your installed agents and scan their extensions.

The in-app updater remains disabled until the OAC release channel is signed and verified.

### 🌐 Web Mode (macOS / Linux / Windows)

#### Local machine

1. Build Open Agent Config from source:

   ```bash
   git clone https://github.com/SimileciWH/open-agent-config.git
   cd open-agent-config
   npm ci
   npm run build
   cargo build --release -p oac-cli
   ```

2. Start the web interface:

   ```bash
   ./target/release/oac serve
   ```

   Then open the `http://localhost:7070/?token=…` URL that `oac serve` prints. Auth is on by default; the token is saved, so next time `http://localhost:7070` just works. On a trusted single-user machine, `oac serve --no-token` skips the token entirely.

#### Remote server

1. Build Open Agent Config on the server:

   ```bash
   ssh user@your-server
   git clone https://github.com/SimileciWH/open-agent-config.git
   cd open-agent-config
   npm ci
   npm run build
   cargo build --release -p oac-cli
   exit
   ```

2. Start the web interface:

   ```bash
   ssh -L 7070:localhost:7070 user@your-server
   ~/open-agent-config/target/release/oac serve
   ```

   Then open the `http://localhost:7070/?token=…` URL that `oac serve` prints, in your local browser. Auth is on by default; the token is saved, so next time `http://localhost:7070` just works. Keep the SSH session running while you use Open Agent Config.

> <sub>**Tip:** Managing several remote nodes? Start each with `oac serve --name <label>` (e.g. `--name my-macbook`). The label shows in the sidebar and the browser tab title, so multiple tabs are easy to tell apart. Defaults to the machine hostname.</sub>

<details>
<summary><strong>Future release asset names</strong> — available after the OAC release gate is enabled</summary>

<br/>

Download the binary for your platform from the [latest release](https://github.com/SimileciWH/open-agent-config/releases/latest) (referred to as `<file>` below):

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `oac-macos-arm64` |
| macOS (Intel) | `oac-macos-x64` |
| Linux (x64) | `oac-linux-x64` |
| Linux (ARM64) | `oac-linux-arm64` |
| Windows | `oac-windows-x64.exe` |

**Local machine:**

1. Install Open Agent Config:

   ```bash
   # macOS / Linux
   chmod +x <file>
   mkdir -p ~/.local/bin
   mv <file> ~/.local/bin/oac
   ```

   ```powershell
   # Windows (PowerShell)
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\bin" | Out-Null
   Move-Item <file> "$env:USERPROFILE\.local\bin\oac.exe"
   ```

2. Start the web interface:

   ```bash
   oac serve
   ```

   Then open the `http://localhost:7070/?token=…` URL that `oac serve` prints. Auth is on by default; the token is saved, so next time `http://localhost:7070` just works. On a trusted single-user machine, `oac serve --no-token` skips the token entirely.

**Remote server:**

1. Upload and install the binary on the server:

   ```bash
   scp <file> user@your-server:~/
   ssh user@your-server
   chmod +x ~/<file>
   mkdir -p ~/.local/bin
   mv ~/<file> ~/.local/bin/oac
   exit
   ```

2. Start the web interface:

   ```bash
   ssh -L 7070:localhost:7070 user@your-server
   oac serve
   ```

   Then open the `http://localhost:7070/?token=…` URL that `oac serve` prints, in your local browser. Auth is on by default; the token is saved, so next time `http://localhost:7070` just works. Keep the SSH session running while you use Open Agent Config.

</details>

#### Updating

Pull the source, rebuild the frontend and `oac-cli`, then restart `oac serve`. Do not use `install.sh` or `install.ps1` until the release gate is enabled.

### ⌨️ CLI (macOS / Linux / Windows)

If you've already installed Open Agent Config via the [Web Mode](#-web-mode-macos--linux--windows) steps above, the CLI is ready to use — it's the same `oac` binary.

See [CLI Support](#%EF%B8%8F-cli-support) above for the full list of commands.

---

## Roadmap

- 🤖 **More Agents** — OpenClaw and more
- ⌨️ **CLI Enhancements** — More commands and richer functionality for `oac`

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, project structure, and PR guidelines.

---

## License

This project is licensed under [Apache-2.0](LICENSE).

Artwork (`public/icons/` and `src/components/shared/agent-mascot/`) is **All Rights Reserved** and is not covered by the Apache-2.0 license.

All product names, logos, and trademarks are property of their respective owners. Open Agent Config is an independent project, not affiliated with or endorsed by any agent vendor.
