import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface, type Interface } from "node:readline";
import { EventEmitter } from "node:events";
import type { JsonRpcTransport } from "./codex-runner.js";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

export interface JsonRpcStdioOptions {
  command?: string;
  args?: string[];
  cwd?: string;
}

/** JSON-RPC por linhas para o Codex App Server em modo stdio. */
export class JsonRpcStdioTransport extends EventEmitter implements JsonRpcTransport {
  private process?: ChildProcessWithoutNullStreams;
  private lines?: Interface;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();

  async start(): Promise<void> {
    if (this.process) throw new Error("Transporte JSON-RPC já iniciado");
    const command = this.options.command ?? "codex";
    const args = this.options.args ?? ["app-server"];
    this.process = spawn(command, args, { cwd: this.options.cwd, stdio: ["pipe", "pipe", "pipe"] });
    this.process.stderr.on("data", (chunk) => this.emit("stderr", chunk.toString()));
    this.process.on("error", (error) => this.rejectAll(error));
    this.process.on("exit", (code) => {
      if (code !== 0) this.rejectAll(new Error(`Codex App Server terminou com código ${code}`));
      this.process = undefined;
    });
    this.lines = createInterface({ input: this.process.stdout });
    this.lines.on("line", (line) => this.handleLine(line));
    await this.request("initialize", {
      clientInfo: { name: "token-saver", title: "Token Saver", version: "0.1.0" },
      capabilities: {},
    });
    this.notify("initialized", {});
  }

  async request<T>(method: string, params: Record<string, unknown>): Promise<T> {
    if (!this.process) throw new Error("Transporte JSON-RPC não iniciado");
    const id = this.nextId++;
    const promise = new Promise<T>((resolve, reject) => this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject }));
    this.process.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    return promise;
  }

  notify(method: string, params: Record<string, unknown>): void {
    if (!this.process) throw new Error("Transporte JSON-RPC não iniciado");
    this.process.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
  }

  waitForNotification<T extends Record<string, unknown>>(method: string, timeoutMs = 120_000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener("notification", onNotification);
        reject(new Error(`Timeout aguardando notificação ${method}`));
      }, timeoutMs);
      const onNotification = (message: { method?: string; params?: T }) => {
        if (message.method !== method) return;
        clearTimeout(timer);
        this.removeListener("notification", onNotification);
        resolve(message.params ?? ({} as T));
      };
      this.on("notification", onNotification);
    });
  }

  async close(): Promise<void> {
    this.lines?.close();
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
    this.rejectAll(new Error("Transporte fechado"));
  }

  private handleLine(line: string): void {
    if (!line.trim()) return;
    let message: { id?: number; result?: unknown; error?: { message?: string }; method?: string; params?: Record<string, unknown> };
    try { message = JSON.parse(line); } catch { this.emit("stderr", `Resposta JSON inválida: ${line}`); return; }
    if (message.id !== undefined) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message ?? "Erro JSON-RPC"));
      else pending.resolve(message.result);
      return;
    }
    this.emit("notification", message);
  }

  private rejectAll(error: Error): void {
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }

  constructor(private readonly options: JsonRpcStdioOptions = {}) { super(); }
}
