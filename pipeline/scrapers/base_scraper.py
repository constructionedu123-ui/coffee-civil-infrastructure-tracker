"""
pipeline/scrapers/base_scraper.py
----------------------------------
Shared HTTP session with polite rate limiting, retry with exponential back-off,
and User-Agent rotation.
"""
from __future__ import annotations

import logging
import random
import time
from typing import Optional

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from pipeline.config import (
    MAX_RETRIES,
    REQUEST_DELAY_SEC,
    REQUEST_TIMEOUT_SEC,
    RETRY_BACKOFF,
    USER_AGENTS,
)

log = logging.getLogger(__name__)


def _build_session() -> requests.Session:
    """Return a requests.Session pre-configured with retry logic."""
    session = requests.Session()
    retry = Retry(
        total=MAX_RETRIES,
        backoff_factor=RETRY_BACKOFF,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


class BaseScraper:
    """Abstract base class for site-specific scrapers."""

    def __init__(self) -> None:
        self._session = _build_session()
        self._last_request_time: float = 0.0

    # ── HTTP helpers ─────────────────────────────────────────────────────────

    def _get(self, url: str, params: Optional[dict] = None) -> Optional[requests.Response]:
        """GET with rate limiting and UA rotation. Returns None on failure."""
        # enforce polite delay
        elapsed = time.monotonic() - self._last_request_time
        if elapsed < REQUEST_DELAY_SEC:
            time.sleep(REQUEST_DELAY_SEC - elapsed)

        self._session.headers.update({"User-Agent": random.choice(USER_AGENTS)})
        try:
            resp = self._session.get(
                url, params=params, timeout=REQUEST_TIMEOUT_SEC, allow_redirects=True
            )
            self._last_request_time = time.monotonic()
            if resp.status_code != 200:
                log.warning("HTTP %s for %s", resp.status_code, url)
                return None
            return resp
        except requests.RequestException as exc:
            log.error("Request failed for %s: %s", url, exc)
            return None

    def _soup(self, url: str, params: Optional[dict] = None) -> Optional[BeautifulSoup]:
        """GET and parse as BeautifulSoup (lxml). Returns None on failure."""
        resp = self._get(url, params=params)
        if resp is None:
            return None
        return BeautifulSoup(resp.text, "lxml")

    def close(self) -> None:
        self._session.close()

    def __enter__(self) -> "BaseScraper":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
