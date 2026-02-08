# Command injection via subprocess
# Expected: DANGER or CRITICAL
# Description: Shell injection through subprocess with shell=True

import subprocess
user_cmd = input("Command: ")
subprocess.call(user_cmd, shell=True)  # CRITICAL: Shell injection
