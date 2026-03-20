import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "libs"))

from curl_cffi import requests
from curl_cffi.requests.exceptions import RequestsError

headers = json.loads(os.environ.get("FETCH_HEADERS", "{}"))
url = sys.argv[1]

try:
    response = requests.get(url, headers=headers, impersonate="chrome124")
    response.raise_for_status()
    print(response.text, end="")
except RequestsError as e:
    print(f"curl_cffi error: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"Unexpected error: {e}", file=sys.stderr)
    sys.exit(1)
