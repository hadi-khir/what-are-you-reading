from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query

from ..schemas import BookSearchResult

router = APIRouter(prefix="/books", tags=["books"])

OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json"
COVER_BASE = "https://covers.openlibrary.org/b/id/{cover_id}-M.jpg"


def _parse_doc(doc: dict[str, Any]) -> BookSearchResult:
    cover_i = doc.get("cover_i")
    cover_url = COVER_BASE.format(cover_id=cover_i) if cover_i else None
    authors = doc.get("author_name") or []
    return BookSearchResult(
        open_library_key=doc.get("key", ""),
        title=doc.get("title", "Unknown Title"),
        author=", ".join(authors) if authors else "Unknown Author",
        cover_url=cover_url,
        publish_year=doc.get("first_publish_year"),
    )


@router.get("/search", response_model=list[BookSearchResult])
async def search_books(q: str = Query(min_length=1, max_length=200)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                OPEN_LIBRARY_SEARCH,
                params={"q": q, "limit": 15, "fields": "key,title,author_name,cover_i,first_publish_year"},
                timeout=10,
            )
        response.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Failed to reach Open Library")

    docs = response.json().get("docs", [])
    return [_parse_doc(doc) for doc in docs if doc.get("key")]
