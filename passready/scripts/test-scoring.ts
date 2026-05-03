/**
 * Run: npx --yes tsx scripts/test-scoring.ts
 * (from the passready package root)
 */
import { computeMockReadiness } from "../lib/scoring";
import { SCORING_BENCHMARK_FIXTURES } from "../lib/scoring-fixtures";

function inRange(score: number, min: number, max: number): boolean {
  return score >= min && score <= max;
}

let passCount = 0;
let failCount = 0;

for (const fixture of SCORING_BENCHMARK_FIXTURES) {
  const result = computeMockReadiness(fixture.inputs);
  const score = result.readinessScore;
  const ok = inRange(score, fixture.expectedScoreMin, fixture.expectedScoreMax);
  if (ok) passCount += 1;
  else failCount += 1;

  const status = ok ? "PASS" : "FAIL";
  const range = `[${fixture.expectedScoreMin}, ${fixture.expectedScoreMax}]`;
  console.log(`${status}  ${fixture.name}`);
  console.log(`       score=${score}  expected ${range}  label="${result.readinessLabel}"`);
  console.log(`       rationale: ${fixture.rationale}`);
  console.log("");
}

console.log(`Summary: ${passCount} PASS, ${failCount} FAIL (${SCORING_BENCHMARK_FIXTURES.length} fixtures)`);
process.exit(failCount > 0 ? 1 : 0);
