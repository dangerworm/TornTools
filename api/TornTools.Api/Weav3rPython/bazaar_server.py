"""
Persistent Weav3r bazaar fetcher server.

Protocol (line-delimited JSON over stdin/stdout):
  Request  → {"url": "...", "headers": {...}}
  Response ← {"ok": true,  "status": 200, "body": "..."}
           ← {"ok": false, "status": 429, "error": "...", "retry_after_seconds": 12.0}
           ← {"ok": false, "error": "..."}                       (transport failure, no status)

One request at a time; the C# side serialises concurrent calls with a SemaphoreSlim.
"""
import datetime
import json
import os
import sys
from email.utils import parsedate_to_datetime

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "libs"))

from curl_cffi import requests as cffi_requests
from curl_cffi.requests.exceptions import RequestException

# PYTHONUNBUFFERED=1 is set by the host, but be explicit about line-buffering.
sys.stdout.reconfigure(line_buffering=True)


def parse_retry_after(value):
    """RFC 7231: Retry-After is either delta-seconds or an HTTP-date."""
    if not value:
        return None
    value = value.strip()
    try:
        return max(0.0, float(value))
    except ValueError:
        pass
    try:
        when = parsedate_to_datetime(value)
        if when.tzinfo is None:
            when = when.replace(tzinfo=datetime.timezone.utc)
        delta = (when - datetime.datetime.now(datetime.timezone.utc)).total_seconds()
        return max(0.0, delta)
    except (TypeError, ValueError):
        return None


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

        try:
            response = cffi_requests.get(url, headers=headers, impersonate="chrome124")
        except RequestException as e:
            print(json.dumps({"ok": False, "error": f"curl_cffi error: {e}"}), flush=True)
            continue

        status = response.status_code
        if response.ok:
            print(json.dumps({"ok": True, "status": status, "body": response.text}), flush=True)
        else:
            retry_after = parse_retry_after(response.headers.get("Retry-After"))
            print(json.dumps({
                "ok": False,
                "status": status,
                "error": f"HTTP {status}",
                "retry_after_seconds": retry_after,
            }), flush=True)
    except Exception as e:
        print(json.dumps({"ok": False, "error": f"Unexpected error: {e}"}), flush=True)
