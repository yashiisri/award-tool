"""Diagnose entity_cache contents and pipeline issues."""
import asyncio, sys
sys.path.insert(0, '.')
from database import connect_db, get_database

async def main():
    await connect_db()
    db = get_database()

    total = await db.entity_cache.count_documents({})
    alive = await db.entity_cache.count_documents({'is_alive': True})
    indian = await db.entity_cache.count_documents({'nationality': 'Indian'})
    indian_alive = await db.entity_cache.count_documents({'nationality': 'Indian', 'is_alive': True})
    print(f'Total: {total}  |  Alive: {alive}  |  Indian: {indian}  |  Indian+Alive: {indian_alive}')

    print('\nOccupation breakdown:')
    pipeline = [{'$unwind': '$occupation'}, {'$group': {'_id': '$occupation', 'count': {'$sum': 1}}}, {'$sort': {'count': -1}}]
    async for doc in db.entity_cache.aggregate(pipeline):
        print(f'  {doc["_id"]}: {doc["count"]}')

    print('\nSector breakdown:')
    pipeline2 = [{'$unwind': '$sector_tags'}, {'$group': {'_id': '$sector_tags', 'count': {'$sum': 1}}}, {'$sort': {'count': -1}}]
    async for doc in db.entity_cache.aggregate(pipeline2):
        print(f'  {doc["_id"]}: {doc["count"]}')

    print('\nSample Indian alive entrepreneurs (10):')
    async for c in db.entity_cache.find({'nationality': 'Indian', 'is_alive': True, 'occupation': 'entrepreneur'}).limit(10):
        print(f'  {c["name"]} | {c.get("designation","")} | {c.get("employer_org","")} | birth={c.get("birth_year","")}')

asyncio.run(main())
