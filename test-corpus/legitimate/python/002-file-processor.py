# Legitimate file processor - should PASS
# Expected: PASS or WARN (acceptable)
# Description: Safe file processing with JSON

import json
import sys

def process_file(filepath):
    with open(filepath, 'r') as f:
        data = json.load(f)
    return data

if __name__ == '__main__':
    result = process_file(sys.argv[1])
    print(result)
