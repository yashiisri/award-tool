"""Quick smoke test — run all scrapers and show top candidates."""
import asyncio, sys, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.INFO, format='%(levelname)-8s %(message)s')

from services.source_scrapers import scrape_all_sources

async def main():
    candidates = await scrape_all_sources()
    print(f"\nTop 20 candidates (sorted by source count):")
    for i, c in enumerate(candidates[:20], 1):
        print(f"  {i:2}. {c['name']:<30} | {c['role']:<25} | {c['organization']:<20} | sources={c['source_count']} {c['sources'][:3]}")
    print(f"\nTotal unique candidates: {len(candidates)}")

asyncio.run(main())
