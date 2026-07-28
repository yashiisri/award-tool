"""Verify the Indian filter drops non-Indians."""
import asyncio, sys, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.WARNING)
from services.nominee_discovery import validate_with_wikipedia

# Mix of Indian, Indian-origin NRI, and non-Indian
test_names = [
    "Bhuvan Bam",        # Indian creator
    "Ashish Chanchlani", # Indian creator
    "Sundar Pichai",     # Indian-origin, US-based CEO
    "Rashmika Mandanna", # Indian actress (should pass — she's Indian)
    "Rohit Sharma",      # Indian cricketer (Indian — should pass)
    "Elon Musk",         # Not Indian at all
    "Taylor Swift",      # Not Indian
    "Mukesh Ambani",     # Indian
    "Nikhil Kamath",     # Indian
]

async def main():
    validated = await validate_with_wikipedia(test_names)
    print(f"\nInput: {len(test_names)} names")
    print(f"Passed Indian filter: {len(validated)}")
    print()
    passed = {v['name'].lower() for v in validated}
    for name in test_names:
        status = "✓ PASS" if name.lower() in passed else "✗ DROP"
        desc = next((v.get('wiki_description','') for v in validated if v['name'].lower() == name.lower()), '')
        print(f"  {status}  {name:<30} {desc[:55]}")

asyncio.run(main())
