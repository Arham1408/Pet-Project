import hashlib


def compute_hash(text: str) -> str:
    """SHA-256 of UTF-8 encoded text. Used for deduplication."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def is_duplicate(content_hash: str, existing_hashes: set[str]) -> bool:
    return content_hash in existing_hashes
