"""Publish only the pool reading. Run inside Home Assistant using shell_command."""
import base64
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

URL = "https://api.github.com/repos/9dcb7zk84d-cell/pool/contents/data.json"

def make_reading(value, unit):
    try:
        number = float(value)
        if not math.isfinite(number):
            number = None
    except (ValueError, TypeError):
        number = None
    return {"temperature": number, "unit": "°F" if unit == "F" else "°C",
            "updated_at": datetime.now(timezone.utc).isoformat()}

def publish(reading):
    token = Path("/config/pool_github_token").read_text().strip()
    headers = {"Authorization": "Bearer " + token,
               "Accept": "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28",
               "User-Agent": "home-assistant-pool"}
    with urlopen(Request(URL + "?ref=main", headers=headers), timeout=15) as response:
        sha = json.load(response)["sha"]
    content = base64.b64encode((json.dumps(reading, allow_nan=False) + "\n").encode()).decode()
    body = json.dumps({"message": "Update pool reading", "content": content, "sha": sha, "branch": "main"}).encode()
    with urlopen(Request(URL, data=body, headers=headers, method="PUT"), timeout=15) as response:
        if response.status not in (200, 201):
            raise RuntimeError("Pool update failed")
    print("Pool reading published")

if __name__ == "__main__":
    publish(make_reading(sys.argv[1], sys.argv[2]))

