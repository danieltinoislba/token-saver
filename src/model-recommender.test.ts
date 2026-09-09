import assert from "node:assert/strict";
import test from "node:test";
import { recommendModel, type ModelCandidate } from "./model-recommender.js";

const models: ModelCandidate[] = [
  { id: "small", tier: "economy", capabilities: ["code", "tools"], inputCostPerMillion: 1, outputCostPerMillion: 4 },
  { id: "medium", tier: "balanced", capabilities: ["code", "tools"], inputCostPerMillion: 3, outputCostPerMillion: 12 },
  { id: "large", tier: "powerful", capabilities: ["code", "tools", "long_context"], inputCostPerMillion: 10, outputCostPerMillion: 50 },
];

test("recomenda modelo econômico para tarefa simples", () => {
  const result = recommendModel({ request: "Como rodar este projeto?", models });
  assert.equal(result.recommendedModel?.id, "small");
  assert.equal(result.targetTier, "economy");
});

test("sinaliza modelo poderoso demais", () => {
  const result = recommendModel({ request: "Erro reproduzível no login", models, selectedModelId: "large", policy: "guarded", repository: { reproducible: true } });
  assert.equal(result.selectionAssessment, "overpowered");
  assert.equal(result.shouldSwitch, true);
  assert.equal(result.switchMode, "confirmation");
  assert.equal(result.recommendedModel?.id, "small");
});

test("auto é a política padrão e não pede confirmação", () => {
  const result = recommendModel({ request: "Erro reproduzível no login", models, selectedModelId: "large", repository: { reproducible: true } });
  assert.equal(result.effectivePolicy, "auto");
  assert.equal(result.switchMode, "automatic");
  assert.equal(result.requiresConfirmation, false);
});

test("manual preserva recomendação sem troca", () => {
  const result = recommendModel({ request: "Erro reproduzível no login", models, selectedModelId: "large", policy: "manual", repository: { reproducible: true } });
  assert.equal(result.switchMode, "recommendation");
  assert.equal(result.requiresConfirmation, false);
});

test("usa modelo poderoso em arquitetura", () => {
  const result = recommendModel({ request: "Arquitetar migração do monolito", models });
  assert.equal(result.recommendedModel?.id, "large");
  assert.equal(result.reasoningEffort, "high");
});

test("filtra capacidades obrigatórias", () => {
  const result = recommendModel({ request: "Adicione uma feature", models, requiredCapabilities: ["long_context"] });
  assert.equal(result.recommendedModel?.id, "large");
});

test("retorna ausência em vez de inventar modelo", () => {
  const result = recommendModel({ request: "Adicione uma feature", models, requiredCapabilities: ["vision"] });
  assert.equal(result.recommendedModel, null);
  assert.match(result.reasons.at(-1) ?? "", /nenhum modelo/);
});

test("desempata pelo menor custo declarado", () => {
  const result = recommendModel({
    request: "Como rodar o projeto?",
    models: [
      { id: "small-expensive", tier: "economy", inputCostPerMillion: 2, outputCostPerMillion: 8 },
      { id: "small-cheap", tier: "economy", inputCostPerMillion: 1, outputCostPerMillion: 3 },
    ],
  });
  assert.equal(result.recommendedModel?.id, "small-cheap");
});
