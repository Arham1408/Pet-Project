from abc import ABC, abstractmethod

from langchain_core.documents import Document


class BaseAdapter(ABC):
    """
    All source adapters must output List[Document] (LangChain standard type).
    Each Document: page_content=str, metadata=dict with at minimum:
      { "source": url, "investor_id": str, "content_type": str, "published_at": str }
    """

    @abstractmethod
    async def fetch(self, source) -> list[Document]:
        """Fetch new content from the source. Returns List[Document]."""
        ...
