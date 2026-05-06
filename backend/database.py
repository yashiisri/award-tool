from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    print("Connected to MongoDB Atlas")

async def close_db():
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")

def get_database():
    return db
