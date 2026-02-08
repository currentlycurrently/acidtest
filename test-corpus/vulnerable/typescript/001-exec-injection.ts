// Command injection via exec
// Expected: DANGER or CRITICAL
// Description: Arbitrary command execution through child_process.exec

import { exec } from 'child_process';
const userInput = process.argv[2];
exec(userInput);  // CRITICAL: Arbitrary command execution
