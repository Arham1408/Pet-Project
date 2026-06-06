"""
Embedder node.
Enriches chunk metadata and calls PGVector.add_documents().
PGVector handles batching, embedding API calls, and DB insertion.
"""
import structlog

from agents.state import PipelineState
from services.vector_store import get_vector_store

logger = structlog.get_logger()


def embedder_node(state: PipelineState) -> PipelineState:
    chunks = state.get("chunks", [])
    if not chunks:
        logger.warning("embedder: no chunks to embed")
        return {**state, "embeddings_stored": False}

    content_item_id = state["content_item_id"]
    investor_id = state["investor_id"]

    # Enrich each chunk's metadata before storing
    for i, doc in enumerate(chunks):
        doc.metadata.update({
            "content_item_id": content_item_id,
            "investor_id": investor_id,
            "chunk_index": i,
            "source_url": state.get("source_url", ""),
        })

    try:
        store = get_vector_store()
        store.add_documents(chunks)
        logger.info("Embeddings stored", count=len(chunks), content_item_id=content_item_id)
        return {**state, "embeddings_stored": True}
    except Exception as e:
        logger.error("Embedding storage failed", error=str(e), content_item_id=content_item_id)
        return {**state, "embeddings_stored": False, "error": str(e)}
