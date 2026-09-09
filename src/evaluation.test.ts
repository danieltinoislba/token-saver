import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { evaluateCases, type EvaluationCase } from "./evaluation.js";

test("dataset mantém precisão mínima sem regressões silenciosas", async () => {
  const cases = JSON.parse(await readFile("evals/cases.json", "utf8")) as EvaluationCase[];
  const report = evaluateCases(cases);
  assert.ok(report.total >= 30);
  assert.ok(report.modeAccuracy >= 0.85, JSON.stringify(report.failures));
  assert.ok(report.tierAccuracy >= 0.85, JSON.stringify(report.failures));
});

test("dataset vazio não produz divisão por zero", () => {
  const report = evaluateCases([]);
  assert.equal(report.modeAccuracy, 0);
  assert.equal(report.tierAccuracy, 0);
});
