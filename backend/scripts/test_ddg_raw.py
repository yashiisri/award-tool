"""Debug DDG responses to understand what we're getting."""
import asyncio, sys
sys.path.insert(0, '.')
import httpx

BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

async def main():
    query = "Forbes India top business leaders 2025"
    
    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0), follow_redirects=True) as client:
        
        # Test 1: DDG Instant Answer API
        print("=== DDG Instant Answer API ===")
        r = await client.get(
            "https://api.duckduckgo.com/",
            params={"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"},
            headers={"User-Agent": BROWSER_UA, "Accept": "application/json"},
        )
        print(f"Status: {r.status_code}")
        data = r.json()
        print(f"AbstractText: {data.get('AbstractText','')[:200]}")
        print(f"RelatedTopics count: {len(data.get('RelatedTopics', []))}")
        for t in data.get("RelatedTopics", [])[:5]:
            if isinstance(t, dict):
                print(f"  Topic: {t.get('Text','')[:100]}")
        
        print()
        
        # Test 2: DDG HTML search
        print("=== DDG HTML Search ===")
        r2 = await client.post(
            "https://html.duckduckgo.com/html/",
            data={"q": query, "kl": "in-en"},
            headers={
                "User-Agent": BROWSER_UA,
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "en-US,en;q=0.9",
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": "https://duckduckgo.com/",
                "Origin": "https://duckduckgo.com",
            },
        )
        print(f"Status: {r2.status_code}")
        print(f"Response length: {len(r2.text)}")
        # Show first 2000 chars to see what we get
        print("First 2000 chars:")
        print(r2.text[:2000])

asyncio.run(main())
