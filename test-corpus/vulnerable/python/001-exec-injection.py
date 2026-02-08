# Command injection via exec
# Expected: DANGER or CRITICAL
# Description: Arbitrary code execution through exec() with user input

import os
user_input = input("Enter command: ")
exec(user_input)  # CRITICAL: Arbitrary code execution
