require("ts-node/register/transpile-only");

const { ROLE_HOME, canAccess } = require("../src/lib/rbac.ts");

console.log("ROLE_HOME:", ROLE_HOME);
console.log("APPLICANT -> /applicant:", canAccess("/applicant/dashboard", "APPLICANT"));
console.log("APPLICANT -> /bplo:", canAccess("/bplo/dashboard", "APPLICANT"));
console.log("SUPER_ADMIN -> /superadmin:", canAccess("/superadmin/dashboard", "SUPER_ADMIN"));
console.log("SUPER_ADMIN -> /bplo:", canAccess("/bplo/dashboard", "SUPER_ADMIN"));
