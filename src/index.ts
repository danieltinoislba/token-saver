import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { classifyTask } from "./classifier.js";
import { modelTiers, recommendModel } from "./model-recommender.js";

const server = new McpServer({
  name: "token-saver",
  version: "0.1.0",
});

server.registerTool(
  "classify_task",
  {
    title: "Classificar tarefa",
    description: "Classifica uma tarefa e retorna uma política econômica de contexto. Use antes de explorar um repositório.",
    inputSchema: {
      request: z.string().min(1).describe("Pedido do usuário, sem expandir ou resumir"),
      repository: z.object({
        changedFiles: z.array(z.string()).optional(),
        recentErrors: z.array(z.string()).optional(),
        services: z.array(z.string()).optional(),
        reproducible: z.boolean().optional(),
      }).optional(),
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
  "recommend_model",
  {
    title: "Recomendar modelo",
    description: "Recomenda o modelo mais econômico que atende à tarefa usando somente o catálogo informado pelo cliente. A troca efetiva depende do cliente ou adaptador.",
    inputSchema: {
      request: z.string().min(1),
      repository: z.object({
        changedFiles: z.array(z.string()).optional(),
        recentErrors: z.array(z.string()).optional(),
        services: z.array(z.string()).optional(),
        reproducible: z.boolean().optional(),
      }).optional(),
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
      policy: z.enum(["advisory", "guarded", "enforced"]).optional(),
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

const transport = new StdioServerTransport();

await server.connect(transport);
