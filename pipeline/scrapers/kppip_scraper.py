"""
pipeline/scrapers/kppip_scraper.py
------------------------------------
Scraper for KPPIP (kppip.go.id) National Strategic Project pages.

Strategy
--------
1. Fetch the PSN index page → parse all sector sub-page URLs.
2. For each sector page → parse project card links + derive sector slug.
3. For each project detail page → extract name, status, budget, contractor,
   location text.
4. Yield raw dicts (not yet geocoded).
"""
from __future__ import annotations

import logging
import re
from typing import Generator, Optional
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag

from pipeline.config import KPPIP_BASE, KPPIP_PSN_INDEX, KPPIP_SECTOR_CATEGORY
from pipeline.normaliser import extract_contractor_name, normalise_status, parse_budget, detect_category
from pipeline.scrapers.base_scraper import BaseScraper

log = logging.getLogger(__name__)

# ── Sector page slugs to crawl ────────────────────────────────────────────────
SECTOR_PAGES = [
    "/proyek-strategis-nasional/jalan-dan-jembatan/",
    "/proyek-strategis-nasional/kereta/",
    "/proyek-strategis-nasional/bandar-udara/",
    "/proyek-strategis-nasional/pelabuhan/",
    "/proyek-strategis-nasional/perumahan/",
    "/proyek-strategis-nasional/bendungan-dan-irigasi/",
    "/proyek-strategis-nasional/air-bersih-dan-sanitasi/",
    "/proyek-strategis-nasional/tanggul-pantai/",
    "/proyek-strategis-nasional/energi/",
    "/proyek-strategis-nasional/teknologi/",
    "/proyek-strategis-nasional/s-pembangunan-kawasan-industri-prioritas-kawasan-ekonomi-khusus/",
    "/proyek-strategis-nasional/pariwisata/",
    "/proyek-strategis-nasional/u-proyek-pembangunan-smelter/",
    "/proyek-strategis-nasional/x-program-pembangunan-infrastruktur-ketenagalistrikan/",
    "/proyek-strategis-nasional/w-infrastruktur-pendidikan/",
    "/proyek-strategis-nasional/z-sektor-pemerataan-ekonomi/",
]

# Also crawl the older "Proyek Prioritas" (featured) pages
PRIORITY_SECTOR_PAGES = [
    "/proyek-prioritas/jalan-jembatan/",
    "/proyek-prioritas/kereta-api/",
    "/proyek-prioritas/transportasi-perkotaan/",
    "/proyek-prioritas/air-dan-sanitasi/",
    "/proyek-prioritas/minyak-gas/",
    "/proyek-prioritas/ketenaga-listrikan/",
    "/proyek-prioritas/pelabuhan/",
    "/proyek-prioritas/teknologi-informasi/",
]


class KppipScraper(BaseScraper):
    """Scrapes KPPIP PSN (200+ projects) and Priority Project pages."""

    def scrape(self) -> Generator[dict, None, None]:
        """
        Main entry point. Yields raw project dicts for all PSN projects.
        Extracts from both the full PSN sector tables and individual detail pages.
        """
        from concurrent.futures import ThreadPoolExecutor, as_completed

        log.info("=== Starting Full PSN Ingestion across 16 Sectors ===")
        candidates: dict[str, dict] = {}  # key -> baseline record

        # 1. Crawl all PSN sector pages and extract all table rows
        for path in SECTOR_PAGES:
            sector_url = urljoin(KPPIP_BASE, path)
            sector_slug = self._slug_from_path(path)
            soup = self._soup(sector_url)
            if not soup:
                continue

            # Extract table rows
            for table in soup.find_all("table"):
                for tr in table.find_all("tr")[1:]:  # skip header
                    cells = tr.find_all(["td", "th"])
                    if len(cells) < 2:
                        continue

                    name_cell = cells[1]
                    a_tag = name_cell.find("a", href=True)
                    name_text = name_cell.get_text(" ", strip=True)
                    # Clean up 'No.' or leading numbers from name
                    name_clean = re.sub(r"^\d+[\.\)]\s*", "", name_text).strip()
                    if not name_clean or len(name_clean) < 3:
                        continue

                    loc_text = cells[2].get_text(" ", strip=True) if len(cells) >= 3 else ""
                    detail_url = urljoin(KPPIP_BASE, a_tag["href"]) if a_tag else sector_url

                    # Check if project contains detail link
                    has_detail_link = bool(a_tag and a_tag["href"].count("/") >= 5)

                    norm_key = re.sub(r"[^a-zA-Z0-9]+", "", name_clean.lower())
                    if norm_key not in candidates:
                        candidates[norm_key] = {
                            "project_name": name_clean,
                            "location_text": loc_text,
                            "sector_slug": sector_slug,
                            "detail_url": detail_url if has_detail_link else None,
                            "fallback_url": sector_url,
                        }

        # 2. Also crawl priority sector pages
        for path in PRIORITY_SECTOR_PAGES:
            sector_url = urljoin(KPPIP_BASE, path)
            sector_slug = self._slug_from_path(path)
            soup = self._soup(sector_url)
            if not soup:
                continue
            cards = soup.select("article.elementor-post, div.elementor-post__card, .post-card")
            for card in cards:
                a = card.find("a", href=True)
                title_tag = card.find(["h2", "h3", "h4", "a"])
                if a and title_tag:
                    p_name = title_tag.get_text(strip=True)
                    p_name = re.sub(r"^\d+[\.\)]\s*", "", p_name).strip()
                    p_url = urljoin(KPPIP_BASE, a["href"])
                    norm_key = re.sub(r"[^a-zA-Z0-9]+", "", p_name.lower())
                    if norm_key not in candidates and len(p_name) > 3:
                        candidates[norm_key] = {
                            "project_name": p_name,
                            "location_text": "",
                            "sector_slug": sector_slug,
                            "detail_url": p_url,
                            "fallback_url": p_url,
                        }

        log.info("Collected %d unique PSN candidates. Fetching detail pages...", len(candidates))

        # 3. Parallel fetch detail pages for enriched fields
        detail_items = [
            (key, info) for key, info in candidates.items() if info["detail_url"]
        ]

        import requests
        from bs4 import BeautifulSoup

        detail_session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(pool_connections=25, pool_maxsize=25, max_retries=0)
        detail_session.mount("https://", adapter)
        detail_session.mount("http://", adapter)
        detail_session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        })

        def _fetch_worker(item):
            key, info = item
            url = info["detail_url"]
            try:
                resp = detail_session.get(url, timeout=4)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    return key, soup
            except Exception:
                pass
            return key, None

        detail_soups: dict[str, BeautifulSoup] = {}
        with ThreadPoolExecutor(max_workers=16) as executor:
            future_to_item = {executor.submit(_fetch_worker, item): item for item in detail_items}
            for future in as_completed(future_to_item):
                k, s = future.result()
                if s:
                    detail_soups[k] = s

        detail_session.close()
        log.info("Fetched %d detail pages successfully.", len(detail_soups))

        # 4. Process all records (detail page if available, fallback to table data)
        for norm_key, info in candidates.items():
            soup = detail_soups.get(norm_key)
            name = info["project_name"]
            sector_slug = info["sector_slug"]
            url = info["detail_url"] if (soup and info["detail_url"]) else info["fallback_url"]

            if soup:
                record = self._parse_soup_to_record(soup, name, sector_slug, url, info["location_text"])
                if record:
                    yield record
                    continue

            # Fallback record from sector table
            category = detect_category(name, sector_slug)
            loc_text = info["location_text"]
            prov, reg = self._parse_location(loc_text or "", name)
            status = normalise_status(name)

            yield {
                "project_name": name,
                "category": category,
                "status": status,
                "budget_idr": None,
                "budget_raw": None,
                "funding_scheme": None,
                "pjpk": "Kementerian / Lembaga Terkait",
                "contractor": "BUMN Konstruksi / Swasta",
                "province": prov,
                "regency": reg,
                "location_text": loc_text or prov or "",
                "source_url": url,
                "source_name": "KPPIP",
            }

    # ── Internal helpers ─────────────────────────────────────────────────────

    @staticmethod
    def _slug_from_path(path: str) -> str:
        parts = [p for p in path.strip("/").split("/") if p]
        return parts[-1] if parts else ""

    def _parse_soup_to_record(
        self,
        soup: BeautifulSoup,
        fallback_name: str,
        sector_slug: str,
        url: str,
        fallback_loc: str = ""
    ) -> Optional[dict]:
        """Extract all fields from a parsed detail page."""
        name = self._extract_name(soup) or fallback_name
        full_text = soup.get_text(" ", strip=True)

        # Status
        status_raw = self._extract_field(soup, full_text, ["Status Terakhir", "Status", "Kondisi", "Fase", "Tahap"])
        status = normalise_status(status_raw or full_text)

        # Budget
        budget_raw = self._extract_field(
            soup, full_text,
            ["Investasi Total", "Nilai Investasi", "Investasi", "Nilai Proyek", "Budget", "Biaya", "Anggaran"]
        )
        if not budget_raw:
            m = re.search(r"Rp\.?\s*[\d.,]+\s*(?:triliun|miliar|milion|t|m)?", full_text, re.I)
            budget_raw = m.group(0) if m else None

        budget_idr = parse_budget(budget_raw)

        # Funding Scheme
        funding_scheme = self._extract_field(
            soup, full_text,
            ["Skema Pendanaan", "Skema", "Sumber Pembiayaan", "Pendanaan"]
        )

        # PJPK / Ministry
        pjpk = self._extract_field(
            soup, full_text,
            ["Penanggung Jawab Proyek", "PJPK", "Penanggung Jawab", "Kementerian Terkait", "Kementerian", "Pemrakarsa"]
        )

        # Contractor
        contractor_raw = self._extract_field(
            soup, full_text,
            ["Kontraktor", "Pelaksana", "BUJT", "Investor", "Badan Usaha"]
        )
        contractor = extract_contractor_name(contractor_raw or full_text)
        if not contractor and pjpk:
            contractor = pjpk

        # Location
        location_text = self._extract_field(
            soup, full_text,
            ["Lokasi", "Wilayah", "Provinsi", "Rute", "Daerah"]
        ) or fallback_loc

        province, regency = self._parse_location(location_text or "", name)
        if not location_text and province:
            location_text = province

        # Category
        category = detect_category(name, sector_slug)

        return {
            "project_name": name,
            "category": category,
            "status": status,
            "budget_idr": budget_idr,
            "budget_raw": budget_raw,
            "funding_scheme": funding_scheme,
            "pjpk": pjpk,
            "contractor": contractor,
            "province": province,
            "regency": regency,
            "location_text": location_text,
            "source_url": url,
            "source_name": "KPPIP",
        }


    # ── Field extraction helpers ──────────────────────────────────────────────

    @staticmethod
    def _extract_name(soup: BeautifulSoup) -> Optional[str]:
        """Try several selectors to find the project name."""
        for sel in ["h1.entry-title", "h1.elementor-heading-title", "h1", ".page-title"]:
            tag = soup.select_one(sel)
            if tag:
                text = tag.get_text(strip=True)
                if text:
                    return text
        # Fallback: <title> minus site name
        title_tag = soup.find("title")
        if title_tag:
            text = title_tag.get_text(strip=True)
            return re.sub(r"\s*[–|-]\s*KPPIP.*$", "", text, flags=re.I).strip()
        return None

    @staticmethod
    def _extract_field(
        soup: BeautifulSoup,
        full_text: str,
        labels: list[str],
    ) -> Optional[str]:
        """
        Look for labelled fields in:
        1. <table> rows (label | [optional :] | value)
        2. <dl>/<dt>/<dd> lists
        3. <strong>/<b>/<span>/<div> label followed by sibling/parent text
        4. Simple text proximity search
        """
        # Strategy 1: table rows (handles 2-cell and 3-cell [label, ':', value] rows)
        for row in soup.find_all("tr"):
            cells = row.find_all(["td", "th"])
            if len(cells) >= 2:
                for i, cell in enumerate(cells[:-1]):
                    cell_text = cell.get_text(strip=True).lower()
                    for label in labels:
                        if label.lower() in cell_text:
                            # Look for the first subsequent cell with actual content (not just ':')
                            for val_cell in cells[i + 1:]:
                                val = val_cell.get_text(" ", strip=True).strip(": \t\r\n")
                                if val:
                                    return val

        # Strategy 2: <dl> / <dt> / <dd>
        for dt in soup.find_all("dt"):
            dt_text = dt.get_text(strip=True).lower()
            for label in labels:
                if label.lower() in dt_text:
                    dd = dt.find_next_sibling("dd")
                    if dd:
                        val = dd.get_text(" ", strip=True).strip(": \t\r\n")
                        if val:
                            return val

        # Strategy 3: <strong> / <b> / <span> / <h*> labels
        for tag in soup.find_all(["strong", "b", "span", "div", "h4", "h5", "h6"]):
            tag_text = tag.get_text(strip=True)
            if not tag_text or len(tag_text) > 50:
                continue
            for label in labels:
                if label.lower() in tag_text.lower():
                    # Try next siblings
                    for sib in tag.next_siblings:
                        val = sib if isinstance(sib, str) else sib.get_text(" ", strip=True)
                        val = val.strip(": \t\r\n")
                        if val:
                            return val[:200]
                    # Try parent's text after tag
                    parent = tag.parent
                    if parent and len(parent.get_text(strip=True)) < 300:
                        after = parent.get_text(" ", strip=True).split(tag_text, 1)[-1].strip(": \t\r\n")
                        if after:
                            return after.split("\n")[0].strip()[:200]

        # Strategy 4: text proximity — find label in text, return next ~100 chars
        for label in labels:
            idx = full_text.lower().find(label.lower())
            if idx != -1:
                snippet = full_text[idx + len(label):idx + len(label) + 150].strip(": \t\r\n")
                if snippet:
                    first_line = snippet.split("\n")[0].strip(": \t\r\n")
                    if first_line:
                        return first_line

        return None

    @staticmethod
    def _parse_location(location_text: str, project_name: str = "") -> tuple[Optional[str], Optional[str]]:
        """
        Parse province and regency from location_text, falling back to project_name.
        Handles 'Nasional' / 'Lintas Provinsi' entries with central Indonesia scope.
        Returns (province, regency).
        """
        import re

        PROVINCE_PATTERNS = [
            ("DKI Jakarta", [r"\bdki jakarta\b", r"\bjakarta\b"]),
            ("Jawa Barat", [r"\bjawa barat\b", r"\bjabar\b", r"\bwest java\b"]),
            ("Jawa Tengah", [r"\bjawa tengah\b", r"\bjateng\b", r"\bcentral java\b"]),
            ("DI Yogyakarta", [r"\bdi yogyakarta\b", r"\bd\.i\. yogyakarta\b", r"\byogyakarta\b", r"\bjogja\b", r"\bdiy\b"]),
            ("Jawa Timur", [r"\bjawa timur\b", r"\bjatim\b", r"\beast java\b"]),
            ("Banten", [r"\bbanten\b"]),
            ("Aceh", [r"\baceh\b", r"\bnad\b", r"\bnanggroe aceh darussalam\b"]),
            ("Sumatera Utara", [r"\bsumatera utara\b", r"\bsumut\b", r"\bnorth sumatra\b"]),
            ("Sumatera Barat", [r"\bsumatera barat\b", r"\bsumbar\b", r"\bwest sumatra\b"]),
            ("Riau", [r"\briau\b"]),
            ("Kepulauan Riau", [r"\bkepulauan riau\b", r"\bkepri\b"]),
            ("Jambi", [r"\bjambi\b"]),
            ("Sumatera Selatan", [r"\bsumatera selatan\b", r"\bsumsel\b", r"\bsouth sumatra\b"]),
            ("Bangka Belitung", [r"\bbangka belitung\b", r"\bkepulauan bangka belitung\b", r"\bbabel\b"]),
            ("Bengkulu", [r"\bbengkulu\b"]),
            ("Lampung", [r"\blampung\b"]),
            ("Bali", [r"\bbali\b"]),
            ("Nusa Tenggara Barat", [r"\bnusa tenggara barat\b", r"\bntb\b"]),
            ("Nusa Tenggara Timur", [r"\bnusa tenggara timur\b", r"\bntt\b"]),
            ("Kalimantan Barat", [r"\bkalimantan barat\b", r"\bkalbar\b", r"\bwest kalimantan\b"]),
            ("Kalimantan Tengah", [r"\bkalimantan tengah\b", r"\bkalteng\b", r"\bcentral kalimantan\b"]),
            ("Kalimantan Selatan", [r"\bkalimantan selatan\b", r"\bkalsel\b", r"\bsouth kalimantan\b"]),
            ("Kalimantan Timur", [r"\bkalimantan timur\b", r"\bkaltim\b", r"\beast kalimantan\b"]),
            ("Kalimantan Utara", [r"\bkalimantan utara\b", r"\bkaltara\b", r"\bnorth kalimantan\b"]),
            ("Sulawesi Utara", [r"\bsulawesi utara\b", r"\bsulut\b", r"\bnorth sulawesi\b"]),
            ("Sulawesi Tengah", [r"\bsulawesi tengah\b", r"\bsulteng\b", r"\bcentral sulawesi\b"]),
            ("Sulawesi Selatan", [r"\bsulawesi selatan\b", r"\bsulsel\b", r"\bsouth sulawesi\b"]),
            ("Sulawesi Tenggara", [r"\bsulawesi tenggara\b", r"\bsultra\b", r"\bsoutheast sulawesi\b"]),
            ("Gorontalo", [r"\bgorontalo\b"]),
            ("Sulawesi Barat", [r"\bsulawesi barat\b", r"\bsulbar\b", r"\bwest sulawesi\b"]),
            ("Maluku", [r"\bmaluku\b"]),
            ("Maluku Utara", [r"\bmaluku utara\b", r"\bmalut\b", r"\bnorth maluku\b"]),
            ("Papua", [r"\bpapua\b"]),
            ("Papua Barat", [r"\bpapua barat\b", r"\bwest papua\b"]),
            ("Papua Selatan", [r"\bpapua selatan\b"]),
            ("Papua Tengah", [r"\bpapua tengah\b"]),
            ("Papua Pegunungan", [r"\bpapua pegunungan\b"]),
            ("Papua Barat Daya", [r"\bpapua barat daya\b"]),
        ]

        CITY_TO_PROVINCE = {
            "balikpapan": "Kalimantan Timur", "samarinda": "Kalimantan Timur", "bontang": "Kalimantan Timur",
            "makassar": "Sulawesi Selatan", "parepare": "Sulawesi Selatan", "pare-pare": "Sulawesi Selatan",
            "medan": "Sumatera Utara", "binjai": "Sumatera Utara", "kuala tanjung": "Sumatera Utara",
            "pekanbaru": "Riau", "dumai": "Riau", "kandis": "Riau",
            "probolinggo": "Jawa Timur", "banyuwangi": "Jawa Timur", "tuban": "Jawa Timur", "jambaran": "Jawa Timur",
            "serang": "Banten", "panimbang": "Banten", "cilegon": "Banten",
            "bawen": "Jawa Tengah", "semarang": "Jawa Tengah", "batang": "Jawa Tengah",
            "palembang": "Sumatera Selatan",
            "indramayu": "Jawa Barat", "patimban": "Jawa Barat", "jatiluhur": "Jawa Barat",
            "cikarang": "Jawa Barat", "bekasi": "Jawa Barat", "bogor": "Jawa Barat", "depok": "Jawa Barat",
            "bitung": "Sulawesi Utara", "manado": "Sulawesi Utara",
            "masela": "Maluku", "tangguh": "Papua Barat",
            "shia": "Banten",
        }

        loc_lower = (location_text or "").lower()
        name_lower = (project_name or "").lower()

        # 1. Check for 'Nasional' / 'Lintas Provinsi' in location_text
        national_kw = ["nasional", "lintas provinsi", "lintas-provinsi", "lintas pulau", "seluruh indonesia", "multi provinsi"]
        for kw in national_kw:
            if kw in loc_lower:
                return "Nasional" if "nasional" in loc_lower else "Lintas Provinsi", None

        # 2. Check provinces in location_text
        matches = []
        for prov, pats in PROVINCE_PATTERNS:
            for p in pats:
                if re.search(p, loc_lower):
                    matches.append(prov)
                    break
        if len(matches) > 1:
            return "Lintas Provinsi", None
        elif len(matches) == 1:
            matched_regency = None
            for city, prov in CITY_TO_PROVINCE.items():
                if city in loc_lower:
                    matched_regency = city.title()
                    break
            return matches[0], matched_regency

        # 3. Check city/regency in location_text
        for city, prov in CITY_TO_PROVINCE.items():
            if city in loc_lower:
                return prov, city.title()

        # 4. Fallback: match from project_name
        for kw in national_kw + ["trans sumatera", "hvdc"]:
            if kw in name_lower:
                return "Lintas Provinsi" if ("trans sumatera" in name_lower or "lintas" in name_lower) else "Nasional", None

        name_matches = []
        for prov, pats in PROVINCE_PATTERNS:
            for p in pats:
                if re.search(p, name_lower):
                    name_matches.append(prov)
                    break
        if len(name_matches) > 1:
            return "Lintas Provinsi", None
        elif len(name_matches) == 1:
            return name_matches[0], None

        for city, prov in CITY_TO_PROVINCE.items():
            if city in name_lower:
                return prov, city.title()

        return None, None

