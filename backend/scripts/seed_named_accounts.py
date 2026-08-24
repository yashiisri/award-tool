"""
seed_named_accounts.py
─────────────────────────
Seeds named jury / head-jury demo logins (placeholder people, not the
generic jury1/jury2/... test accounts from seed_test_accounts.py — both
sets coexist). Idempotent — skips any username that already exists.

Run:  python scripts/seed_named_accounts.py
"""
import asyncio, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from database import connect_db, close_db, get_database
from auth import get_password_hash

ACCOUNTS = [
    {"username": "rajiv_kumar",  "name": "Rajiv Kumar",  "email": "rajiv.kumar@jury.aima.in",  "password": "AIMA@Jury2025",     "role": "jury"},
    {"username": "priya_sharma", "name": "Priya Sharma", "email": "priya.sharma@jury.aima.in", "password": "AIMA@Jury2025",     "role": "jury"},
    {"username": "anil_mehta",   "name": "Anil Mehta",   "email": "anil.mehta@jury.aima.in",   "password": "AIMA@Jury2025",     "role": "jury"},
    {"username": "sunita_rao",   "name": "Sunita Rao",   "email": "sunita.rao@jury.aima.in",   "password": "AIMA@Jury2025",     "role": "jury"},
    {"username": "vikram_nair",  "name": "Vikram Nair",  "email": "vikram.nair@jury.aima.in",  "password": "AIMA@Jury2025",     "role": "jury"},
    {"username": "deepak_anand", "name": "Deepak Anand", "email": "deepak.anand@headjury.aima.in", "password": "AIMA@HeadJury2025", "role": "head_jury"},
    {"username": "meera_iyer",   "name": "Meera Iyer",   "email": "meera.iyer@headjury.aima.in",   "password": "AIMA@HeadJury2025", "role": "head_jury"},
]


async def main():
    await connect_db()
    db = get_database()

    print(f"{'Username':<16} {'Role':<11} {'Password':<18} Status")
    print("-" * 65)
    for acc in ACCOUNTS:
        existing = await db.users.find_one({"username": acc["username"]})
        if existing:
            print(f"{acc['username']:<16} {acc['role']:<11} {'—':<18} already exists, skipped")
            continue
        await db.users.insert_one({
            "username": acc["username"],
            "email": acc["email"],
            "role": acc["role"],
            "hashed_password": get_password_hash(acc["password"]),
        })
        print(f"{acc['username']:<16} {acc['role']:<11} {acc['password']:<18} created")

    await close_db()


asyncio.run(main())
