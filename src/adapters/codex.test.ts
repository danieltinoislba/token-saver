import assert from "node:assert/strict";
import test from "node:test";
import { routeCodexTask, type CodexSessionController } from "./codex.js";

test("adaptador Codex troca automaticamente o modelo", async () => {
  let current = "powerful";
  const switched: string[] = [];
  const controller: CodexSessionController = {
    async listModels() {
      return [
        { id: "economy", tier: "economy" },
        { id: "powerful", tier: "powerful" },
      ];
    },
    async getSelectedModelId() { return current; },
    async switchModel(modelId) { current = modelId; switched.push(modelId); },
  };

  const result = await routeCodexTask({
    request: "Erro reproduzível no login",
    repository: { reproducible: true },
    controller,
  });
  assert.equal(result.action, "switched");
  assert.deepEqual(switched, ["economy"]);
  assert.equal(current, "economy");
});

test("adaptador respeita guarded", async () => {
  let calls = 0;
  const controller: CodexSessionController = {
    async listModels() { return [{ id: "economy", tier: "economy" }, { id: "powerful", tier: "powerful" }]; },
    async getSelectedModelId() { return "powerful"; },
    async switchModel() { calls += 1; },
  };
  const result = await routeCodexTask({ request: "Erro reproduzível", repository: { reproducible: true }, controller, policy: "guarded" });
  assert.equal(result.action, "confirmation_required");
  assert.equal(calls, 0);
});
