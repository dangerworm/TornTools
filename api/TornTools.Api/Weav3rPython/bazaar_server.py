"""
Persistent Weav3r bazaar fetcher server.

Protocol (line-delimited JSON over stdin/stdout):
  Request  → {"url": "...", "headers": {...}}
  Response ← {"ok": true,  "body": "..."}
           ← {"ok": false, "error": "..."}

One request at a time; the C# side serialises concurrent calls with a SemaphoreSlim.
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "libs"))

from curl_cffi import requests as cffi_requests
from curl_cffi.requests.exceptions import RequestException

# PYTHONUNBUFFERED=1 is set by the host, but be explicit about line-buffering.
sys.stdout.reconfigure(line_buffering=True)

while True:
    line = sys.stdin.readline()
    if not line:  # EOF - C# closed stdin, exit cleanly
        break

    line = line.strip()
    if not line:
        continue

    try:
        req = json.loads(line)
        url = req["url"]
        headers = req.get("headers", {})

        response = cffi_requests.get(url, headers=headers, impersonate="chrome124")
        response.raise_for_status()

        print(json.dumps({"ok": True, "body": response.text}), flush=True)
    except RequestException as e:
        print(json.dumps({"ok": False, "error": f"curl_cffi error: {e}"}), flush=True)
    except Exception as e:
        print(json.dumps({"ok": False, "error": f"Unexpected error: {e}"}), flush=True)
