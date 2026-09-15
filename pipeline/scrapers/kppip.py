"""
pipeline/scrapers/kppip.py
--------------------------
Alias module re-exporting everything from kppip_scraper.py.
"""
from pipeline.scrapers.kppip_scraper import *  # noqa: F401, F403
from pipeline.scrapers.kppip_scraper import KppipScraper

__all__ = ["KppipScraper"]
