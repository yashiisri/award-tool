import asyncio, sys
sys.path.insert(0, '.')
import httpx
from services.nominee_discovery import _wiki_fetch, TIMEOUT

async def main():
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        for name in ["Bhuvan Bam", "Mukesh Ambani", "Elon Musk"]:
            result = await _wiki_fetch(name, client)
            if result:
                print(f"\n{name}:")
                print(f"  desc:    '{result.get('wiki_description','')}'")
                print(f"  extract: '{result.get('wiki_extract','')[:150]}'")
            else:
                print(f"\n{name}: NO RESULT")

asyncio.run(main())
