export const taskModes = ["bug_simple", "bug_complex", "architecture", "implementation", "unknown"] as const;
export type TaskMode = (typeof taskModes)[number];

export interface RepositorySignals {
  changedFiles?: string[];
  recentErrors?: string[];
  services?: string[];
  reproducible?: boolean;
}
export interface ClassifyTaskInput { request: string; repository?: RepositorySignals; }
export interface TaskStrategy {
  contextBudget: number;
  maxFiles: number;
  searchDepth: number;
  runArchitectureAnalysis: boolean;
  suggestedReasoning: "low" | "medium" | "high";
}
export interface TaskClassification {
  mode: TaskMode;
  confidence: number;
  strategy: TaskStrategy;
  reasons: string[];
  scores: Record<Exclude<TaskMode, "unknown">, number>;
}

type ScoredMode = Exclude<TaskMode, "unknown">;
const strategies: Record<TaskMode, TaskStrategy> = {
  bug_simple: { contextBudget: 4_000, maxFiles: 6, searchDepth: 2, runArchitectureAnalysis: false, suggestedReasoning: "low" },
  bug_complex: { contextBudget: 12_000, maxFiles: 18, searchDepth: 4, runArchitectureAnalysis: false, suggestedReasoning: "high" },
  architecture: { contextBudget: 18_000, maxFiles: 30, searchDepth: 5, runArchitectureAnalysis: true, suggestedReasoning: "high" },
  implementation: { contextBudget: 8_000, maxFiles: 12, searchDepth: 3, runArchitectureAnalysis: false, suggestedReasoning: "medium" },
  unknown: { contextBudget: 3_000, maxFiles: 5, searchDepth: 1, runArchitectureAnalysis: false, suggestedReasoning: "low" },
};

const rules: Array<{ mode: ScoredMode; points: number; reason: string; pattern: RegExp }> = [
  { mode: "architecture", points: 4, reason: "pedido explícito de arquitetura", pattern: /\b(arquitet|architecture|design system|projetar sistema)\w*/ },
  { mode: "architecture", points: 3, reason: "mudança estrutural ou migração", pattern: /\b(migra|escalabilidade|escalar|microservi|monolit|event[- ]driven)\w*/ },
  { mode: "architecture", points: 2, reason: "decisão sistêmica", pattern: /\btrade[- ]?off\b|\bcontrato publico\b|\brequisitos?\b|\bmultiplos? modulos?\b/ },
  { mode: "bug_complex", points: 4, reason: "sintoma tipicamente complexo", pattern: /\b(intermitent|race condition|concorr|deadlock|memory leak|vazamento de memoria)\w*/ },
  { mode: "bug_complex", points: 3, reason: "causa ou reprodução incerta", pattern: /\b(nao sei a causa|causa desconhecida|nao consigo reproduzir|inconsistente)\b/ },
  { mode: "bug_complex", points: 2, reason: "problema distribuído ou de desempenho", pattern: /\b(performance|latencia|timeout|distribuid|varios servicos)\w*/ },
  { mode: "bug_simple", points: 3, reason: "falha concreta e localizada", pattern: /\b(erro|error|falha|bug|exception|retorna 500|quebrou)\b/ },
  { mode: "bug_simple", points: 2, reason: "reprodução ou localização indicada", pattern: /\b(reproduz|sempre acontece|arquivo|linha|stack trace|componente)\w*/ },
  { mode: "bug_simple", points: 1, reason: "regressão recente", pattern: /\b(regress|depois da ultima mudanca|parou de funcionar)\w*/ },
  { mode: "implementation", points: 3, reason: "pedido explícito de implementação", pattern: /\b(implement|adicion|crie|criar|constru|refator|endpoint|feature)\w*/ },
];

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function classifyTask(input: ClassifyTaskInput): TaskClassification {
  const text = normalize([input.request, ...(input.repository?.recentErrors ?? [])].join("\n"));
  const scores: Record<ScoredMode, number> = { bug_simple: 0, bug_complex: 0, architecture: 0, implementation: 0 };
  const reasonsByMode: Record<ScoredMode, string[]> = { bug_simple: [], bug_complex: [], architecture: [], implementation: [] };
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      scores[rule.mode] += rule.points;
      reasonsByMode[rule.mode].push(rule.reason);
    }
  }
  const repository = input.repository;
  if (repository?.reproducible === true) {
    scores.bug_simple += 2;
    reasonsByMode.bug_simple.push("falha informada como reproduzível");
  } else if (repository?.reproducible === false) {
    scores.bug_complex += 3;
    reasonsByMode.bug_complex.push("falha informada como não reproduzível");
  }
  if ((repository?.services?.length ?? 0) > 1) {
    scores.bug_complex += 2;
    scores.architecture += 1;
    reasonsByMode.bug_complex.push("mais de um serviço envolvido");
  }
  if ((repository?.changedFiles?.length ?? 0) === 1) {
    scores.bug_simple += 1;
    reasonsByMode.bug_simple.push("mudança concentrada em um arquivo");
  }
  const ranked = (Object.entries(scores) as Array<[ScoredMode, number]>).sort((a, b) => b[1] - a[1]);
  const [winner, runnerUp] = ranked;
  const topScore = winner[1];
  const margin = topScore - runnerUp[1];
  const mode: TaskMode = topScore < 2 || (topScore < 4 && margin === 0) ? "unknown" : winner[0];
  const confidence = mode === "unknown" ? Math.min(0.49, topScore / 10) : Math.min(0.98, 0.5 + topScore * 0.06 + margin * 0.04);
  return {
    mode,
    confidence: Number(confidence.toFixed(2)),
    strategy: strategies[mode],
    reasons: mode === "unknown" ? ["evidência insuficiente para classificar com segurança"] : [...new Set(reasonsByMode[mode])],
    scores,
  };
}
