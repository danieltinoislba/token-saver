import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("servidor inicia, lista e executa as ferramentas via stdio", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["dist/index.js"],
    cwd: process.cwd(),
    stderr: "pipe",
  });
  const client = new Client({ name: "token-saver-integration-test", version: "1.0.0" });

  try {
    await client.connect(transport);
    const listed = await client.listTools();
    assert.deepEqual(
      listed.tools.map((tool) => tool.name).sort(),
      ["classify_task", "discover_context", "plan_context", "recommend_model", "run_routed_task"],
    );

    const classification = await client.callTool({
      name: "classify_task",
      arguments: { request: "Erro reproduzível no login", repository: { reproducible: true } },
    });
    assert.equal(classification.isError, undefined);
    assert.equal((classification.structuredContent as { mode?: string } | undefined)?.mode, "bug_simple");

    const recommendation = await client.callTool({
      name: "recommend_model",
      arguments: {
        request: "Como rodar este projeto?",
        models: [
          { id: "economico", tier: "economy" },
          { id: "potente", tier: "powerful" },
        ],
      },
    });
    assert.equal(recommendation.isError, undefined);
    assert.equal(
      (recommendation.structuredContent as { recommendedModel?: { id?: string } } | undefined)?.recommendedModel?.id,
      "economico",
    );

    const plan = await client.callTool({
      name: "plan_context",
      arguments: {
        request: "Erro no login",
        mode: "bug_simple",
        budgetTokens: 100,
        candidates: [{ id: "login", path: "src/login.ts", kind: "snippet", summary: "login", relevance: 1, estimatedTokens: 80 }],
      },
    });
    assert.equal(plan.isError, undefined);
    assert.equal((plan.structuredContent as { selected?: unknown[] } | undefined)?.selected?.length, 1);
  } finally {
    await client.close();
  }
});
