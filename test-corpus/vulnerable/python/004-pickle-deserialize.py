# Unsafe deserialization
# Expected: FAIL or DANGER
# Description: Unsafe pickle deserialization from untrusted input

import pickle
import sys
data = sys.stdin.read()
obj = pickle.loads(data)  # HIGH: Unsafe deserialization
