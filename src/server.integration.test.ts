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
      ["classify_task", "recommend_model"],
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
  } finally {
    await client.close();
  }
});
