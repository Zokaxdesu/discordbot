import sys
import json
import requests
import random

API_KEY = "ZlyIjD-8WeHEDtWzCSwt7vLflRbDQOHJ4IVL5tuvONA"  # Replace with your API key
BASE_URL = "https://adultdatalink.com/api"

def get_image(tag):
    endpoint = f"{BASE_URL}/pornpics/search"
    params = {
        "query": tag,
        "apikey": API_KEY,
        "count": 50
    }

    try:
        response = requests.get(endpoint, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        results = data.get("data", [])
        if not results:
            return None

        # Pick a random photo from one of the sets
        random_set = random.choice(results)
        photos = random_set.get("photos", [])
        if not photos:
            return None

        return random.choice(photos).get("url")
    except Exception as e:
        return None

def main():
    tag = sys.argv[1] if len(sys.argv) > 1 else "milf"
    image_url = get_image(tag)
    if image_url:
        print(json.dumps({ "url": image_url }))
    else:
        print(json.dumps({}))

if __name__ == "__main__":
    main()
