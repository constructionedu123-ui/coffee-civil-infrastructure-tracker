"""
pipeline/scrapers/bpjt_scraper.py
-----------------------------------
Scraper for BPJT (bpjt.pu.go.id) toll road data.

Strategy
--------
Primary:  parse HTML tables from bpjt.pu.go.id/informasi/jalan-tol/
          using pandas.read_html() with BeautifulSoup fallback.
Secondary: scrape the first N news/press-release pages for construction
          progress percentages (optional enrichment).
"""
from __future__ import annotations

import logging
import re
from typing import Generator, Optional

import pandas as pd
from bs4 import BeautifulSoup

from pipeline.config import BPJT_JALAN_TOL_URL, BPJT_MAX_NEWS_PAGES, BPJT_NEWS_URL
from pipeline.normaliser import extract_contractor_name, normalise_status
from pipeline.scrapers.base_scraper import BaseScraper

log = logging.getLogger(__name__)

# Expected column name fragments (case-insensitive)
_NAME_COLS = ["nama", "ruas", "jalan tol", "tol"]
_OPERATOR_COLS = ["operator", "bujt", "pengelola", "perusahaan"]
_PROVINCE_COLS = ["provinsi", "wilayah", "lokasi"]
_STATUS_COLS = ["status", "kondisi", "keterangan"]
_LENGTH_COLS = ["panjang", "km", "length"]


class BpjtScraper(BaseScraper):
    """Scrapes BPJT toll road data from HTML tables and news pages."""

    def scrape(self) -> Generator[dict, None, None]:
        """Yield raw project dicts for each toll road record found."""
        # Primary: toll road table page
        yield from self._scrape_toll_table()

    # ── Toll road table ───────────────────────────────────────────────────────

    def _scrape_toll_table(self) -> Generator[dict, None, None]:
        resp = self._get(BPJT_JALAN_TOL_URL)
        if resp is None:
            log.error("Could not fetch BPJT jalan-tol page")
            return

        html = resp.text

        # Try pandas first (handles colspan/rowspan gracefully)
        records = self._parse_with_pandas(html)
        if not records:
            log.info("pandas.read_html failed or empty; falling back to BeautifulSoup")
            soup = BeautifulSoup(html, "lxml")
            records = self._parse_with_bs4(soup)

        log.info("BPJT: found %d raw records", len(records))
        for rec in records:
            yield rec

    def _parse_with_pandas(self, html: str) -> list[dict]:
        """Attempt table extraction with pandas."""
        try:
            tables = pd.read_html(html, flavor="lxml")
        except Exception as exc:
            log.debug("pandas.read_html error: %s", exc)
            return []

        results: list[dict] = []
        for df in tables:
            df.columns = [str(c).strip().lower() for c in df.columns]
            name_col = _find_col(df.columns.tolist(), _NAME_COLS)
            if name_col is None:
                continue  # not the toll road table

            operator_col = _find_col(df.columns.tolist(), _OPERATOR_COLS)
            province_col = _find_col(df.columns.tolist(), _PROVINCE_COLS)
            status_col = _find_col(df.columns.tolist(), _STATUS_COLS)
            length_col = _find_col(df.columns.tolist(), _LENGTH_COLS)

            for _, row in df.iterrows():
                name = str(row.get(name_col, "")).strip()
                if not name or name.lower() in ("nan", "no", "no.", "#"):
                    continue

                operator = str(row.get(operator_col, "")) if operator_col else ""
                province = str(row.get(province_col, "")) if province_col else ""
                status_raw = str(row.get(status_col, "")) if status_col else ""
                length_raw = str(row.get(length_col, "")) if length_col else ""

                results.append(
                    self._build_record(name, operator, province, status_raw, length_raw)
                )

        return results

    def _parse_with_bs4(self, soup: BeautifulSoup) -> list[dict]:
        """Fallback: manually traverse <table> elements."""
        results: list[dict] = []
        for table in soup.find_all("table"):
            headers = [
                th.get_text(strip=True).lower()
                for th in table.find_all(["th"])
            ]
            if not headers:
                # Try first <tr> as header
                first_row = table.find("tr")
                if first_row:
                    headers = [
                        td.get_text(strip=True).lower()
                        for td in first_row.find_all(["td", "th"])
                    ]

            name_idx = _find_idx(headers, _NAME_COLS)
            if name_idx is None:
                continue

            operator_idx = _find_idx(headers, _OPERATOR_COLS)
            province_idx = _find_idx(headers, _PROVINCE_COLS)
            status_idx = _find_idx(headers, _STATUS_COLS)
            length_idx = _find_idx(headers, _LENGTH_COLS)

            for row in table.find_all("tr")[1:]:  # skip header
                cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
                if len(cells) <= name_idx:
                    continue

                name = cells[name_idx].strip()
                if not name:
                    continue

                operator = cells[operator_idx] if operator_idx is not None and operator_idx < len(cells) else ""
                province = cells[province_idx] if province_idx is not None and province_idx < len(cells) else ""
                status_raw = cells[status_idx] if status_idx is not None and status_idx < len(cells) else ""
                length_raw = cells[length_idx] if length_idx is not None and length_idx < len(cells) else ""

                results.append(
                    self._build_record(name, operator, province, status_raw, length_raw)
                )

        return results

    @staticmethod
    def _build_record(
        name: str,
        operator: str,
        province: str,
        status_raw: str,
        length_raw: str,
    ) -> dict:
        status = normalise_status(status_raw)
        if status == "Unknown" and ("operasi" in name.lower() or "beroperasi" in status_raw.lower()):
            status = "Operational"

        contractor = extract_contractor_name(operator)

        # Clean province
        prov = province.strip() if province and province.lower() not in ("nan", "") else None

        return {
            "project_name": f"Jalan Tol {name}" if not name.lower().startswith("jalan tol") else name,
            "category": "Transport",
            "status": status,
            "budget_idr": None,     # BPJT tables don't publish investment values
            "budget_raw": None,
            "contractor": contractor or (operator.strip() if operator.strip() not in ("nan", "") else None),
            "province": prov,
            "regency": None,
            "location_text": prov or name,
            "source_url": BPJT_JALAN_TOL_URL,
            "source_name": "BPJT",
            "length_km": _parse_length(length_raw),
        }


# ── Column-matching utilities ─────────────────────────────────────────────────

def _find_col(columns: list[str], candidates: list[str]) -> Optional[str]:
    for col in columns:
        for cand in candidates:
            if cand in col:
                return col
    return None


def _find_idx(headers: list[str], candidates: list[str]) -> Optional[int]:
    for i, h in enumerate(headers):
        for cand in candidates:
            if cand in h:
                return i
    return None


def _parse_length(text: str) -> Optional[float]:
    """Extract a kilometre value from a length string like '77,4 km'."""
    m = re.search(r"([\d.,]+)", text.replace(",", "."))
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    return None
