import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { classifyTask } from "./classifier.js";
import { modelTiers, recommendModel } from "./model-recommender.js";
import { planContext } from "./context-planner.js";
import { runRoutedTask } from "./routed-task.js";
import { discoverRepositoryContext } from "./repository-discovery.js";

const repositorySchema = z.object({
  changedFiles: z.array(z.string()).optional(),
  recentErrors: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  reproducible: z.boolean().optional(),
});

const contextCandidateSchema = z.object({
  id: z.string().min(1), path: z.string().min(1), kind: z.enum(["file", "symbol", "snippet"]),
  summary: z.string(), content: z.string().optional(), relevance: z.number().min(0).max(1),
  estimatedTokens: z.number().int().positive(), dependencies: z.array(z.string()).optional(),
});

const server = new McpServer({
  name: "token-saver",
  version: "0.1.0",
}, {
  instructions: "Classifique a tarefa antes de explorar o repositório. Use plan_context para limitar contexto e recommend_model para selecionar o menor nível suficiente. A política auto só pode trocar o modelo quando o cliente fornecer um adaptador de sessão.",
});

server.registerTool(
  "classify_task",
  {
    title: "Classificar tarefa",
    description: "Classifica uma tarefa e retorna uma política econômica de contexto. Use antes de explorar um repositório.",
    inputSchema: {
      request: z.string().min(1).describe("Pedido do usuário, sem expandir ou resumir"),
      repository: repositorySchema.optional(),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async (input) => {
    const result = classifyTask(input);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: { ...result },
    };
  }
);

server.registerTool(
  "plan_context",
  {
    title: "Planejar contexto",
    description: "Seleciona arquivos, símbolos e trechos relevantes dentro de um orçamento de tokens, sem ler o repositório inteiro.",
    inputSchema: {
      request: z.string().min(1),
      mode: z.enum(["bug_simple", "bug_complex", "architecture", "implementation", "unknown"]).optional(),
      budgetTokens: z.number().int().positive().optional(),
      maxItems: z.number().int().positive().optional(),
      candidates: z.array(contextCandidateSchema).min(1),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async (input) => {
    const result = planContext(input);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: { ...result },
    };
  },
);

server.registerTool(
  "recommend_model",
  {
    title: "Recomendar modelo",
    description: "Recomenda o modelo mais econômico que atende à tarefa usando somente o catálogo informado pelo cliente. A troca efetiva depende do cliente ou adaptador.",
    inputSchema: {
      request: z.string().min(1),
      repository: repositorySchema.optional(),
      models: z.array(z.object({
        id: z.string().min(1),
        provider: z.string().optional(),
        tier: z.enum(modelTiers),
        capabilities: z.array(z.string()).optional(),
        inputCostPerMillion: z.number().nonnegative().optional(),
        outputCostPerMillion: z.number().nonnegative().optional(),
      })).min(1),
      requiredCapabilities: z.array(z.string()).optional(),
      selectedModelId: z.string().optional(),
      policy: z.enum(["auto", "guarded", "manual", "advisory", "enforced"]).optional(),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async (input) => {
    const result = recommendModel(input);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: { ...result },
    };
  },
);

server.registerTool(
  "discover_context",
  {
    title: "Descobrir contexto local mínimo",
    description: "Lista e lê somente os arquivos locais mais relevantes para o pedido, sem carregar o repositório inteiro.",
    inputSchema: { request: z.string().min(1), cwd: z.string().min(1).optional(), maxCandidates: z.number().int().positive().max(100).optional() },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async (input) => {
    const result = discoverRepositoryContext(input);
    return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: { candidates: result } };
  },
);

server.registerTool(
  "run_routed_task",
  {
    title: "Executar task roteada no Codex",
    description: "Inicia o Codex App Server, seleciona automaticamente modelo/esforço, limita o contexto informado e executa a task em uma nova thread. Pode editar arquivos conforme a política do Codex.",
    inputSchema: {
      request: z.string().min(1),
      repository: repositorySchema.optional(),
      contextCandidates: z.array(contextCandidateSchema).optional(),
      contextBudgetTokens: z.number().int().positive().optional(),
      discoverContext: z.boolean().optional(),
      cwd: z.string().min(1).optional(),
      timeoutMs: z.number().int().positive().max(600_000).optional(),
    },
    annotations: { readOnlyHint: false, openWorldHint: false },
  },
  async (input) => {
    const result = await runRoutedTask(input);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: { ...result },
    };
  },
);

const transport = new StdioServerTransport();

await server.connect(transport);
