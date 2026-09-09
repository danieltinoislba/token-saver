import type { ClassifyTaskInput, TaskClassification, TaskMode } from "./classifier.js";
import { classifyTask } from "./classifier.js";

export const modelTiers = ["economy", "balanced", "powerful", "specialized"] as const;
export type ModelTier = (typeof modelTiers)[number];
export type RoutingPolicy = "auto" | "guarded" | "manual" | "advisory" | "enforced";
export type SwitchMode = "automatic" | "confirmation" | "recommendation";

export interface ModelCandidate {
  id: string;
  provider?: string;
  tier: ModelTier;
  capabilities?: string[];
  inputCostPerMillion?: number;
  outputCostPerMillion?: number;
}

export interface RecommendModelInput extends ClassifyTaskInput {
  models: ModelCandidate[];
  requiredCapabilities?: string[];
  selectedModelId?: string;
  policy?: RoutingPolicy;
}

export interface ModelRecommendation {
  classification: TaskClassification;
  targetTier: Exclude<ModelTier, "specialized">;
  recommendedModel: ModelCandidate | null;
  reasoningEffort: "none" | "low" | "medium" | "high";
  maxOutputTokens: number;
  selectionAssessment: "appropriate" | "overpowered" | "underpowered" | "unavailable" | "not_provided";
  shouldSwitch: boolean;
  policy: RoutingPolicy;
  effectivePolicy: "auto" | "guarded" | "manual";
  switchMode: SwitchMode;
  requiresConfirmation: boolean;
  reasons: string[];
  escalationTriggers: string[];
}

const modePolicy: Record<TaskMode, {
  tier: Exclude<ModelTier, "specialized">;
  reasoning: ModelRecommendation["reasoningEffort"];
  maxOutputTokens: number;
  escalationTriggers: string[];
}> = {
  bug_simple: {
    tier: "economy", reasoning: "low", maxOutputTokens: 2_500,
    escalationTriggers: ["teste direcionado continua falhando", "causa não localizada", "mais de um serviço envolvido"],
  },
  bug_complex: {
    tier: "powerful", reasoning: "high", maxOutputTokens: 10_000,
    escalationTriggers: ["contexto excede o orçamento", "evidências permanecem contraditórias"],
  },
  architecture: {
    tier: "powerful", reasoning: "high", maxOutputTokens: 12_000,
    escalationTriggers: ["requisitos críticos ausentes", "decisão exige pesquisa especializada"],
  },
  implementation: {
    tier: "balanced", reasoning: "medium", maxOutputTokens: 6_000,
    escalationTriggers: ["mudança atravessa vários serviços", "testes revelam problema sistêmico"],
  },
  unknown: {
    tier: "balanced", reasoning: "low", maxOutputTokens: 3_000,
    escalationTriggers: ["classificação continua incerta após inspeção mínima"],
  },
};

const tierRank: Record<Exclude<ModelTier, "specialized">, number> = {
  economy: 0, balanced: 1, powerful: 2,
};

function supports(candidate: ModelCandidate, required: string[]): boolean {
  const capabilities = new Set(candidate.capabilities ?? []);
  return required.every((capability) => capabilities.has(capability));
}

function candidateCost(candidate: ModelCandidate): number {
  return (candidate.inputCostPerMillion ?? Number.MAX_SAFE_INTEGER / 2)
    + (candidate.outputCostPerMillion ?? Number.MAX_SAFE_INTEGER / 2);
}

function selectCandidate(
  models: ModelCandidate[],
  target: Exclude<ModelTier, "specialized">,
  required: string[],
): ModelCandidate | null {
  const eligible = models.filter((model) => model.tier !== "specialized" && supports(model, required));
  const targetRank = tierRank[target];
  return eligible.sort((a, b) => {
    const aDistance = Math.abs(tierRank[a.tier as Exclude<ModelTier, "specialized">] - targetRank);
    const bDistance = Math.abs(tierRank[b.tier as Exclude<ModelTier, "specialized">] - targetRank);
    return aDistance - bDistance || candidateCost(a) - candidateCost(b) || a.id.localeCompare(b.id);
  })[0] ?? null;
}

export function recommendModel(input: RecommendModelInput): ModelRecommendation {
  const classification = classifyTask(input);
  const route = modePolicy[classification.mode];
  const required = [...new Set(input.requiredCapabilities ?? [])];
  const recommendedModel = selectCandidate(input.models, route.tier, required);
  const selected = input.selectedModelId
    ? input.models.find((model) => model.id === input.selectedModelId)
    : undefined;

  let selectionAssessment: ModelRecommendation["selectionAssessment"] = "not_provided";
  if (input.selectedModelId && !selected) selectionAssessment = "unavailable";
  else if (selected?.tier === "specialized" || (selected && !supports(selected, required))) selectionAssessment = "underpowered";
  else if (selected) {
    const delta = tierRank[selected.tier as Exclude<ModelTier, "specialized">] - tierRank[route.tier];
    selectionAssessment = delta > 0 ? "overpowered" : delta < 0 ? "underpowered" : "appropriate";
  }

  const policy = input.policy ?? "auto";
  const effectivePolicy: "auto" | "guarded" | "manual" = policy === "enforced" || policy === "auto"
    ? "auto"
    : policy === "advisory" || policy === "manual" ? "manual" : "guarded";
  const shouldSwitch = Boolean(
    input.selectedModelId
    && recommendedModel
    && recommendedModel.id !== input.selectedModelId
    && selectionAssessment !== "appropriate",
  );
  const switchMode: SwitchMode = effectivePolicy === "auto"
    ? "automatic"
    : effectivePolicy === "guarded" ? "confirmation" : "recommendation";
  const reasons = [
    `tarefa classificada como ${classification.mode}`,
    `nível ${route.tier} é suficiente para esta classe de tarefa`,
  ];
  if (!recommendedModel) reasons.push("nenhum modelo disponível atende às capacidades exigidas");
  if (selectionAssessment === "overpowered") reasons.push("o modelo selecionado excede o nível necessário");
  if (selectionAssessment === "underpowered") reasons.push("o modelo selecionado pode não ter capacidade suficiente");

  return {
    classification,
    targetTier: route.tier,
    recommendedModel,
    reasoningEffort: route.reasoning,
    maxOutputTokens: route.maxOutputTokens,
    selectionAssessment,
    shouldSwitch,
    policy,
    effectivePolicy,
    switchMode,
    requiresConfirmation: switchMode === "confirmation",
    reasons,
    escalationTriggers: route.escalationTriggers,
  };
}
