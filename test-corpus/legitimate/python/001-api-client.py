# Legitimate API client - should PASS
# Expected: PASS or WARN (acceptable)
# Description: Safe API usage with environment variables

import requests
import os

API_KEY = os.environ.get('API_KEY', '')
response = requests.get('https://api.example.com/data',
                       headers={'Authorization': f'Bearer {API_KEY}'})
print(response.json())
