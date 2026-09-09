import type { ClassifyTaskInput, TaskMode } from "./classifier.js";
import { recommendModel, type ModelCandidate, type ModelTier } from "./model-recommender.js";

export interface EvaluationCase extends ClassifyTaskInput {
  id: string;
  expectedMode: TaskMode;
  expectedTier: Exclude<ModelTier, "specialized">;
}

export interface EvaluationFailure {
  id: string;
  expectedMode: TaskMode;
  actualMode: TaskMode;
  expectedTier: Exclude<ModelTier, "specialized">;
  actualTier: Exclude<ModelTier, "specialized">;
}

export interface EvaluationReport {
  total: number;
  modeAccuracy: number;
  tierAccuracy: number;
  passed: number;
  failures: EvaluationFailure[];
  confusionMatrix: Record<string, Record<string, number>>;
}

const tierModels: ModelCandidate[] = [
  { id: "eval-economy", tier: "economy" },
  { id: "eval-balanced", tier: "balanced" },
  { id: "eval-powerful", tier: "powerful" },
];

export function evaluateCases(cases: EvaluationCase[]): EvaluationReport {
  const failures: EvaluationFailure[] = [];
  const confusionMatrix: Record<string, Record<string, number>> = {};
  let correctModes = 0;
  let correctTiers = 0;

  for (const item of cases) {
    const result = recommendModel({
      request: item.request,
      repository: item.repository,
      models: tierModels,
    });
    const actualMode = result.classification.mode;
    const actualTier = result.targetTier;
    confusionMatrix[item.expectedMode] ??= {};
    confusionMatrix[item.expectedMode][actualMode] = (confusionMatrix[item.expectedMode][actualMode] ?? 0) + 1;
    if (actualMode === item.expectedMode) correctModes += 1;
    if (actualTier === item.expectedTier) correctTiers += 1;
    if (actualMode !== item.expectedMode || actualTier !== item.expectedTier) {
      failures.push({
        id: item.id,
        expectedMode: item.expectedMode,
        actualMode,
        expectedTier: item.expectedTier,
        actualTier,
      });
    }
  }

  const total = cases.length;
  return {
    total,
    modeAccuracy: total === 0 ? 0 : Number((correctModes / total).toFixed(4)),
    tierAccuracy: total === 0 ? 0 : Number((correctTiers / total).toFixed(4)),
    passed: total - failures.length,
    failures,
    confusionMatrix,
  };
}
