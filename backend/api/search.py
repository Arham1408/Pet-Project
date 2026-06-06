from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.deps import get_current_user, get_session
from models.user import User
from schemas.search import SearchRequest, SearchResponse, SearchResult
from services.vector_store import get_vector_store

router = APIRouter()

@router.post("", response_model=SearchResponse)
async def semantic_search(
    body: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    store = get_vector_store()
    filter_dict = {}
    if body.investor_id:
        filter_dict["investor_id"] = str(body.investor_id)

    results = store.similarity_search_with_score(
        body.query, k=body.limit, filter=filter_dict if filter_dict else None
    )

    search_results = []
    for doc, score in results:
        meta = doc.metadata or {}
        search_results.append(SearchResult(
            content_item_id=meta.get("content_item_id", ""),
            chunk_text=doc.page_content[:500],
            investor_name=meta.get("investor_name"),
            source_url=meta.get("source"),
            published_at=meta.get("published_at"),
            similarity=float(score),
        ))

    return SearchResponse(data=search_results, query=body.query)
