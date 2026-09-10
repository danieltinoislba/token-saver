import assert from "node:assert/strict";
import test from "node:test";
import { planContext, type ContextCandidate } from "./context-planner.js";

const candidates: ContextCandidate[] = [
  { id: "a", path: "src/auth.ts", kind: "snippet", summary: "refreshSession", content: "const relevant = true;", relevance: 0.98, estimatedTokens: 100, dependencies: ["TokenStore"] },
  { id: "b", path: "src/auth.test.ts", kind: "symbol", summary: "login test", relevance: 0.8, content: "test content", estimatedTokens: 150 },
  { id: "c", path: "src/app.ts", kind: "file", summary: "application wiring", content: "large content", relevance: 0.7, estimatedTokens: 900 },
  { id: "d", path: "src/unrelated.ts", kind: "file", summary: "unrelated", content: "noise", relevance: 0.1, estimatedTokens: 500 },
];

test("seleciona maior relevância sem ultrapassar orçamento", () => {
  const result = planContext({ request: "Erro reproduzível no login", mode: "bug_simple", candidates, budgetTokens: 300 });
  assert.deepEqual(result.selected.slice(0, 2).map((item) => item.id), ["a", "b"]);
  assert.equal(result.selected.find((item) => item.id === "c")?.includedAs, "summary");
  assert.equal(result.estimatedTokens, 258);
  assert.equal(result.estimatedInputTokens, 258);
  assert.equal(result.excludedCount, 0);
});

test("arquitetura privilegia arquivos e retorna resumos", () => {
  const result = planContext({ request: "Arquitetar o sistema", mode: "architecture", candidates, budgetTokens: 1_000 });
  assert.equal(result.selected[0]?.id, "c");
  assert.ok(result.selected.every((item) => item.includedAs === "summary"));
});

test("expõe dependências como próximas consultas", () => {
  const result = planContext({ request: "Erro no login", mode: "bug_simple", candidates, budgetTokens: 200 });
  assert.deepEqual(result.nextQueries, ["localizar referências a TokenStore"]);
});

test("limita quantidade de itens", () => {
  const result = planContext({ request: "Implementar feature", candidates, budgetTokens: 10_000, maxItems: 2 });
  assert.equal(result.selected.length, 2);
});

test("inclui resumo quando o conteúdo não cabe no orçamento", () => {
  const result = planContext({
    request: "Entender wiring",
    mode: "implementation",
    budgetTokens: 10,
    candidates: [{
      id: "large",
      path: "src/wiring.ts",
      kind: "file",
      summary: "app wiring",
      content: "conteúdo extenso",
      relevance: 1,
      estimatedTokens: 900,
    }],
  });
  assert.equal(result.selected[0]?.includedAs, "summary");
  assert.equal(result.selected[0]?.transmittedTokens, 3);
  assert.equal(result.estimatedInputTokens, 3);
  assert.equal(result.estimatedTokensSaved, 897);
});

test("nunca ultrapassa o orçamento usando custo efetivamente transmitido", () => {
  const result = planContext({
    request: "Arquitetar sistema",
    mode: "architecture",
    budgetTokens: 6,
    candidates: [
      { id: "one", path: "a.ts", kind: "file", summary: "four words fit here", relevance: 1, estimatedTokens: 800 },
      { id: "two", path: "b.ts", kind: "file", summary: "another long summary", relevance: .9, estimatedTokens: 700 },
    ],
  });
  assert.ok(result.estimatedInputTokens <= result.budgetTokens);
  assert.equal(result.estimatedInputTokens, result.selected.reduce((sum, item) => sum + item.transmittedTokens, 0));
});
