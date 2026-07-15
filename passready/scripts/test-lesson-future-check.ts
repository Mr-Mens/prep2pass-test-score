import assert from "node:assert/strict";

import {
  isLessonInFuture,
  ukWallDateTimeToUtcMs,
} from "../lib/instructor-lessons/format";

function testUkSummerTimeMapsToUtcPlusOne() {
  // 15 Jul 2026 09:00 BST = 08:00 UTC
  const ms = ukWallDateTimeToUtcMs("2026-07-15", "09:00");
  assert.equal(new Date(ms).toISOString(), "2026-07-15T08:00:00.000Z");
}

function testUkWinterTimeMapsToUtc() {
  // 15 Jan 2026 09:00 GMT = 09:00 UTC
  const ms = ukWallDateTimeToUtcMs("2026-01-15", "09:00");
  assert.equal(new Date(ms).toISOString(), "2026-01-15T09:00:00.000Z");
}

function testPastLessonNotFutureOnUtcHost() {
  const lesson = {
    lesson_date: "2026-07-15",
    start_time: "09:00",
    duration_minutes: 60,
  };
  // 10:00 BST = 09:00 UTC — lesson started an hour ago
  const now = Date.parse("2026-07-15T09:00:00.000Z");
  assert.equal(isLessonInFuture(lesson, now), false);
}

function testFutureLessonStillBlocked() {
  const lesson = {
    lesson_date: "2026-07-15",
    start_time: "16:00",
    duration_minutes: 60,
  };
  // 10:00 BST = 09:00 UTC
  const now = Date.parse("2026-07-15T09:00:00.000Z");
  assert.equal(isLessonInFuture(lesson, now), true);
}

function testJustStartedCanComplete() {
  const lesson = {
    lesson_date: "2026-07-15",
    start_time: "10:00",
    duration_minutes: 90,
  };
  // Exactly at start (09:00 UTC / 10:00 BST)
  const now = Date.parse("2026-07-15T09:00:00.000Z");
  assert.equal(isLessonInFuture(lesson, now), false);
}

testUkSummerTimeMapsToUtcPlusOne();
testUkWinterTimeMapsToUtc();
testPastLessonNotFutureOnUtcHost();
testFutureLessonStillBlocked();
testJustStartedCanComplete();

console.log("Lesson future-check timezone tests passed.");
