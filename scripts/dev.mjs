import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const BACKEND_HOST = "127.0.0.1";
const DEFAULT_BACKEND_PORT = 7070;
const DEFAULT_FRONTEND_PORT = 1420;
const BACKEND_START_TIMEOUT_MS = 10 * 60 * 1000;
const children = new Map();

let stopping = false;
let finalExitCode = 0;

function readPort(name, fallback) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === "") {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535`);
  }
  return value;
}

function cargoCommand(args) {
  return {
    command: process.platform === "win32" ? "cargo.exe" : "cargo",
    args,
  };
}

function npmCommand(args) {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, ...args],
    };
  }

  if (process.platform === "win32") {
    return {
      command: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", ["npm", ...args].join(" ")],
    };
  }

  return { command: "npm", args };
}

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (open) => {
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(300);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function isBackendReady(port) {
  try {
    const response = await fetch(`http://${BACKEND_HOST}:${port}/api/server_info`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(500),
    });
    if (!response.ok) {
      return false;
    }
    const payload = await response.json();
    return typeof payload.node_name === "string";
  } catch {
    return false;
  }
}

function stopAll(code = 0) {
  if (stopping) {
    return;
  }

  stopping = true;
  finalExitCode = code;

  for (const child of children.values()) {
    if (child.exitCode === null && child.signalCode === null) {
      terminateChild(child, false);
    }
  }

  if (children.size === 0) {
    process.exit(finalExitCode);
  }

  const forceExit = setTimeout(() => {
    for (const child of children.values()) {
      if (child.exitCode === null && child.signalCode === null) {
        terminateChild(child, true);
      }
    }
    process.exit(finalExitCode);
  }, 5000);
  forceExit.unref();
}

function terminateChild(child, force) {
  if (process.platform === "win32" && child.pid) {
    const taskkill = spawn(
      "taskkill.exe",
      ["/pid", String(child.pid), "/t", ...(force ? ["/f"] : [])],
      { stdio: "ignore", windowsHide: true },
    );
    taskkill.unref();
    return;
  }

  child.kill(force ? "SIGKILL" : "SIGTERM");
}

function spawnChild(label, command, args, env = process.env) {
  console.log(`[dev] Starting ${label}: ${command} ${args.join(" ")}`);
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });
  children.set(label, child);

  child.once("error", (error) => {
    console.error(`[dev] Failed to start ${label}: ${error.message}`);
    stopAll(1);
  });

  child.once("exit", (code, signal) => {
    children.delete(label);
    if (!stopping) {
      const expectedSignal = signal === "SIGINT" || signal === "SIGTERM";
      const resolvedCode = expectedSignal ? 0 : (code ?? 1);
      console.error(
        `[dev] ${label} stopped${signal ? ` (${signal})` : ` with exit code ${resolvedCode}`}`,
      );
      stopAll(resolvedCode);
      return;
    }

    if (children.size === 0) {
      process.exit(finalExitCode);
    }
  });

  return child;
}

async function waitForBackend(port, backendProcess) {
  const deadline = Date.now() + BACKEND_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isBackendReady(port)) {
      return;
    }
    if (backendProcess.exitCode !== null || backendProcess.signalCode !== null) {
      throw new Error("OAC backend exited before becoming ready");
    }
    await delay(300);
  }
  throw new Error(`OAC backend did not become ready on port ${port} within 10 minutes`);
}

export async function startDevelopmentEnvironment() {
  const backendPort = readPort("OAC_BACKEND_PORT", DEFAULT_BACKEND_PORT);
  const frontendPort = readPort("OAC_FRONTEND_PORT", DEFAULT_FRONTEND_PORT);
  const sharedEnv = {
    ...process.env,
    OAC_BACKEND_PORT: String(backendPort),
    OAC_FRONTEND_PORT: String(frontendPort),
  };

  process.once("SIGINT", () => stopAll(0));
  process.once("SIGTERM", () => stopAll(0));

  const frontendPortInUse =
    (await isPortOpen("127.0.0.1", frontendPort)) ||
    (await isPortOpen("::1", frontendPort));
  if (frontendPortInUse) {
    throw new Error(
      `Frontend port ${frontendPort} is already in use. Stop the existing dev server or set OAC_FRONTEND_PORT`,
    );
  }

  let backendProcess = null;
  if (await isBackendReady(backendPort)) {
    console.log(`[dev] Reusing OAC backend at http://${BACKEND_HOST}:${backendPort}`);
  } else {
    if (await isPortOpen(BACKEND_HOST, backendPort)) {
      throw new Error(
        `Port ${backendPort} is already in use, but it is not an unauthenticated OAC backend`,
      );
    }

    const cargo = cargoCommand([
      "run",
      "-p",
      "oac-cli",
      "--",
      "serve",
      "--no-token",
      "--host",
      BACKEND_HOST,
      "--port",
      String(backendPort),
    ]);
    backendProcess = spawnChild("OAC backend", cargo.command, cargo.args, sharedEnv);
    console.log(`[dev] Waiting for the OAC backend on port ${backendPort}...`);
    await waitForBackend(backendPort, backendProcess);
    console.log(`[dev] OAC backend is ready at http://${BACKEND_HOST}:${backendPort}`);
  }

  const npm = npmCommand(["run", "dev:frontend"]);
  spawnChild("Vite frontend", npm.command, npm.args, sharedEnv);
  console.log(`[dev] Frontend will be available at http://localhost:${frontendPort}`);
}

startDevelopmentEnvironment().catch((error) => {
  console.error(`[dev] ${error.message}`);
  stopAll(1);
});
