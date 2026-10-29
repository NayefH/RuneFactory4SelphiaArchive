import hashlib, re, sys, urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
root = Path(__file__).resolve().parent.parent
dest = root / "public/fonts"
dest.mkdir(exist_ok=True)
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
css = (root / "data-sources/fonts.css").read_text(encoding="utf8")
for url in set(re.findall(r"url\((https://[^)]+)\)", css)):
    name = hashlib.sha256(url.encode()).hexdigest()[:16] + ".ttf"
    path = dest / name
    if not path.exists():
        with opener.open(url, timeout=30) as res:
            path.write_bytes(res.read())
    css = css.replace(url, "/fonts/" + name)
(dest / "fonts.css").write_text(css, encoding="utf8")
for family, folder in [("Alegreya", "alegreya"), ("Nunito Sans", "nunitosans")]:
    with opener.open(
        "https://raw.githubusercontent.com/google/fonts/main/ofl/"
        + folder
        + "/OFL.txt",
        timeout=30,
    ) as res:
        (dest / (folder + "-OFL.txt")).write_bytes(res.read())
p = root / "src/style.css"
s = p.read_text(encoding="utf8")
s = re.sub(r"@import url\('[^']+'\);", "@import url('/fonts/fonts.css');", s, count=1)
s = s.replace("Cormorant Garamond", "Alegreya").replace("DM Sans", "Nunito Sans")
p.write_text(s, encoding="utf8")
p = root / "src/attributes.css"
s = p.read_text(encoding="utf8").replace("Cormorant Garamond", "Alegreya")
p.write_text(s, encoding="utf8")
print("FONTS READY", len(list(dest.glob("*.ttf"))))
