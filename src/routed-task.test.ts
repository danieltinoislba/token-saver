import assert from "node:assert/strict";
import test from "node:test";
import { runRoutedTask, type RoutedTaskTransport } from "./routed-task.js";

test("runRoutedTask inicia App Server, roteia e aguarda a conclusão", async () => {
  const calls: string[] = [];
  let started = false;
  let closed = false;
  const transport: RoutedTaskTransport = {
    async start() { started = true; },
    async close() { closed = true; },
    async request<T>(method: string, _params: Record<string, unknown>): Promise<T> {
      calls.push(method);
      if (method === "model/list") return { data: [{ id: "gpt-economy" }] } as T;
      if (method === "thread/start") return { thread: { id: "thread-1" } } as T;
      return { turn: { id: "turn-1" } } as T;
    },
    async waitForNotification<T extends Record<string, unknown>>(): Promise<T> {
      return { turn: { id: "turn-1", status: "completed" } } as unknown as T;
    },
  };
  const result = await runRoutedTask({ request: "Como rodar este projeto?" }, { createTransport: () => transport });
  assert.equal(started, true);
  assert.equal(closed, true);
  assert.deepEqual(calls, ["model/list", "thread/start", "turn/start"]);
  assert.equal(result.modelId, "gpt-economy");
  assert.equal(result.completedTurn.status, "completed");
});
