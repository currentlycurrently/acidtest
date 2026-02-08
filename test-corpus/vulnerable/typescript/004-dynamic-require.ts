// Dynamic require with user input
// Expected: WARN or FAIL
// Description: Dynamic module loading with user-controlled input

const moduleName = process.argv[2];
const mod = require(moduleName);  // MEDIUM: Dynamic require
