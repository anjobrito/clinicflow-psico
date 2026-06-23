import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "app/page.tsx",
  "app/AppRouteShell.tsx",
  "app/accessControl.ts",
  "app/clientSession.ts",
  "app/audit.ts",
  "app/ajb-admin/page.tsx",
  "app/documentos/page.tsx",
  "app/usuarios/page.tsx",
  "app/auditoria/page.tsx",
  "app/financeiro/page.tsx",
  "app/relatorios/page.tsx",
];

for (const file of requiredFiles) {
  await access(file);
}

const accessControl = await readFile("app/accessControl.ts", "utf8");
const clientSession = await readFile("app/clientSession.ts", "utf8");
const shell = await readFile("app/AppRouteShell.tsx", "utf8");
const admin = await readFile("app/ajb-admin/page.tsx", "utf8");
const documents = await readFile("app/documentos/page.tsx", "utf8");
const users = await readFile("app/usuarios/page.tsx", "utf8");

const assertions = [
  [accessControl.includes("PSICOLOGO"), "PSICOLOGO role is defined"],
  [accessControl.includes("SECRETARIA"), "SECRETARIA role is defined"],
  [accessControl.includes('"finance:read"'), "finance permission is defined"],
  [accessControl.includes('"documents:read"'), "documents permission is defined"],
  [clientSession.includes("BLOCKED") && clientSession.includes("CANCELED"), "blocked license statuses are defined"],
  [shell.includes("isLicenseAllowed"), "global license gate is enabled"],
  [shell.includes('/documentos') && shell.includes('/usuarios') && shell.includes('/auditoria'), "main navigation contains delivered modules"],
  [admin.includes("setStoredLicenseStatus"), "AJB admin controls the demo client license"],
  [documents.includes('can(role, "documents:read")'), "documents enforce role access"],
  [users.includes("appendAuditEntry"), "user management is audited"],
];

const failed = assertions.filter(([ok]) => !ok);
for (const [ok, message] of assertions) {
  console.log(`${ok ? "PASS" : "FAIL"} - ${message}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
  throw new Error(`${failed.length} smoke check(s) failed.`);
}

console.log(`PASS - ${requiredFiles.length} required application files found.`);
