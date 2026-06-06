"""
Entity extractor node.
Batches chunks (3 at a time) through GPT-4o-mini with JSON output mode.
Validates ticker format; deduplicates across chunks.
"""
import json
import re

import structlog
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from agents.prompts.entity_extraction import ENTITY_EXTRACTION_PROMPT
from agents.state import ExtractedEntity, PipelineState
from app.config import get_settings

logger = structlog.get_logger()
_TICKER_RE = re.compile(r"^[A-Z]{1,5}(\.[A-Z]{1,2})?$")
BATCH_SIZE = 3


def entity_extractor_node(state: PipelineState) -> PipelineState:
    chunks = state.get("chunks", [])
    if not chunks:
        return {**state, "entities": []}

    settings = get_settings()
    client = OpenAI(api_key=settings.openai_api_key)

    all_entities: list[ExtractedEntity] = []
    seen_keys: set[str] = set()  # dedup by (entity_name, entity_type)

    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i: i + BATCH_SIZE]
        combined_text = "\n\n---\n\n".join(
            (doc.page_content if hasattr(doc, "page_content") else str(doc))
            for doc in batch
        )
        try:
            entities = _extract_entities(client, combined_text)
        except Exception as e:
            logger.error("Entity extraction batch failed", batch_index=i, error=str(e))
            continue

        for entity in entities:
            # Validate and normalise ticker
            ticker = entity.get("ticker_symbol")
            if ticker and not _TICKER_RE.match(ticker):
                entity["ticker_symbol"] = None

            key = f"{entity.get('entity_type','')}/{entity.get('entity_name','').lower()}"
            if key in seen_keys:
                # Keep highest conviction across chunks
                existing = next((e for e in all_entities if
                                 f"{e.get('entity_type','')}/{e.get('entity_name','').lower()}" == key), None)
                if existing and _conviction_rank(entity.get("conviction_level")) > _conviction_rank(existing.get("conviction_level")):
                    all_entities.remove(existing)
                    all_entities.append(entity)
            else:
                seen_keys.add(key)
                all_entities.append(entity)

    return {**state, "entities": all_entities}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=5, max=30))
def _extract_entities(client: OpenAI, text: str) -> list[ExtractedEntity]:
    prompt = ENTITY_EXTRACTION_PROMPT.format(chunk_text=text[:8000])
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0,
        max_tokens=2000,
    )
    raw = response.choices[0].message.content or "[]"
    # Handle both {entities:[...]} and bare [...] responses
    parsed = json.loads(raw)
    if isinstance(parsed, dict):
        parsed = parsed.get("entities", list(parsed.values())[0] if parsed else [])
    return [_validate_entity(e) for e in parsed if isinstance(e, dict)]


def _validate_entity(e: dict) -> ExtractedEntity:
    return ExtractedEntity(
        entity_type=e.get("entity_type", "company"),
        entity_name=e.get("entity_name", ""),
        ticker_symbol=e.get("ticker_symbol"),
        sentiment=e.get("sentiment"),
        conviction_level=e.get("conviction_level"),
        context_snippet=e.get("context_snippet"),
    )


def _conviction_rank(level: str | None) -> int:
    return {"high": 3, "medium": 2, "low": 1, "unknown": 0, None: 0}.get(level, 0)
