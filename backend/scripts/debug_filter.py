"""Debug exactly why valid Indians are being dropped."""
import asyncio, sys
sys.path.insert(0, '.')
import httpx, re
from services.nominee_discovery import _wiki_fetch, TIMEOUT

_NON_PERSON = [
    "company", "corporation", "organisation", "organization",
    "founded in", "established in", "headquartered",
    "television series", "album", "song",
    "city", "town", "village", "district",
    "award ceremony", "trade fair",
]

async def main():
    names = ["Bhuvan Bam", "Mukesh Ambani", "Nikhil Kamath", "Elon Musk"]
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        for name in names:
            result = await _wiki_fetch(name, client)
            if not result:
                print(f"{name}: NO WIKI RESULT")
                continue
            desc    = result.get("wiki_description", "").lower()
            extract = result.get("wiki_extract", "").lower()
            combined = f"{desc} {extract[:300]}"
            full_combined = f"{desc} {result.get('wiki_extract','')[:600]}".lower()

            # Check _NON_PERSON
            non_person_hit = [p for p in _NON_PERSON if p in combined]

            # Check length
            extract_len = len(result.get("wiki_extract", ""))

            # Check indian
            is_indian = "indian" in full_combined or "india" in full_combined

            print(f"\n{name}:")
            print(f"  desc:             '{desc[:80]}'")
            print(f"  extract_len:      {extract_len}")
            print(f"  non_person_hits:  {non_person_hit}")
            print(f"  is_indian:        {is_indian}")
            if extract_len < 60:
                print(f"  STATUS: DROPPED — extract too short")
            elif non_person_hit:
                print(f"  STATUS: DROPPED — non_person match: {non_person_hit}")
            elif not is_indian:
                print(f"  STATUS: DROPPED — not Indian")
            else:
                print(f"  STATUS: PASS ✓")

asyncio.run(main())
