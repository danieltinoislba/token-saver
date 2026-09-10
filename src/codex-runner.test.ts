import assert from "node:assert/strict";
import test from "node:test";
import { CodexRunner, type JsonRpcTransport } from "./codex-runner.js";

test("runner consulta modelos e inicia thread/turn com modelo econômico", async () => {
  const calls: string[] = [];
  const transport: JsonRpcTransport = {
    async request<T>(method: string, params: Record<string, unknown>): Promise<T> {
      calls.push(`${method}:${JSON.stringify(params)}`);
      if (method === "model/list") return { data: [{ id: "gpt-economy" }, { id: "gpt-powerful" }] } as T;
      if (method === "thread/start") return { id: "thread-1" } as T;
      return { id: "turn-1", status: "inProgress" } as T;
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
