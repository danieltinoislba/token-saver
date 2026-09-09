import type { ClassifyTaskInput } from "../classifier.js";
import type { ModelCandidate, RoutingPolicy } from "../model-recommender.js";
import { routeBeforeExecution, type RouteBeforeExecutionResult } from "../routing-adapter.js";

/**
 * Ponte mínima que um cliente Codex precisa implementar.
 * O MCP não possui permissão para alterar uma sessão do Codex diretamente;
 * este contrato mantém essa integração explícita e testável.
 */
export interface CodexSessionController {
  listModels(): Promise<ModelCandidate[]>;
  getSelectedModelId(): Promise<string | undefined>;
  switchModel(modelId: string): Promise<void>;
}

export interface CodexRouteInput extends ClassifyTaskInput {
  controller: CodexSessionController;
  requiredCapabilities?: string[];
  policy?: RoutingPolicy;
}

export async function routeCodexTask(input: CodexRouteInput): Promise<RouteBeforeExecutionResult> {
  const [models, selectedModelId] = await Promise.all([
    input.controller.listModels(),
    input.controller.getSelectedModelId(),
  ]);

  return routeBeforeExecution({
    request: input.request,
    repository: input.repository,
    models,
    selectedModelId,
    requiredCapabilities: input.requiredCapabilities,
    policy: input.policy,
    switchModel: async (model) => input.controller.switchModel(model.id),
  });
}
