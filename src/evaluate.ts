import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { evaluateCases, type EvaluationCase } from "./evaluation.js";

const file = resolve(process.cwd(), process.argv[2] ?? "evals/cases.json");
const cases = JSON.parse(await readFile(file, "utf8")) as EvaluationCase[];
const report = evaluateCases(cases);

console.log(JSON.stringify(report, null, 2));
if (report.modeAccuracy < 0.85 || report.tierAccuracy < 0.85) process.exitCode = 1;
