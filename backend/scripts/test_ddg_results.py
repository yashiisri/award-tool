"""Extract result snippets from DDG HTML to understand the pattern."""
import asyncio, sys, re
sys.path.insert(0, '.')
import httpx

BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

async def main():
    query = "Forbes India top business leaders 2025"
    
    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0), follow_redirects=True) as client:
        r = await client.post(
            "https://html.duckduckgo.com/html/",
            data={"q": query, "kl": "in-en"},
            headers={
                "User-Agent": BROWSER_UA,
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "en-US,en;q=0.9",
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": "https://duckduckgo.com/",
            },
        )
    
    html = r.text
    
    # Try different patterns to find result snippets
    print("=== Looking for result snippets ===")
    
    # Pattern 1: result__snippet class
    snippets1 = re.findall(r'class="result__snippet"[^>]*>(.*?)</(?:span|div|a)>', html, re.DOTALL)
    print(f"Pattern 1 (result__snippet): {len(snippets1)} snippets")
    for s in snippets1[:3]:
        print(f"  {re.sub('<[^>]+>',' ',s).strip()[:150]}")
    
    # Pattern 2: result__title
    titles = re.findall(r'class="result__a"[^>]*>(.*?)</a>', html, re.DOTALL)
    print(f"\nPattern 2 (result__a titles): {len(titles)} titles")
    for t in titles[:5]:
        print(f"  {re.sub('<[^>]+>',' ',t).strip()[:150]}")
    
    # Pattern 3: just grab all text in result divs
    result_divs = re.findall(r'class="result[^"]*"[^>]*>(.*?)</div>\s*</div>', html, re.DOTALL | re.IGNORECASE)
    print(f"\nPattern 3 (result divs): {len(result_divs)} divs")
    for d in result_divs[:2]:
        clean = re.sub(r'<[^>]+>', ' ', d)
        clean = re.sub(r'\s+', ' ', clean).strip()
        print(f"  {clean[:200]}")
    
    # Show a chunk from middle of page that likely has results
    mid = len(html) // 3
    print(f"\n=== Middle of page (chars {mid}-{mid+2000}) ===")
    print(html[mid:mid+2000])

asyncio.run(main())
