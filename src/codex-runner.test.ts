import assert from "node:assert/strict";
import test from "node:test";
import { CodexRunner, type JsonRpcTransport } from "./codex-runner.js";

test("runner consulta modelos e inicia thread/turn com modelo econômico", async () => {
  const calls: string[] = [];
  const transport: JsonRpcTransport = {
    async request<T>(method: string, params: Record<string, unknown>): Promise<T> {
      calls.push(`${method}:${JSON.stringify(params)}`);
      if (method === "model/list") return { data: [{ id: "gpt-economy" }, { id: "gpt-powerful" }] } as T;
      if (method === "thread/start") return { thread: { id: "thread-1" } } as T;
      return { turn: { id: "turn-1", status: "inProgress" } } as T;
    },
  };
  const runner = new CodexRunner({
    transport,
    tierForModel: (model) => model.id === "gpt-economy" ? "economy" : "powerful",
    provider: "openai",
  });
  const result = await runner.run({ request: "Como rodar este projeto?" });
  assert.equal(result.modelId, "gpt-economy");
  assert.equal(result.thread.id, "thread-1");
  assert.equal(result.turn.id, "turn-1");
  assert.equal(calls[0]?.startsWith("model/list:"), true);
  assert.equal(calls[1]?.startsWith("thread/start:"), true);
  assert.equal(calls[2]?.startsWith("turn/start:"), true);
});

test("runner não inicia sessão em modo manual sem confirmação", async () => {
  let calls = 0;
  const transport: JsonRpcTransport = {
    async request<T>(method: string, _params: Record<string, unknown>): Promise<T> {
      calls += 1;
      if (method === "model/list") return { data: [{ id: "gpt-economy" }, { id: "gpt-powerful" }] } as T;
      return { id: "unexpected" } as T;
    },
  };
  const runner = new CodexRunner({ transport, tierForModel: (model) => model.id === "gpt-economy" ? "economy" : "powerful" });
  await assert.rejects(() => runner.run({ request: "Erro reproduzível", selectedModelId: "gpt-powerful", policy: "manual", repository: { reproducible: true } }));
  assert.equal(calls, 1);
});

test("runner envia somente o contexto selecionado dentro do orçamento", async () => {
  let turnParams: Record<string, unknown> | undefined;
  const transport: JsonRpcTransport = {
    async request<T>(method: string, params: Record<string, unknown>): Promise<T> {
      if (method === "model/list") return { data: [{ id: "gpt-economy" }] } as T;
      if (method === "thread/start") return { thread: { id: "thread-1" } } as T;
      turnParams = params;
      return { turn: { id: "turn-1" } } as T;
    },
  };
  const runner = new CodexRunner({ transport, tierForModel: () => "economy" });
  const result = await runner.run({
    request: "Corrigir login",
    contextBudgetTokens: 20,
    contextCandidates: [
      { id: "login", path: "src/login.ts", kind: "file", summary: "login", content: "const login = true;", relevance: 1, estimatedTokens: 10 },
      { id: "large", path: "src/all.ts", kind: "file", summary: "não incluir", content: "x".repeat(100), relevance: 0.9, estimatedTokens: 100 },
    ],
  });
  const text = (turnParams?.input as Array<{ text: string }>)[0]?.text;
  assert.match(text, /src\/login\.ts/);
  assert.doesNotMatch(text, /src\/all\.ts/);
  assert.equal(result.contextPlan?.estimatedTokensSaved, 100);
});
