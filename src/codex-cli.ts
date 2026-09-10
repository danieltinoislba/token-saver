import { runRoutedTask } from "./routed-task.js";

const request = process.argv.slice(2).join(" ").trim();
if (!request) {
  console.error("Uso: npm run codex -- \"pedido para o agente\"");
  process.exit(1);
}

try {
  const result = await runRoutedTask({ request });
  console.log(JSON.stringify({ event: "routed", modelId: result.modelId, reasoningEffort: result.recommendation.reasoningEffort, threadId: result.thread.id, turnId: result.turn.id }));
  console.log(JSON.stringify({ event: "completed", turn: result.completedTurn }));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
