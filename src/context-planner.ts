import type { TaskMode } from "./classifier.js";
import { classifyTask } from "./classifier.js";

export type ContextCandidateKind = "file" | "symbol" | "snippet";

export interface ContextCandidate {
  id: string;
  path: string;
  kind: ContextCandidateKind;
  summary: string;
  content?: string;
  relevance: number;
  estimatedTokens: number;
  dependencies?: string[];
}

export interface PlanContextInput {
  request: string;
  candidates: ContextCandidate[];
  mode?: TaskMode;
  budgetTokens?: number;
  maxItems?: number;
}

export interface SelectedContext extends ContextCandidate {
  includedAs: "content" | "summary";
  rank: number;
  /** Tokens do payload efetivamente enviado ao modelo. */
  transmittedTokens: number;
}

export interface ContextPlan {
  mode: TaskMode;
  budgetTokens: number;
  /** Alias explícito para observabilidade do custo real de entrada. */
  estimatedInputTokens: number;
  estimatedTokens: number;
  selected: SelectedContext[];
  excludedCount: number;
  estimatedTokensSaved: number;
  nextQueries: string[];
  reasons: string[];
}

const defaultBudgets: Record<TaskMode, number> = {
  bug_simple: 4_000,
  bug_complex: 12_000,
  architecture: 18_000,
  implementation: 8_000,
  unknown: 3_000,
};

function modeWeight(mode: TaskMode, kind: ContextCandidateKind): number {
  if (mode === "architecture") return kind === "file" ? 2 : kind === "symbol" ? 0.9 : 0.75;
  if (mode === "bug_simple") return kind === "snippet" ? 1.15 : kind === "symbol" ? 1.05 : 0.75;
  if (mode === "bug_complex") return kind === "symbol" ? 1.1 : kind === "file" ? 1 : 0.95;
  return kind === "symbol" ? 1.05 : 1;
}

function estimateTextTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function preferredTransmission(candidate: ContextCandidate, mode: TaskMode): {
  includedAs: SelectedContext["includedAs"];
  transmittedTokens: number;
} {
  if (candidate.content && mode !== "architecture") {
    return { includedAs: "content", transmittedTokens: candidate.estimatedTokens };
  }
  return { includedAs: "summary", transmittedTokens: estimateTextTokens(candidate.summary) };
}

function compactCandidate(candidate: ContextCandidate, mode: TaskMode, budgetRemaining: number): SelectedContext | null {
  const preferred = preferredTransmission(candidate, mode);
  if (preferred.transmittedTokens <= budgetRemaining) {
    return { ...candidate, ...preferred, rank: 0 };
  }

  const summaryTokens = estimateTextTokens(candidate.summary);
  if (summaryTokens > budgetRemaining) return null;
  return { ...candidate, includedAs: "summary", transmittedTokens: summaryTokens, rank: 0 };
}

export function planContext(input: PlanContextInput): ContextPlan {
  const classifiedMode = input.mode ?? classifyTask({ request: input.request }).mode;
  const budgetTokens = input.budgetTokens ?? defaultBudgets[classifiedMode];
  const maxItems = input.maxItems ?? (classifiedMode === "bug_simple" ? 6 : classifiedMode === "architecture" ? 30 : 12);
  const candidates = input.candidates
    .map((candidate) => ({
      candidate,
      score: Math.max(0, Math.min(1, candidate.relevance)) * modeWeight(classifiedMode, candidate.kind),
      transmission: preferredTransmission(candidate, classifiedMode),
    }))
    .sort((a, b) => {
      const aUtility = a.score / a.transmission.transmittedTokens;
      const bUtility = b.score / b.transmission.transmittedTokens;
      return bUtility - aUtility || b.score - a.score || a.candidate.id.localeCompare(b.candidate.id);
    });

  const selected: SelectedContext[] = [];
  let estimatedTokens = 0;
  for (const { candidate } of candidates) {
    if (selected.length >= maxItems) break;
    const remaining = budgetTokens - estimatedTokens;
    const item = compactCandidate(candidate, classifiedMode, remaining);
    if (!item) continue;
    item.rank = selected.length + 1;
    selected.push(item);
    estimatedTokens += item.transmittedTokens;
  }

  const selectedIds = new Set(selected.map((item) => item.id));
  const excluded = candidates.filter(({ candidate }) => !selectedIds.has(candidate.id));
  const dependencies = [...new Set(selected.flatMap((item) => item.dependencies ?? []))]
    .filter((dependency) => !selected.some((item) => item.path === dependency));
  const nextQueries = dependencies.slice(0, 5).map((dependency) => `localizar referências a ${dependency}`);

  return {
    mode: classifiedMode,
    budgetTokens,
    estimatedInputTokens: estimatedTokens,
    estimatedTokens,
    selected,
    excludedCount: excluded.length,
    estimatedTokensSaved: input.candidates.reduce((sum, item) => sum + item.estimatedTokens, 0) - estimatedTokens,
    nextQueries,
    reasons: [
      `prioridade ajustada para ${classifiedMode}`,
      `${selected.length} de ${candidates.length} candidatos incluídos dentro do orçamento`,
    ],
  };
}
