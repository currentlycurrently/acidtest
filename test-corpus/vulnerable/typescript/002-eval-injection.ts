// Code injection via eval
// Expected: DANGER or CRITICAL
// Description: Arbitrary code execution through eval() with user input

const code = process.argv[2];
eval(code);  // CRITICAL: Arbitrary code execution
