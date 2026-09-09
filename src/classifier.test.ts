import assert from "node:assert/strict";
import test from "node:test";
import { classifyTask } from "./classifier.js";

test("classifica arquitetura explícita", () => {
  const result = classifyTask({ request: "Precisamos arquitetar a migração do monolito para microserviços" });
  assert.equal(result.mode, "architecture");
  assert.equal(result.strategy.runArchitectureAnalysis, true);
});

test("classifica bug simples localizado", () => {
  const result = classifyTask({ request: "Erro reproduzível no componente de login, retorna 500", repository: { changedFiles: ["src/login.ts"], reproducible: true } });
  assert.equal(result.mode, "bug_simple");
  assert.ok(result.confidence >= 0.8);
});

test("classifica bug complexo e intermitente", () => {
  const result = classifyTask({ request: "Timeout intermitente e não consigo reproduzir entre vários serviços", repository: { services: ["api", "worker"], reproducible: false } });
  assert.equal(result.mode, "bug_complex");
  assert.equal(result.strategy.suggestedReasoning, "high");
});

test("classifica implementação comum", () => {
  assert.equal(classifyTask({ request: "Adicione um endpoint para consultar o perfil" }).mode, "implementation");
});

test("não força classificação sem evidência", () => {
  const result = classifyTask({ request: "Pode olhar isso para mim?" });
  assert.equal(result.mode, "unknown");
  assert.ok(result.confidence < 0.5);
});

test("normaliza português com acentos", () => {
  assert.equal(classifyTask({ request: "Falha de concorrência com vazamento de memória" }).mode, "bug_complex");
});

test("não confunde implementação distribuída com bug sem evidência de falha", () => {
  const result = classifyTask({
    request: "Implementar o context planner para vários serviços",
    repository: { reproducible: false, services: ["mcp-core", "adapter"] },
  });
  assert.equal(result.mode, "implementation");
});
