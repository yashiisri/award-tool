"""Check that about_nominee and selection_rationale bullets are populated."""
import asyncio, sys, json
sys.path.insert(0, '.')
from services.enrichment import RawEnrichment
from services.dossier_builder import build_dossiers

# Simulate one enriched candidate with real data
sample = RawEnrichment(
    name="Indian Oil Corporation",
    entity_type="company",
    wiki_extract="Indian Oil Corporation Limited is an Indian multinational oil and gas company. It is the largest government-owned oil producer in India. The company was established in 1959. It is headquartered in New Delhi. It operates 11 refineries across India with a combined capacity of 80.5 MMTPA. In FY2023, the company reported revenue of INR 8.77 lakh crore (USD 107 billion) and a net profit of INR 8,242 crore.",
    wiki_desc="Indian multinational oil and gas company",
    wiki_url="https://en.wikipedia.org/wiki/Indian_Oil_Corporation",
    photo_url="https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Indian_Oil_Corporation_Logo.svg/200px-Indian_Oil_Corporation_Logo.svg.png",
    forbes_text="Indian Oil Corporation ranked in Forbes Global 2000 companies. Revenue exceeds $100 billion.",
    fortune_text="Indian Oil features in Fortune 500 list, ranked among top energy companies globally.",
    ddg_text="IndianOil PSU of the Year 2024 award. CSR initiatives include mid-day meal programs and skill training.",
    has_data=True,
)

async def main():
    dossiers = await build_dossiers(
        enriched=[sample],
        award_name="Outstanding PSU of the Year",
        award_description="This award recognises PSUs in their core fields of operation",
        evaluation_criteria=["Governance", "Financial Performance", "National Impact", "CSR"],
        entity_type="company",
        num_nominees=1,
    )
    if dossiers:
        d = dossiers[0]
        print(f"\nNAME: {d['name']}")
        print(f"BIO: {d.get('bio','')[:120]}")
        print(f"\nABOUT NOMINEE ({len(d.get('about_nominee',[]))} bullets):")
        for b in d.get('about_nominee', []):
            print(f"  • {b}")
        print(f"\nSELECTION RATIONALE ({len(d.get('selection_rationale',[]))} bullets):")
        for b in d.get('selection_rationale', []):
            print(f"  • {b}")
        print(f"\nCONFIDENCE: {d.get('confidence_score')}")
    else:
        print("No dossiers returned")

asyncio.run(main())
