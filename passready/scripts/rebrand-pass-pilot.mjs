/**
 * One-off UI rebrand: Test Ready Score → Pass Pilot (excludes readiness band labels).
 * Run: node scripts/rebrand-pass-pilot.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const skipDirs = new Set(["node_modules", ".next", ".git", "scripts/test-report-reasoning.ts"]);

const replacements = [
  ["Get My Test Ready Score", "Get My Pass Pilot Score"],
  ["Get Your Test Ready Score", "Get Your Pass Pilot Score"],
  ["Update My Test Ready Score", "Update My Pass Pilot Score"],
  ["Get Another Test Ready Score", "Get Another Pass Pilot Score"],
  ["View My Test Ready Score History", "View My Pass Pilot History"],
  ["Invite Pupil to Get Their Test Ready Score", "Invite Pupil to Get Their Pass Pilot Score"],
  ["Help Your Learner Get Their Test Ready Score", "Help Your Learner Get Their Pass Pilot Score"],
  ["Send Test Ready Score Invite", "Pass Pilot Score Invite"],
  ["View Test Ready Score", "View My Pass Pilot Score"],
  ["Start Assessment", "Get My Pass Pilot Score"],
  ["Sample Premium Test Ready Score Report", "Sample Premium Pass Pilot Report"],
  ["Sample Premium Test Ready Score report", "Sample Premium Pass Pilot Report"],
  ["Premium Test Ready Score report", "Premium Pass Pilot Report"],
  ["Your Premium Test Ready Score report", "Your Premium Pass Pilot Report"],
  ["Your Test Ready Score report", "Your Pass Pilot Report"],
  ["Saved Premium Test Ready Score report", "Saved Premium Pass Pilot Report"],
  ["Preparing your Premium Test Ready Score report", "Preparing your Premium Pass Pilot Report"],
  ["Unlimited Premium Test Ready Score reports", "Unlimited Premium Pass Pilot Reports"],
  ["Test Ready Score History", "Pass Pilot History"],
  ["Test Ready Score Report", "Pass Pilot Report"],
  ["Test Ready Score report", "Pass Pilot Report"],
  ["Test Ready Score Snapshot", "Pass Pilot Snapshot"],
  ["Test Ready Score Dashboard", "Pass Pilot Dashboard"],
  ["Test Ready Score dashboard", "Pass Pilot dashboard"],
  ["Test Ready Score Reports", "Pass Pilot Reports"],
  ["Test Ready Score reports", "Pass Pilot reports"],
  ["Test Ready Score assessments", "Pass Pilot assessments"],
  ["Test Ready Score account", "Pass Pilot account"],
  ["Test Ready Score trends", "Pass Pilot trends"],
  ["Test Ready Scores", "Pass Pilot Scores"],
  ["Test Ready scores", "Pass Pilot scores"],
  ["Your Test Ready Score", "Your Pass Pilot Score"],
  ["your Test Ready Score", "your Pass Pilot Score"],
  ["Get your Test Ready Score", "Get your Pass Pilot Score"],
  ["Get your first Test Ready Score", "Get your first Pass Pilot Score"],
  ["Get an updated Test Ready Score", "Get an updated Pass Pilot Score"],
  ["Run a fresh Test Ready Score", "Run a fresh Pass Pilot Score"],
  ["Latest Test Ready Score", "Latest Pass Pilot Score"],
  ["latest Test Ready Score", "latest Pass Pilot Score"],
  ["Complete the Test Ready Score once", "Complete the Pass Pilot Score once"],
  ["Unlock your Test Ready Score", "Unlock your Pass Pilot Score"],
  ["Save your full Test Ready Score report", "Save your full Pass Pilot Report"],
  ["Unlock your full Test Ready Score report", "Unlock your full Pass Pilot Report"],
  ["generate your Test Ready Score report", "generate your Pass Pilot Report"],
  ["Example Test Ready Score report preview", "Example Pass Pilot Report preview"],
  ["Test Ready Score progress", "Pass Pilot Score progress"],
  ["Test Ready Score write-ups", "Pass Pilot Report write-ups"],
  ["Why learners use Test Ready Score", "Why learners use Pass Pilot"],
  ["Welcome to Test Ready Score", "Welcome to Pass Pilot"],
  ["Prep2Pass · Test Ready Score", "Prep2Pass · Pass Pilot"],
  ["Test ready score · Instructor", "Pass Pilot · Instructor"],
  ["Test ready score", "Pass Pilot"],
  ["Test Ready Score by Prep2Pass", "Pass Pilot"],
  ["Test Ready Score:", "Pass Pilot:"],
  ["Test Ready Score is", "Pass Pilot is"],
  ["Test Ready Score helps", "Pass Pilot helps"],
  ["Test Ready Score gives", "Pass Pilot gives"],
  ["Test Ready Score supports", "Pass Pilot supports"],
  ["Test Ready Score is built", "Pass Pilot is built"],
  ["Test Ready Score is produced", "Pass Pilot is produced"],
  ["Test Ready Score is created", "Pass Pilot is created"],
  ["Test Ready Score is coaching", "Pass Pilot is coaching"],
  ["Test Ready Score is independent", "Pass Pilot is independent"],
  ["about Test Ready Score", "about Pass Pilot"],
  ["Explore Test Ready Score", "Explore Pass Pilot"],
  ["Sign in · Test Ready Score", "Sign in · Pass Pilot"],
  ["FAQ · Test Ready Score", "FAQ · Pass Pilot"],
  ["About · Test Ready Score", "About · Pass Pilot"],
  ["Pricing · Test Ready Score", "Pricing · Pass Pilot"],
  ["Subscribe · Test Ready Score", "Subscribe · Pass Pilot"],
  ["Graduate Mode · Test Ready Score", "Graduate Mode · Pass Pilot"],
  ["Subscription active · Test Ready Score", "Subscription active · Pass Pilot"],
  ["Parent & Supervisor Dashboard · Test Ready Score", "Parent & Supervisor Dashboard · Pass Pilot"],
  ["Detailed breakdown", "Detailed Pass Pilot Breakdown"],
  ["Journey insights", "Pass Pilot Journey Insights"],
  ["they use Test Ready Score", "they use Pass Pilot"],
  ["Test Ready Score,", "Pass Pilot,"],
  ["Test Ready Score", "Pass Pilot Score"],
];

const productOnlyFixes = [
  ["Pass Pilot Score is independent", "Pass Pilot is independent"],
  ["Pass Pilot Score is produced", "Pass Pilot is produced"],
  ["Pass Pilot Score is built", "Pass Pilot is built"],
  ["Pass Pilot Score is created", "Pass Pilot is created"],
  ["Pass Pilot Score is coaching", "Pass Pilot is coaching"],
  ["Pass Pilot Score helps", "Pass Pilot helps"],
  ["Pass Pilot Score gives", "Pass Pilot gives"],
  ["Pass Pilot Score supports", "Pass Pilot supports"],
  ["Pass Pilot Score account", "Pass Pilot account"],
  ["Pass Pilot Score assessments", "Pass Pilot assessments"],
  ["Pass Pilot Score trends", "Pass Pilot trends"],
  ["Welcome to Pass Pilot Score", "Welcome to Pass Pilot"],
  ["Why learners use Pass Pilot Score", "Why learners use Pass Pilot"],
  ["about Pass Pilot Score", "about Pass Pilot"],
  ["Explore Pass Pilot Score", "Explore Pass Pilot"],
  ["they use Pass Pilot Score", "they use Pass Pilot"],
  ["Sign in · Pass Pilot Score", "Sign in · Pass Pilot"],
  ["FAQ · Pass Pilot Score", "FAQ · Pass Pilot"],
  ["About · Pass Pilot Score", "About · Pass Pilot"],
  ["Pricing · Pass Pilot Score", "Pricing · Pass Pilot"],
  ["Subscribe · Pass Pilot Score", "Subscribe · Pass Pilot"],
  ["Graduate Mode · Pass Pilot Score", "Graduate Mode · Pass Pilot"],
  ["Subscription active · Pass Pilot Score", "Subscription active · Pass Pilot"],
  ["Parent & Supervisor Dashboard · Pass Pilot Score", "Parent & Supervisor Dashboard · Pass Pilot"],
  ["Pass Pilot Score by Prep2Pass", "Pass Pilot"],
  ["Pass Pilot Score:", "Pass Pilot:"],
  ["Pass Pilot Score,", "Pass Pilot,"],
  ["${SITE.name}: your Pass Pilot Score home", "${SITE.name}: your Pass Pilot home"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|md|json|html)$/.test(entry.name) && !entry.name.includes("rebrand-pass-pilot")) files.push(full);
  }
  return files;
}

function applyReplacements(text) {
  let out = text;
  for (const [from, to] of replacements) {
    out = out.split(from).join(to);
  }
  for (const [from, to] of productOnlyFixes) {
    out = out.split(from).join(to);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  if (file.endsWith("lib/constants.ts")) continue;
  const original = fs.readFileSync(file, "utf8");
  const updated = applyReplacements(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    changed++;
    console.log("updated:", path.relative(root, file));
  }
}

console.log(`Done. ${changed} files updated.`);
