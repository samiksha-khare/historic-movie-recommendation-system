#!/usr/bin/env python3
import time
import urllib.parse
import requests
import pandas as pd

INPUT_CSV  = "World Important Dates.csv"
OUTPUT_CSV = "World Important Dates enriched.csv"
WIKI_API   = "https://en.wikipedia.org/api/rest_v1/page/summary/{}"
SLEEP_SEC  = 0.1     # shorten wait so it moves faster
TIMEOUT    = 5       # seconds

def fetch_wiki_intro(title: str, sentences: int = 3) -> str:
    encoded = urllib.parse.quote(title, safe="")
    url = WIKI_API.format(encoded)
    try:
        resp = requests.get(url, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        extract = data.get("extract", "")
        if extract:
            parts = extract.split(". ")
            return ". ".join(parts[:sentences]).rstrip(".") + "."
        return ""
    except Exception as e:
        # you can uncomment the next line to see errors per title
        # print(f"  ❗ error fetching {title!r}: {e}")
        return ""

def enrich_events(input_path: str, output_path: str):
    df = pd.read_csv(input_path)
    descriptions = []
    total = len(df)
    for idx, title in enumerate(df["Name of Incident"], start=1):
        print(f"[{idx}/{total}] Fetching Wikipedia summary for: {title}", flush=True)
        desc = fetch_wiki_intro(title)
        descriptions.append(desc)
        time.sleep(SLEEP_SEC)
    df["wiki_description"] = descriptions
    df.to_csv(output_path, index=False)
    print(f"\n✅ Done — wrote {total} rows to {output_path!r}")

if __name__ == "__main__":
    enrich_events(INPUT_CSV, OUTPUT_CSV)
