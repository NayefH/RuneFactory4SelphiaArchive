"""Extract RF4 sections without accidentally importing another game's tables."""

import re
from bs4 import BeautifulSoup


def text(element):
    return re.sub(r"\s+", " ", element.get_text(" ", strip=True)).strip()


def rf4_section(document, categories=(), monster=False):
    heading = document.find(id="Rune_Factory_4") or document.find(id="Rune_Factory_4=")
    if not heading and monster:
        heading = document.find(id="Enemy")
    if not heading:
        rf4_category = any(category.endswith("(RF4)") for category in categories)
        other_game_heading = document.find(
            id=re.compile(r"^Rune_Factory_(?:[1235]|Frontier|6)")
        )
        if rf4_category and not other_game_heading:
            heading = document.find(id="Appearances")
    if not heading:
        return None
    heading = heading.find_parent(re.compile(r"^h[1-6]$"))
    if not heading:
        return None
    level = int(heading.name[1])
    section = BeautifulSoup("<section></section>", "html.parser").section
    for element in list(heading.next_siblings):
        if (
            getattr(element, "name", "")
            and re.match(r"^h[1-6]$", element.name)
            and int(element.name[1]) <= level
        ):
            break
        section.append(BeautifulSoup(str(element), "html.parser"))
    for element in section.select(".mw-editsection,.reference,.mw-collapsible-toggle"):
        element.decompose()
    return section


def parse_detail(seed, article):
    parsed = article["parse"]
    document = BeautifulSoup(parsed["text"]["*"], "html.parser")
    section = rf4_section(
        document,
        [entry["*"] for entry in parsed.get("categories", [])],
        seed["type"] == "monster",
    )
    if section is None:
        return None
    rows = []
    for row in section.find_all("tr"):
        cells = row.find_all(["th", "td"], recursive=False)
        if any(cell.find("table") for cell in cells):
            continue
        values = [text(cell) for cell in cells]
        if not any(values):
            continue
        rows.append(
            {
                "values": values,
                "headers": [cell.name == "th" for cell in cells],
                "links": [
                    [
                        {
                            "name": text(link),
                            "title": link.get("title"),
                            "href": link.get("href"),
                        }
                        for link in cell.find_all("a")
                        if link.get("href", "").startswith("/wiki/")
                        and "image" not in link.get("class", [])
                    ]
                    for cell in cells
                ],
            }
        )
    image = next(
        (
            image
            for image in section.find_all("img")
            if "icon" not in (image.get("alt", "") + image.get("data-src", "")).lower()
        ),
        None,
    )
    source = image.get("data-src") or image.get("src") if image else None
    return {
        **seed,
        "resolved": parsed["title"],
        "revision": parsed.get("revid"),
        "rows": rows,
        "image": source,
    }
