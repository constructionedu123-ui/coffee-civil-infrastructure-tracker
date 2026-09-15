"""
Full KPPIP budget enrichment in 2 phases:
 Phase 1: Crawl 15 sector pages to build name->detail_url mapping
 Phase 2: Fetch each detail URL and extract budget, patch GeoJSON + SQLite
"""
from __future__ import annotations
import json, re, sqlite3, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(".").resolve()))
from pipeline.normaliser import parse_budget

GEOJSON = Path("data/projects.geojson")
DB = Path("data/projects.sqlite")
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"}
KPPIP_BASE = "https://kppip.go.id"

BUDGET_LABELS = [
    "investasi total", "nilai investasi", "total investasi",
    "estimasi biaya", "biaya proyek", "investasi", "nilai proyek",
    "budget", "biaya", "anggaran",
]

PLACEHOLDER_VALS = {"-", "\u2013", "\u2014", "\u2192", ""}


def normalise_name(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def crawl_sector_page(url):
    """Return {normalised_name: detail_url} for a KPPIP sector index page."""
    mapping = {}
    try:
        r = requests.get(url, headers=HEADERS, timeout=12)
        if r.status_code != 200:
            return mapping
        soup = BeautifulSoup(r.text, "html.parser")
        for tbl in soup.find_all("table"):
            for tr in tbl.find_all("tr")[1:]:
                cells = tr.find_all(["td","th"])
                if len(cells) < 2:
                    continue
                name_cell = cells[1]
                a = name_cell.find("a", href=True)
                name_text = re.sub(r"^\d+[.)]\s*", "", name_cell.get_text(" ", strip=True)).strip()
                if a and len(name_text) >= 3:
                    href = a["href"]
                    if not href.startswith("http"):
                        href = urljoin(KPPIP_BASE, href)
                    if href.count("/") >= 6:  # is a detail page
                        mapping[normalise_name(name_text)] = href
    except Exception as e:
        print(f"  ERROR crawling {url}: {e}")
    return mapping


def fetch_budget(norm_key, url):
    """Fetch detail page, return (norm_key, budget_raw, budget_idr)."""
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return norm_key, None, None
        soup = BeautifulSoup(r.text, "html.parser")
        for tr in soup.find_all("tr"):
            cells = tr.find_all(["td","th"])
            if len(cells) >= 2:
                label = cells[0].get_text(strip=True).lower()
                if any(k in label for k in BUDGET_LABELS):
                    val = cells[-1].get_text(" ", strip=True).strip(": \t\r\n")
                    if val and val not in PLACEHOLDER_VALS:
                        parsed = parse_budget(val)
                        if parsed:
                            return norm_key, val, parsed
        txt = soup.get_text(" ", strip=True)
        m = re.search(r"Rp\.?\s*[\d.,]+\s*(?:Triliun|Miliar|T|M)\b", txt, re.I)
        if m:
            val = m.group(0).strip()
            parsed = parse_budget(val)
            if parsed:
                return norm_key, val, parsed
        return norm_key, None, None
    except Exception as e:
        print(f"  ERROR {url}: {e}")
        return norm_key, None, None


def main():
    with open(GEOJSON, encoding="utf-8") as f:
        gj = json.load(f)
    features = gj["features"]

    # Step 1: Fix existing wrong values
    print("=== Step 1: Re-parsing existing budget_raw values ===")
    for feat in features:
        p = feat["properties"]
        if p.get("budget_raw") and p.get("budget_idr") is not None:
            new_val = parse_budget(p["budget_raw"])
            if new_val and abs(new_val - p["budget_idr"]) > 0.5:
                print(f"  CORRECTING: {p['project_name'][:55]}: {p['budget_idr']:.3f} -> {new_val:.3f} T")
                p["budget_idr"] = new_val

    # Step 2: Collect sector pages to crawl
    sector_urls = set()
    null_budget_feats = []
    for feat in features:
        p = feat["properties"]
        if p.get("source_name") == "KPPIP" and p.get("budget_idr") is None:
            sector_urls.add(p.get("source_url", ""))
            null_budget_feats.append(feat)
    sector_urls.discard("")
    print(f"\n=== Step 2: Crawling {len(sector_urls)} sector pages to find detail URLs ===")

    name_to_detail = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(crawl_sector_page, u): u for u in sector_urls}
        for f in as_completed(futures):
            mapping = f.result()
            name_to_detail.update(mapping)
            print(f"  Sector page: {futures[f]} -> {len(mapping)} detail links")
    print(f"  Total detail URL mappings: {len(name_to_detail)}\n")

    # Step 3: Match features to detail URLs
    items = []
    feat_by_normkey = {}
    for feat in null_budget_feats:
        p = feat["properties"]
        nk = normalise_name(p["project_name"])
        # Try exact match first, then partial match
        detail_url = name_to_detail.get(nk)
        if not detail_url:
            # partial: find any key that starts with our name or vice versa
            for k, u in name_to_detail.items():
                if len(nk) >= 10 and (k.startswith(nk[:12]) or nk.startswith(k[:12])):
                    detail_url = u
                    break
        if detail_url:
            feat_by_normkey[nk] = feat
            items.append((nk, detail_url))

    print(f"=== Step 3: Fetching budgets for {len(items)} matched detail pages ===")

    updated = 0
    no_budget = 0
    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = {ex.submit(fetch_budget, nk, url): (nk, url) for nk, url in items}
        done = 0
        for f in as_completed(futures):
            nk, budget_raw, budget_idr = f.result()
            done += 1
            if budget_idr is not None and nk in feat_by_normkey:
                feat = feat_by_normkey[nk]
                feat["properties"]["budget_raw"] = budget_raw
                feat["properties"]["budget_idr"] = budget_idr
                # Also update source_url to the detail page
                feat["properties"]["source_url"] = items[[i[0] for i in items].index(nk)][1] if nk in [i[0] for i in items] else feat["properties"]["source_url"]
                updated += 1
                name = feat["properties"]["project_name"][:50]
                print(f"  [{done:3d}/{len(items)}] {budget_idr:8.3f} T  {name}  raw={budget_raw!r}")
            else:
                no_budget += 1
                if done % 30 == 0:
                    print(f"  [{done:3d}/{len(items)}] {updated} patched, {no_budget} no-budget")

    print(f"\nDone: {updated} budgets patched, {no_budget} still null.\n")

    # Write GeoJSON
    with open(GEOJSON, "w", encoding="utf-8") as f:
        json.dump(gj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"GeoJSON written: {GEOJSON}")

    # Patch SQLite
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    patched_db = 0
    for feat in features:
        p = feat["properties"]
        if p.get("project_id") and p.get("budget_idr") is not None:
            cur.execute("UPDATE projects SET budget_idr=?, budget_raw=? WHERE project_id=?",
                (p["budget_idr"], p.get("budget_raw"), p["project_id"]))
            if cur.rowcount > 0:
                patched_db += 1
    conn.commit(); conn.close()
    print(f"SQLite patched: {patched_db} rows.\n")

    n_with = sum(1 for f in features if f["properties"].get("budget_idr"))
    total = sum(f["properties"]["budget_idr"] for f in features if f["properties"].get("budget_idr"))
    print(f"FINAL: {n_with}/{len(features)} projects with CAPEX, Total = Rp {total:,.3f} Triliun")


if __name__ == "__main__":
    main()

