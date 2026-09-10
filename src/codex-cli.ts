import { CodexRunner } from "./codex-runner.js";
import { JsonRpcStdioTransport } from "./jsonrpc-stdio.js";

const request = process.argv.slice(2).join(" ").trim();
if (!request) {
  console.error("Uso: npm run codex -- \"pedido para o agente\"");
  process.exit(1);
}

function tierForModel(model: { id: string }) {
  const id = model.id.toLowerCase();
  if (/luna|mini|nano|economy/.test(id)) return "economy" as const;
  if (/astra|sol|pro|powerful/.test(id)) return "powerful" as const;
  return "balanced" as const;
}

const transport = new JsonRpcStdioTransport();
try {
  await transport.start();
  const runner = new CodexRunner({ transport, tierForModel, provider: "openai" });
  const result = await runner.run({ request, policy: "auto" });
  console.log(JSON.stringify({ event: "routed", modelId: result.modelId, reasoningEffort: result.recommendation.reasoningEffort, threadId: result.thread.id, turnId: result.turn.id }));
  const completed = await transport.waitForNotification<{ turn?: { id?: string; status?: string } }>("turn/completed");
  console.log(JSON.stringify({ event: "completed", turn: completed.turn ?? completed }));
} finally {
  await transport.close();
}
