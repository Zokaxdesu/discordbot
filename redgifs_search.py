# redgifs_search.py
import sys
import json
from redgifs import API, MediaType

def get_top_tag_url_list():
    api = API().login()
    top = api.get_top_this_week(count=25, page=1, type=MediaType.GIF)
    tags = []
    for gif in top.gifs:
        tags.extend(gif.tags or [])
    if not tags:
        return []

    # Count tag frequency
    freq = {}
    for t in tags:
        freq[t] = freq.get(t, 0) + 1
    sorted_tags = sorted(freq.items(), key=lambda x: -x[1])
    top_tag = sorted_tags[0][0]

    result = api.search(top_tag, count=100)
    return [gif.urls.sd for gif in result.gifs if gif.urls.sd]

def search_by_tag(tag):
    api = API().login()
    result = api.search(tag, count=100)
    return [gif.urls.sd for gif in result.gifs if gif.urls.sd]

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--top":
        urls = get_top_tag_url_list()
    else:
        tag = sys.argv[1] if len(sys.argv) > 1 else "milf"
        urls = search_by_tag(tag)

    print(json.dumps(urls))

if __name__ == "__main__":
    main()
