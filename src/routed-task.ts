import type { ContextCandidate } from "./context-planner.js";
import type { RepositorySignals } from "./classifier.js";
import { CodexRunner, type AppServerModel, type AppServerTurn, type JsonRpcTransport, type RunCodexTaskResult } from "./codex-runner.js";
import { JsonRpcStdioTransport } from "./jsonrpc-stdio.js";

export interface RoutedTaskTransport extends JsonRpcTransport {
  start(): Promise<void>;
  close(): Promise<void>;
  waitForNotification<T extends Record<string, unknown>>(method: string, timeoutMs?: number): Promise<T>;
}

export interface RunRoutedTaskInput {
  request: string;
  repository?: RepositorySignals;
  contextCandidates?: ContextCandidate[];
  contextBudgetTokens?: number;
  cwd?: string;
  timeoutMs?: number;
}

export interface RoutedTaskResult extends RunCodexTaskResult {
  completedTurn: AppServerTurn;
}

export interface RoutedTaskOptions {
  createTransport?: (cwd?: string) => RoutedTaskTransport;
}

export function tierForCodexModel(model: AppServerModel) {
  const id = model.id.toLowerCase();
  if (/luna|mini|nano|economy/.test(id)) return "economy" as const;
  if (/astra|sol|pro|powerful/.test(id)) return "powerful" as const;
  return "balanced" as const;
}

/** Executa uma tarefa em uma nova thread do App Server com modelo roteado automaticamente. */
export async function runRoutedTask(input: RunRoutedTaskInput, options: RoutedTaskOptions = {}): Promise<RoutedTaskResult> {
  const transport = options.createTransport?.(input.cwd) ?? new JsonRpcStdioTransport({ cwd: input.cwd });
  try {
    await transport.start();
    const runner = new CodexRunner({ transport, tierForModel: tierForCodexModel, provider: "openai" });
    const result = await runner.run({
      request: input.request,
      repository: input.repository,
      contextCandidates: input.contextCandidates,
      contextBudgetTokens: input.contextBudgetTokens,
      cwd: input.cwd,
      policy: "auto",
    });
    const completed = await transport.waitForNotification<{ turn?: AppServerTurn }>("turn/completed", input.timeoutMs);
    return { ...result, completedTurn: completed.turn ?? result.turn };
  } finally {
    await transport.close();
  }
}
