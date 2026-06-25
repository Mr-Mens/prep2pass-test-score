import assert from "node:assert/strict";

import { buildDefaultMockTestForm } from "../lib/instructor/mock-test-defaults";
import { mergeMockTestPayload } from "../lib/instructor/mock-test-defaults";
import { buildMockTestSummary } from "../lib/instructor/mock-test-scoring";

function testUseOfSpeedInDedicatedSection() {
  const base = buildDefaultMockTestForm();
  base.useOfSpeed = {
    useOfSpeed: { minorCount: 2, serious: false, dangerous: false },
  };

  const summary = buildMockTestSummary(base, 15);
  const drivingLabels = summary.topRiskAreas.driving.map((e) => e.displayLabel);
  assert.ok(drivingLabels.includes("Use of speed (2)"), `expected Use of speed in driving faults, got ${drivingLabels.join(", ")}`);
  assert.ok(
    summary.suggestedFocus.some((line) => line.includes("Use of speed (2)")),
    `expected use of speed in suggested focus, got ${summary.suggestedFocus.join(" | ")}`,
  );
}

function testLegacyPositioningCoreDoesNotWipeUseOfSpeed() {
  const raw = {
    positioningCore: {
      normalDriving: { minorCount: 0, serious: false, dangerous: false },
      laneDiscipline: { minorCount: 0, serious: false, dangerous: false },
      useOfSpeed: { minorCount: 0, serious: false, dangerous: false },
      pedCrossings: { minorCount: 0, serious: false, dangerous: false },
      normalStop: { minorCount: 0, serious: false, dangerous: false },
      awarenessPlanning: { minorCount: 0, serious: false, dangerous: false },
      clearance: { minorCount: 0, serious: false, dangerous: false },
      followingDistance: { minorCount: 0, serious: false, dangerous: false },
    },
    useOfSpeed: {
      useOfSpeed: { minorCount: 1, serious: false, dangerous: false },
    },
    junctions: {
      approachSpeed: { minorCount: 0, serious: true, dangerous: false },
    },
  };

  const merged = mergeMockTestPayload(raw);
  const summary = buildMockTestSummary(merged, 15);
  const drivingLabels = summary.topRiskAreas.driving.map((e) => e.displayLabel);
  assert.ok(
    drivingLabels.some((label) => label.startsWith("Use of speed")),
    `Use of speed driving fault missing after legacy merge: ${drivingLabels.join(", ")}`,
  );
  assert.ok(
    summary.topRiskAreas.serious.some((e) => e.displayLabel.includes("Approach speed")),
    "serious junction fault should remain",
  );
  assert.ok(
    summary.suggestedFocus.some((line) => line.includes("Approach speed")),
    `expected serious fault in suggested focus, got ${summary.suggestedFocus.join(" | ")}`,
  );
}

testUseOfSpeedInDedicatedSection();
testLegacyPositioningCoreDoesNotWipeUseOfSpeed();

console.log("Mock test use-of-speed tests passed.");
