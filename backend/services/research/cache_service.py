"""
cache_service.py
─────────────────
Mongo-backed cache for search results and candidate evidence, keyed by a
hash of (cache_type, key). Uses Mongo's native TTL index (expireAfterSeconds)
so there's no separate cron job or Redis dependency — just the Atlas cluster
already in use.
"""

import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

logger = logging.getLogger(__name__)

COLLECTION = "research_cache"
_index_ready = False


def _cache_key(cache_type: str, key: str) -> str:
    return hashlib.sha256(f"{cache_type}:{key}".encode("utf-8")).hexdigest()


async def _ensure_index(db) -> None:
    global _index_ready
    if _index_ready:
        return
    try:
        await db[COLLECTION].create_index("expires_at", expireAfterSeconds=0)
        _index_ready = True
    except Exception as exc:
        logger.warning("Could not create research_cache TTL index: %s", exc)


async def get_cached(db, cache_type: str, key: str) -> Optional[Any]:
    await _ensure_index(db)
    doc = await db[COLLECTION].find_one({"_id": _cache_key(cache_type, key)})
    if not doc:
        return None
    return doc.get("value")


async def set_cached(db, cache_type: str, key: str, value: Any, ttl_seconds: int) -> None:
    await _ensure_index(db)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
    try:
        await db[COLLECTION].update_one(
            {"_id": _cache_key(cache_type, key)},
            {"$set": {"value": value, "expires_at": expires_at, "cache_type": cache_type}},
            upsert=True,
        )
    except Exception as exc:
        # Caching is an optimisation, never a hard dependency — never raise.
        logger.warning("Failed to write cache entry (%s): %s", cache_type, exc)
