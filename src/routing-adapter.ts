import { recommendModel, type ModelCandidate, type ModelRecommendation, type RoutingPolicy } from "./model-recommender.js";
import type { ClassifyTaskInput } from "./classifier.js";

export interface RouteBeforeExecutionInput extends ClassifyTaskInput {
  models: ModelCandidate[];
  selectedModelId?: string;
  requiredCapabilities?: string[];
  policy?: RoutingPolicy;
  switchModel?: (model: ModelCandidate) => Promise<void>;
}

export interface RouteBeforeExecutionResult {
  recommendation: ModelRecommendation;
  switched: boolean;
  action: "switched" | "confirmation_required" | "recommendation_only" | "no_change" | "unavailable";
}

export async function routeBeforeExecution(input: RouteBeforeExecutionInput): Promise<RouteBeforeExecutionResult> {
  const recommendation = recommendModel(input);
  if (!recommendation.shouldSwitch || !recommendation.recommendedModel) {
    return {
      recommendation,
      switched: false,
      action: recommendation.recommendedModel ? "no_change" : "unavailable",
    };
  }
  if (recommendation.switchMode === "recommendation") {
    return { recommendation, switched: false, action: "recommendation_only" };
  }
  if (recommendation.switchMode === "confirmation" || !input.switchModel) {
    return { recommendation, switched: false, action: "confirmation_required" };
  }
  await input.switchModel(recommendation.recommendedModel);
  return { recommendation, switched: true, action: "switched" };
}
