"""
SEC EDGAR 13F adapter.
Custom implementation — Kay.ai LangChain retriever requires paid key.
Uses EDGAR REST API directly (free, no key needed).
Rate limit: 10 req/s. Always send User-Agent header.
"""
import asyncio
import re
import xml.etree.ElementTree as ET
from datetime import datetime

import httpx
import structlog
from langchain_core.documents import Document
from tenacity import retry, stop_after_attempt, wait_exponential

from ingestion.base_adapter import BaseAdapter

logger = structlog.get_logger()

EDGAR_HEADERS = {
    "User-Agent": "HedgeFundIntelligence/1.0 (contact@hedgefundintelligence.com)",
    "Accept-Encoding": "gzip, deflate",
}
SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik}.json"
ARCHIVES_BASE = "https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/"

# Both possible 13F XML filenames
INFOTABLE_FILENAMES = ["infotable.xml", "informationtable.xml"]

# XML namespaces used across different 13F versions
NS_PATTERNS = [
    "{http://www.sec.gov/edgar/document/thirteenf/informationtable}",
    "{http://www.sec.gov/edgar/thirteenf/informationtable}",
    "",  # no namespace fallback
]


class SECEdgarAdapter(BaseAdapter):
    async def fetch(self, source) -> list[Document]:
        cik = source.config.get("cik_number") or ""
        if not cik:
            logger.warning("SEC adapter: no cik_number in source config", source_id=str(source.id))
            return []

        cik_padded = cik.zfill(10)
        last_accession = source.config.get("last_accession", "")

        try:
            filings = await self._get_recent_13f_filings(cik_padded)
        except Exception as e:
            logger.error("EDGAR submissions fetch failed", cik=cik_padded, error=str(e))
            raise

        docs = []
        for filing in filings:
            accession = filing["accessionNumber"]
            if accession == last_accession:
                break  # Already processed this and everything before it

            filing_period = filing.get("reportDate", "")
            period_label = _period_label(filing_period)

            try:
                holdings = await self._parse_13f(cik_padded, accession)
                await asyncio.sleep(0.2)  # EDGAR rate limit courtesy delay
            except Exception as e:
                logger.warning("13F parse failed", accession=accession, error=str(e))
                continue

            raw_xml_summary = _holdings_to_text(holdings, filing_period)
            doc = Document(
                page_content=raw_xml_summary,
                metadata={
                    "source": f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik_padded}&type=13F-HR",
                    "content_type": "filing",
                    "investor_id": str(source.investor_id),
                    "source_id": str(source.id),
                    "accession_number": accession,
                    "filing_period": period_label,
                    "report_date": filing_period,
                    "published_at": filing.get("filingDate", ""),
                    "title": f"13F Filing — {period_label}",
                    "holdings": holdings,
                },
            )
            docs.append(doc)

        return docs

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=5, max=30))
    async def _get_recent_13f_filings(self, cik_padded: str) -> list[dict]:
        url = SUBMISSIONS_URL.format(cik=cik_padded)
        async with httpx.AsyncClient(headers=EDGAR_HEADERS, timeout=30) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        recent = data.get("filings", {}).get("recent", {})
        form_types = recent.get("form", [])
        accessions = recent.get("accessionNumber", [])
        filing_dates = recent.get("filingDate", [])
        report_dates = recent.get("reportDate", [])

        return [
            {
                "accessionNumber": accessions[i].replace("-", ""),
                "filingDate": filing_dates[i],
                "reportDate": report_dates[i],
            }
            for i, ft in enumerate(form_types)
            if ft in ("13F-HR", "13F-HR/A")
        ]

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=5, max=30))
    async def _parse_13f(self, cik_padded: str, accession_nodash: str) -> list[dict]:
        base_url = ARCHIVES_BASE.format(cik=cik_padded.lstrip("0"), accession=accession_nodash)

        async with httpx.AsyncClient(headers=EDGAR_HEADERS, timeout=60) as client:
            xml_content = None
            for fname in INFOTABLE_FILENAMES:
                try:
                    resp = await client.get(base_url + fname)
                    if resp.status_code == 200:
                        xml_content = resp.text
                        break
                    await asyncio.sleep(0.1)
                except Exception:
                    continue

            if not xml_content:
                # Fallback: fetch index page and find XML link
                idx_resp = await client.get(base_url + f"{accession_nodash}-index.htm")
                xml_url = _find_infotable_url(idx_resp.text, base_url)
                if xml_url:
                    xml_resp = await client.get(xml_url)
                    xml_content = xml_resp.text

        if not xml_content:
            raise ValueError(f"Could not fetch infotable XML for accession {accession_nodash}")

        return _parse_infotable_xml(xml_content)


def _parse_infotable_xml(xml_content: str) -> list[dict]:
    """Parse 13F infotable XML into list of holding dicts. Handles multiple namespace patterns."""
    root = ET.fromstring(xml_content)
    holdings = []

    for ns in NS_PATTERNS:
        info_tables = root.findall(f".//{ns}infoTable")
        if not info_tables:
            info_tables = root.findall(f".//{ns}InfoTable")
        if info_tables:
            for table in info_tables:
                def g(tag):
                    for n in NS_PATTERNS:
                        el = table.find(f"{n}{tag}")
                        if el is None:
                            el = table.find(f"{n}{tag[0].upper() + tag[1:]}")
                        if el is not None and el.text:
                            return el.text.strip()
                    return ""

                shares_el = table.find(f"{ns}shrsOrPrnAmt")
                if shares_el is None:
                    shares_el = table.find(f"{ns}ShrsorPrnAmt")
                shares = 0
                if shares_el is not None:
                    for n in NS_PATTERNS:
                        s = shares_el.find(f"{n}sshPrnamt") or shares_el.find(f"{n}SshPrnamt")
                        if s is not None and s.text:
                            try:
                                shares = int(s.text.strip())
                            except ValueError:
                                pass
                            break

                holdings.append({
                    "name": g("nameOfIssuer"),
                    "cusip": g("cusip"),
                    "value": _safe_int(g("value")),
                    "shares": shares,
                    "put_call": g("putCall"),
                })
            break

    return holdings


def _holdings_to_text(holdings: list[dict], period: str) -> str:
    lines = [f"13F Holdings — Period: {period}", f"Total positions: {len(holdings)}", ""]
    for h in holdings:
        lines.append(f"{h['name']} | CUSIP:{h['cusip']} | Value:${h['value']}K | Shares:{h['shares']}")
    return "\n".join(lines)


def _period_label(report_date: str) -> str:
    """Convert '2024-09-30' → '2024-Q3'."""
    try:
        dt = datetime.strptime(report_date, "%Y-%m-%d")
        q = (dt.month - 1) // 3 + 1
        return f"{dt.year}-Q{q}"
    except ValueError:
        return report_date


def _find_infotable_url(index_html: str, base_url: str) -> str | None:
    """Scan index HTML for infotable link."""
    for pattern in [r'href="([^"]*infotable[^"]*\.xml)"', r'href="([^"]*informationtable[^"]*\.xml)"']:
        m = re.search(pattern, index_html, re.IGNORECASE)
        if m:
            path = m.group(1)
            return path if path.startswith("http") else f"https://www.sec.gov{path}"
    return None


def _safe_int(val: str) -> int:
    try:
        return int(val.replace(",", ""))
    except (ValueError, AttributeError):
        return 0
