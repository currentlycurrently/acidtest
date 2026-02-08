// Function constructor abuse
// Expected: DANGER or CRITICAL
// Description: Arbitrary code execution through Function constructor

const code = process.argv[2];
const fn = new Function(code);  // CRITICAL: Arbitrary code execution
fn();
