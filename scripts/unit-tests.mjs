import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const resetSource = await readFile("app/demoReset.ts", "utf8");
const resetPage = await readFile("app/reset/page.tsx", "utf8");
const shell = await readFile("app/AppRouteShell.tsx", "utf8");
const accessControl = await readFile("app/accessControl.ts", "utf8");

const expectedKeys = [
  "clinicflow-psico-mvp-state-v1",
  "clinicflow-psico-payments-v1",
  "clinicflow-psico-documents-v1",
  "clinicflow-psico-users-v1",
  "clinicflow-psico-audit-v1",
  "clinicflow-psico-clinics-v1",
  "clinicflow-psico-active-clinic-v1",
  "clinicflow-psico-client-role",
  "clinicflow-psico-license-status",
];

for (const key of expectedKeys) {
  assert.ok(resetSource.includes(key), `Reset utility must cover ${key}`);
}

assert.equal(new Set(expectedKeys).size, expectedKeys.length, "Reset keys must be unique");
assert.ok(resetSource.includes("resetDemoEnvironment"), "Reset function must be exported");
assert.ok(resetSource.includes("localStorage.removeItem"), "Reset must remove localStorage keys");
assert.ok(resetSource.includes("clinicflow-license-change"), "Reset must notify license consumers");
assert.ok(resetSource.includes("clinicflow-clinics-change"), "Reset must notify clinic consumers");
assert.ok(resetPage.includes("RESETAR"), "Reset page must require explicit confirmation");
assert.ok(shell.includes('pathname.startsWith("/reset")'), "Reset route must bypass license gate");
assert.ok(shell.includes('href: "/reset"'), "Reset route must be visible in navigation");
assert.ok(accessControl.includes("SECRETARIA"), "Secretary role must stay in the permission matrix");
assert.ok(!accessControl.match(/SECRETARIA:[\s\S]*finance:read/), "Secretary must not receive finance access");
assert.ok(!accessControl.match(/SECRETARIA:[\s\S]*documents:read/), "Secretary must not receive document access");

console.log("PASS - unit checks for reset, license gate and access matrix");
