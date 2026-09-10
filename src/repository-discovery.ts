import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import type { ContextCandidate } from "./context-planner.js";

const ignoredDirectories = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache"]);
const ignoredExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".gz", ".lock", ".ico"]);

export interface DiscoverContextInput {
  request: string;
  cwd?: string;
  maxCandidates?: number;
  maxFileBytes?: number;
}

function requestTerms(request: string): string[] {
  return request.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9_-]{3,}/g) ?? [];
}

function trackedFiles(cwd: string): string[] {
  try {
    return execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { cwd, encoding: "utf8" })
      .split(/\r?\n/).filter(Boolean);
  } catch {
    const files: string[] = [];
    const visit = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) { if (!ignoredDirectories.has(entry.name)) visit(join(directory, entry.name)); }
        else if (entry.isFile()) files.push(relative(cwd, join(directory, entry.name)));
      }
    };
    visit(cwd);
    return files;
  }
}

function relevance(path: string, terms: string[]): number {
  const normalized = path.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const matches = terms.filter((term) => normalized.includes(term)).length;
  if (matches === 0) return /(^|\/)(readme|package\.json|src\/index)/.test(normalized) ? 0.15 : 0.03;
  return Math.min(1, 0.35 + matches / Math.max(1, terms.length) * 0.65);
}

/** Descobre apenas paths e lê o conteúdo dos mais relevantes, nunca o repositório inteiro. */
export function discoverRepositoryContext(input: DiscoverContextInput): ContextCandidate[] {
  const cwd = resolve(input.cwd ?? process.cwd());
  if (!existsSync(cwd)) throw new Error(`Diretório não encontrado: ${cwd}`);
  const maxCandidates = input.maxCandidates ?? 24;
  const maxFileBytes = input.maxFileBytes ?? 24_000;
  const terms = requestTerms(input.request);
  return trackedFiles(cwd)
    .filter((path) => !path.replaceAll("\\\\", "/").split("/").some((part) => ignoredDirectories.has(part)))
    .filter((path) => !ignoredExtensions.has(path.slice(path.lastIndexOf(".")).toLowerCase()))
    .map((path) => ({ path, score: relevance(path, terms) }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, maxCandidates)
    .flatMap(({ path, score }) => {
      const absolute = join(cwd, path);
      try {
        const size = statSync(absolute).size;
        if (size > maxFileBytes * 4) return [];
        const content = readFileSync(absolute, "utf8").slice(0, maxFileBytes);
        if (content.includes("\0")) return [];
        const summary = content.split(/\r?\n/).find((line) => line.trim())?.trim().slice(0, 240) || `Arquivo ${path}`;
        return [{ id: path, path, kind: "file" as const, summary, content, relevance: score, estimatedTokens: Math.max(1, Math.ceil(content.length / 4)) }];
      } catch { return []; }
    });
}
