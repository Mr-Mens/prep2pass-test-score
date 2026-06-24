import assert from "node:assert/strict";

import {
  calculateReferralCommissionAmount,
  INSTRUCTOR_COMMISSION_RATE,
  INSTRUCTOR_MIN_PAYOUT_PENCE,
} from "../lib/commercial/commission";

function testCommissionCalculation() {
  assert.equal(calculateReferralCommissionAmount(699), Math.round(699 * INSTRUCTOR_COMMISSION_RATE));
  assert.equal(calculateReferralCommissionAmount(699), 105);
  assert.equal(calculateReferralCommissionAmount(0), 0);
  assert.equal(calculateReferralCommissionAmount(-100), 0);
}

function testMinimumPayoutThreshold() {
  const available = calculateReferralCommissionAmount(699) * 19;
  assert.ok(available < INSTRUCTOR_MIN_PAYOUT_PENCE);
  const enough = calculateReferralCommissionAmount(699) * 20;
  assert.ok(enough >= INSTRUCTOR_MIN_PAYOUT_PENCE);
}

testCommissionCalculation();
testMinimumPayoutThreshold();

console.log("Instructor commission logic tests passed.");
