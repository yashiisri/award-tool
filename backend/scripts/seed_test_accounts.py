"""
seed_test_accounts.py
──────────────────────
One-off local script: creates a handful of jury / head-jury logins so the
Jury and Head Jury portals can be walked through end-to-end without going
through Manage Users first. Safe to re-run — skips any username that
already exists.

Run:  python scripts/seed_test_accounts.py
"""
import asyncio, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from database import connect_db, close_db, get_database
from auth import get_password_hash

ACCOUNTS = [
    {"username": "jury1",      "email": "jury1@noblecrest.test",      "password": "Jury@2026",     "role": "jury"},
    {"username": "jury2",      "email": "jury2@noblecrest.test",      "password": "Jury@2026",     "role": "jury"},
    {"username": "jury3",      "email": "jury3@noblecrest.test",      "password": "Jury@2026",     "role": "jury"},
    {"username": "headjury1",  "email": "headjury1@noblecrest.test",  "password": "HeadJury@2026", "role": "head_jury"},
    {"username": "headjury2",  "email": "headjury2@noblecrest.test",  "password": "HeadJury@2026", "role": "head_jury"},
]


async def main():
    await connect_db()
    db = get_database()

    print(f"{'Username':<12} {'Role':<11} {'Password':<14} Status")
    print("-" * 55)
    for acc in ACCOUNTS:
        existing = await db.users.find_one({"username": acc["username"]})
        if existing:
            print(f"{acc['username']:<12} {acc['role']:<11} {'—':<14} already exists, skipped")
            continue
        await db.users.insert_one({
            "username": acc["username"],
            "email": acc["email"],
            "role": acc["role"],
            "hashed_password": get_password_hash(acc["password"]),
        })
        print(f"{acc['username']:<12} {acc['role']:<11} {acc['password']:<14} created")

    await close_db()


asyncio.run(main())
