import { recommendModel, type ModelCandidate, type ModelRecommendation } from "./model-recommender.js";
import type { RepositorySignals } from "./classifier.js";

export interface JsonRpcTransport {
  request<T>(method: string, params: Record<string, unknown>): Promise<T>;
}

export interface AppServerModel {
  id: string;
  model?: string;
  displayName?: string;
  supportedReasoningEfforts?: Array<{ reasoningEffort: string }>;
}

export interface AppServerThread {
  id: string;
}

export interface AppServerTurn {
  id: string;
  status?: string;
}

export interface CodexRunnerOptions {
  transport: JsonRpcTransport;
  /** Classifica nomes/metadata do App Server em níveis do Token Saver. */
  tierForModel: (model: AppServerModel) => ModelCandidate["tier"];
  provider?: string;
}

export interface RunCodexTaskInput {
  request: string;
  repository?: RepositorySignals;
  selectedModelId?: string;
  requiredCapabilities?: string[];
  policy?: "auto" | "guarded" | "manual";
  cwd?: string;
}

export interface RunCodexTaskResult {
  recommendation: ModelRecommendation;
  thread: AppServerThread;
  turn: AppServerTurn;
  modelId: string;
}

export class CodexRunner {
  constructor(private readonly options: CodexRunnerOptions) {}

  async listModels(): Promise<AppServerModel[]> {
    const response = await this.options.transport.request<{ data: AppServerModel[] }>("model/list", {
      limit: 100,
      includeHidden: false,
    });
    return response.data;
  }

  async run(input: RunCodexTaskInput): Promise<RunCodexTaskResult> {
    const appModels = await this.listModels();
    const models: ModelCandidate[] = appModels.map((model) => ({
      id: model.id,
      provider: this.options.provider,
      tier: this.options.tierForModel(model),
      capabilities: ["code", "tools"],
    }));
    const recommendation = recommendModel({
      request: input.request,
      repository: input.repository,
      models,
      selectedModelId: input.selectedModelId,
      requiredCapabilities: input.requiredCapabilities,
      policy: input.policy,
    });
    if (!recommendation.recommendedModel) {
      throw new Error("Token Saver não encontrou um modelo compatível no App Server");
    }
    if (recommendation.switchMode === "recommendation") {
      throw new Error(`Roteamento manual exige confirmação para ${recommendation.recommendedModel.id}`);
    }
    if (recommendation.switchMode === "confirmation") {
      throw new Error(`Roteamento guarded exige confirmação para ${recommendation.recommendedModel.id}`);
    }

    const modelId = recommendation.recommendedModel.id;
    const threadResponse = await this.options.transport.request<{ thread: AppServerThread }>("thread/start", {
      model: modelId,
      cwd: input.cwd,
    });
    const thread = threadResponse.thread;
    const turnResponse = await this.options.transport.request<{ turn: AppServerTurn }>("turn/start", {
      threadId: thread.id,
      model: modelId,
      effort: recommendation.reasoningEffort,
      input: [{ type: "text", text: input.request }],
    });
    const turn = turnResponse.turn;
    return { recommendation, thread, turn, modelId };
  }

  async startTurn(threadId: string, request: string, modelId: string, reasoningEffort: string): Promise<AppServerTurn> {
    const response = await this.options.transport.request<{ turn: AppServerTurn }>("turn/start", {
      threadId,
      model: modelId,
      effort: reasoningEffort,
      input: [{ type: "text", text: request }],
    });
    return response.turn;
  }
}
