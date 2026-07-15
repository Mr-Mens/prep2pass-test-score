import assert from "node:assert/strict";

import { buildDefaultMockTestForm } from "../lib/instructor/mock-test-defaults";
import { mergeMockTestPayload } from "../lib/instructor/mock-test-defaults";
import { buildMockTestSummary } from "../lib/instructor/mock-test-scoring";

function testUseOfSpeedInDedicatedSection() {
  const base = buildDefaultMockTestForm();
  base.useOfSpeed = {
    useOfSpeed: { minorCount: 2, seriousCount: 0, dangerous: false },
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
      normalDriving: { minorCount: 0, seriousCount: 0, dangerous: false },
      laneDiscipline: { minorCount: 0, seriousCount: 0, dangerous: false },
      useOfSpeed: { minorCount: 0, seriousCount: 0, dangerous: false },
      pedCrossings: { minorCount: 0, seriousCount: 0, dangerous: false },
      normalStop: { minorCount: 0, seriousCount: 0, dangerous: false },
      awarenessPlanning: { minorCount: 0, seriousCount: 0, dangerous: false },
      clearance: { minorCount: 0, seriousCount: 0, dangerous: false },
      followingDistance: { minorCount: 0, seriousCount: 0, dangerous: false },
    },
    useOfSpeed: {
      useOfSpeed: { minorCount: 1, seriousCount: 0, dangerous: false },
    },
    junctions: {
      approachSpeed: { minorCount: 0, seriousCount: 1, dangerous: false },
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

function testLegacyAwarenessPlanningDrivingFaultMigrates() {
  const raw = {
    positioningCore: {
      awarenessPlanning: { minorCount: 2, seriousCount: 0, dangerous: false },
    },
  };

  const merged = mergeMockTestPayload(raw);
  const summary = buildMockTestSummary(merged, 15);
  const drivingLabels = summary.topRiskAreas.driving.map((e) => e.displayLabel);
  assert.ok(
    drivingLabels.includes("Awareness / planning (2)"),
    `expected Awareness / planning driving fault after legacy merge, got ${drivingLabels.join(", ")}`,
  );
}

function testMultipleSeriousFaultsOnSameRow() {
  const base = buildDefaultMockTestForm();
  base.junctions = {
    approachSpeed: { minorCount: 0, seriousCount: 2, dangerous: false },
  };

  const summary = buildMockTestSummary(base, 15);
  assert.equal(summary.seriousCount, 2, "two explicit serious faults should count toward total");
  assert.ok(
    summary.topRiskAreas.serious.some((e) => e.displayLabel === "Junctions: Approach speed (2)"),
    `expected serious tally in report, got ${summary.topRiskAreas.serious.map((e) => e.displayLabel).join(", ")}`,
  );
}

function testLegacySeriousBooleanNormalizesToCount() {
  const base = buildDefaultMockTestForm();
  base.signals = {
    necessary: { minorCount: 0, serious: true, dangerous: false } as unknown as {
      minorCount: number;
      seriousCount: number;
      dangerous: boolean;
    },
  };

  const summary = buildMockTestSummary(base, 15);
  assert.equal(summary.seriousCount, 1);
  assert.ok(summary.topRiskAreas.serious.some((e) => e.displayLabel.includes("Necessary (1)")));
}

function testMixedMinorAndSeriousOnSameRowAppearInBothLists() {
  const base = buildDefaultMockTestForm();
  base.moveOff = {
    control: { minorCount: 1, seriousCount: 1, dangerous: false },
  };

  const summary = buildMockTestSummary(base, 15);
  assert.equal(summary.totalMinors, 1, "minor should count toward driving total");
  assert.equal(summary.seriousCount, 1, "serious should count toward serious total");
  assert.ok(
    summary.topRiskAreas.driving.some((e) => e.displayLabel === "Move off: Control (1)"),
    `expected minor in driving list, got ${summary.topRiskAreas.driving.map((e) => e.displayLabel).join(", ")}`,
  );
  assert.ok(
    summary.topRiskAreas.serious.some((e) => e.displayLabel === "Move off: Control (1)"),
    `expected serious in serious list, got ${summary.topRiskAreas.serious.map((e) => e.displayLabel).join(", ")}`,
  );
}

testUseOfSpeedInDedicatedSection();
testLegacyPositioningCoreDoesNotWipeUseOfSpeed();
testLegacyAwarenessPlanningDrivingFaultMigrates();
testMultipleSeriousFaultsOnSameRow();
testLegacySeriousBooleanNormalizesToCount();
testMixedMinorAndSeriousOnSameRowAppearInBothLists();

console.log("Mock test use-of-speed tests passed.");
