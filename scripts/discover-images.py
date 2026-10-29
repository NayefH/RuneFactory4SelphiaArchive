"""Index only RF4-named images from the user-provided Ranch Story wiki."""

import subprocess
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
images = []
parameters = {
    "action": "query",
    "list": "allimages",
    "aiprefix": "RF4",
    "ailimit": "500",
    "format": "json",
}
while True:
    address = "https://ranchstory.miraheze.org/w/api.php?" + urllib.parse.urlencode(
        parameters
    )
    response = subprocess.check_output(
        ["curl.exe", "--noproxy", "*", "-L", "-s", "--max-time", "40", address]
    )
    result = json.loads(response)
    images.extend(result.get("query", {}).get("allimages", []))
    print("RF4 IMAGE INDEX", len(images), flush=True)
    if "continue" not in result:
        break
    parameters.update(result["continue"])
(ROOT / "data-sources/ranch-image-index.json").write_text(
    json.dumps(images, ensure_ascii=False), encoding="utf8"
)
print(
    "DESIGN",
    [
        image["name"]
        for image in images
        if any(
            word in image["name"].lower()
            for word in ["logo", "fullbody", "monster", "wooly"]
        )
    ][:50],
    flush=True,
)
