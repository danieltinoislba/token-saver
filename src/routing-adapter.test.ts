import assert from "node:assert/strict";
import test from "node:test";
import { routeBeforeExecution } from "./routing-adapter.js";

const models = [
  { id: "cheap", tier: "economy" as const },
  { id: "strong", tier: "powerful" as const },
];

test("auto troca quando o adaptador fornece callback", async () => {
  let switchedTo = "";
  const result = await routeBeforeExecution({
    request: "Erro reproduzível no login",
    repository: { reproducible: true },
    models,
    selectedModelId: "strong",
    switchModel: async (model) => { switchedTo = model.id; },
  });
  assert.equal(result.action, "switched");
  assert.equal(result.switched, true);
  assert.equal(switchedTo, "cheap");
});

test("guarded não troca sem confirmação", async () => {
  const result = await routeBeforeExecution({
    request: "Erro reproduzível no login",
    repository: { reproducible: true },
    models,
    selectedModelId: "strong",
    policy: "guarded",
    switchModel: async () => { throw new Error("não deveria chamar"); },
  });
  assert.equal(result.action, "confirmation_required");
  assert.equal(result.switched, false);
});

test("manual apenas recomenda", async () => {
  const result = await routeBeforeExecution({
    request: "Erro reproduzível no login",
    repository: { reproducible: true },
    models,
    selectedModelId: "strong",
    policy: "manual",
  });
  assert.equal(result.action, "recommendation_only");
});
