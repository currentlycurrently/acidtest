# Code injection via eval
# Expected: DANGER or CRITICAL
# Description: Arbitrary code execution through eval() with user input

code = input("Code: ")
result = eval(code)  # CRITICAL: Arbitrary code execution
