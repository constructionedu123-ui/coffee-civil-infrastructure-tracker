"""
Targeted KPPIP budget re-enrichment.
For each project in projects.geojson/sqlite with source_name=KPPIP and budget_idr=null,
fetches the detail page and patches budget_idr + budget_raw.
Also fixes any existing wrong values using the corrected parse_budget.

Run:  python pipeline/enrich_budgets.py
"""
from __future__ import annotations

import json
import re
import sqlite3
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).parent.parent))
from pipeline.normaliser import parse_budget

GEOJSON = Path("data/projects.geojson")
DB = Path("data/projects.sqlite")
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

BUDGET_LABELS = [
    "investasi total", "nilai investasi", "total investasi",
    "estimasi biaya", "biaya proyek", "investasi", "nilai proyek",
    "budget", "biaya", "anggaran",
]

PLACEHOLDER_VALS = {"-", "\u2013", "\u2014", "\u2192", ""}


def fetch_budget(project_id: str, url: str) -> tuple:
    """Fetch a KPPIP detail page and return (project_id, budget_raw, budget_idr)."""
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return project_id, None, None
        soup = BeautifulSoup(r.text, "html.parser")

        # Strategy 1: table rows (3-cell format: label | : | value)
        for tr in soup.find_all("tr"):
            cells = tr.find_all(["td", "th"])
            if len(cells) >= 2:
                label = cells[0].get_text(strip=True).lower()
                if any(k in label for k in BUDGET_LABELS):
                    val = cells[-1].get_text(" ", strip=True).strip(": \t\r\n")
                    if val and val not in PLACEHOLDER_VALS:
                        parsed = parse_budget(val)
                        if parsed:
                            return project_id, val, parsed

        # Strategy 2: grep full text for Rp amounts
        txt = soup.get_text(" ", strip=True)
        m = re.search(
            r"Rp\.?\s*[\d.,]+\s*(?:Triliun|Miliar|Trilion|Trillion|T|M)\b",
            txt,
            re.IGNORECASE,
        )
        if m:
            val = m.group(0).strip()
            parsed = parse_budget(val)
            if parsed:
                return project_id, val, parsed

        return project_id, None, None
    except Exception as e:
        print(f"  ERROR fetching {url}: {e}")
        return project_id, None, None


def main() -> None:
    with open(GEOJSON, encoding="utf-8") as f:
        gj = json.load(f)
    features = gj["features"]

    # Step 1: Fix existing wrong values using the corrected parser
    print("=== Step 1: Re-parsing existing budget_raw values ===")
    fixed_existing = 0
    for feat in features:
        p = feat["properties"]
        raw = p.get("budget_raw")
        existing = p.get("budget_idr")
        if raw and existing is not None:
            new_val = parse_budget(raw)
            if new_val and abs(new_val - existing) > 0.5:
                print(f"  CORRECTING: {p['project_name'][:55]}")
                print(f"    {existing:.3f} T  ->  {new_val:.3f} T  (raw={raw!r})")
                p["budget_idr"] = new_val
                fixed_existing += 1
    print(f"  Fixed {fixed_existing} existing wrong values.\n")

    # Step 2: Enrich projects with null budget
    needs_budget = []
    for feat in features:
        p = feat["properties"]
        if p.get("source_name") == "KPPIP" and p.get("budget_idr") is None:
            url = p.get("source_url", "")
            pid = p.get("project_id", "")
            if url and url.count("/") >= 7:
                needs_budget.append((pid, url, feat))

    print(f"=== Step 2: Enriching {len(needs_budget)} KPPIP projects with null budget ===")

    pid_to_feat = {pid: feat for pid, _, feat in needs_budget}
    items = [(pid, url) for pid, url, _ in needs_budget]

    updated = 0
    no_budget = 0

    with ThreadPoolExecutor(max_workers=10) as executor:
        future_map = {executor.submit(fetch_budget, pid, url): (pid, url) for pid, url in items}
        done = 0
        for future in as_completed(future_map):
            pid, budget_raw, budget_idr = future.result()
            done += 1
            if budget_idr is not None:
                feat = pid_to_feat[pid]
                feat["properties"]["budget_raw"] = budget_raw
                feat["properties"]["budget_idr"] = budget_idr
                updated += 1
                name = feat["properties"]["project_name"][:55]
                print(f"  [{done:3d}/{len(items)}] PATCHED: {budget_idr:8.3f} T  {name}  raw={budget_raw!r}")
            else:
                no_budget += 1
                if done % 25 == 0:
                    print(f"  [{done:3d}/{len(items)}] Progress: {updated} patched, {no_budget} no-budget")

    print(f"\nEnrichment complete: {updated} new budgets, {no_budget} still null.\n")

    # Step 3: Write updated GeoJSON
    with open(GEOJSON, "w", encoding="utf-8") as f:
        json.dump(gj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"GeoJSON written: {GEOJSON}")

    # Step 4: Patch SQLite
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    patched_db = 0
    for feat in features:
        p = feat["properties"]
        if p.get("project_id") and p.get("budget_idr") is not None:
            cur.execute(
                "UPDATE projects SET budget_idr=?, budget_raw=? WHERE project_id=?",
                (p["budget_idr"], p.get("budget_raw"), p["project_id"]),
            )
            if cur.rowcount > 0:
                patched_db += 1
    conn.commit()
    conn.close()
    print(f"SQLite patched: {patched_db} rows updated.\n")

    # Summary
    n_with = sum(1 for f in features if f["properties"].get("budget_idr"))
    total = sum(f["properties"]["budget_idr"] for f in features if f["properties"].get("budget_idr"))
    print("== Final Budget Summary ==========================")
    print(f"  Projects with CAPEX   : {n_with} / {len(features)}")
    print(f"  Total disclosed CAPEX : Rp {total:,.3f} Triliun")
    print("==================================================")


if __name__ == "__main__":
    main()
