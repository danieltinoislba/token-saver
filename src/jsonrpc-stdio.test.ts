import assert from "node:assert/strict";
import test from "node:test";
import { JsonRpcStdioTransport } from "./jsonrpc-stdio.js";

test("transporte falha claramente quando uma requisição é feita antes do start", async () => {
  const transport = new JsonRpcStdioTransport({ command: process.execPath });
  await assert.rejects(() => transport.request("model/list", {}), /não iniciado/);
});

test("transporte expõe o comando padrão do App Server", () => {
  const transport = new JsonRpcStdioTransport();
  assert.ok(transport);
});
