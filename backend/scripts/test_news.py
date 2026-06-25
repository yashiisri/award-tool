import asyncio, sys, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.WARNING)
from services.source_scrapers import fetch_all_news_articles, match_candidate_to_news

async def test():
    articles = await fetch_all_news_articles()
    test_names = ['Mukesh Ambani', 'Ratan Tata', 'Aditya Puri', 'Kiran Mazumdar', 'Deepinder Goyal', 'Uday Kotak', 'N Chandrasekaran']
    print(f'Total articles fetched: {len(articles)}')
    for name in test_names:
        matches = match_candidate_to_news(name, articles)
        sources = [m['source'] for m in matches[:3]]
        print(f'  {name:<35}: {len(matches)} articles | {sources}')

asyncio.run(test())
