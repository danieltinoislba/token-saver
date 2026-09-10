import assert from "node:assert/strict";
import test from "node:test";
import { discoverRepositoryContext } from "./repository-discovery.js";

test("descoberta limita candidatos e evita diretórios gerados", () => {
  const candidates = discoverRepositoryContext({ request: "Corrigir runner Codex", cwd: process.cwd(), maxCandidates: 4 });
  assert.ok(candidates.length > 0 && candidates.length <= 4);
  assert.equal(candidates.some((item) => item.path.includes("node_modules") || item.path.includes("dist")), false);
  assert.ok(candidates.every((item) => item.content !== undefined));
});
