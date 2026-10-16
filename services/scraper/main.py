import secrets
import httpx
import ipaddress
import socket
import urllib.parse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

try:
    from .models import ScrapeRequest, HackathonMetadata
    from .scrapers import parse_with_dom, detect_platform
    from .llm_parser import parse_with_llm
except (ImportError, ValueError):
    from models import ScrapeRequest, HackathonMetadata
    from scrapers import parse_with_dom, detect_platform
    from llm_parser import parse_with_llm

load_dotenv()

app = FastAPI(
    title="Hackline Magic Scraper Microservice",
    description="Hackathon parser extracting schedules, prizes, and tracks.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

FORBIDDEN_HOSTS = {
    "localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal",
    "instance-data", "metadata", "metadata.internal"
}

def is_valid_public_url(raw_url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(raw_url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = (parsed.hostname or "").lower().strip("[]")
        if not hostname or hostname in FORBIDDEN_HOSTS:
            return False
        if hostname.endswith((".localhost", ".local", ".internal", ".lan")):
            return False
        # Resolve address to verify it is not in private or link-local subnets
        addr_info = socket.getaddrinfo(hostname, None)
        for entry in addr_info:
            ip_str = entry[4][0]
            ip = ipaddress.ip_address(ip_str)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False
        return True
    except Exception:
        return False

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "hackline-scraper"}

@app.post("/api/scrape", response_model=HackathonMetadata)
async def scrape_hackathon(request: ScrapeRequest):
    url = str(request.url).strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://{url}"

    if not is_valid_public_url(url):
        raise HTTPException(
            status_code=400,
            detail="Forbidden destination. Only public web addresses can be parsed."
        )

    try:
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True, headers=headers) as client:
            response = await client.get(url)

        if response.status_code >= 400:
            raise HTTPException(
                status_code=400,
                detail=f"Target page returned HTTP {response.status_code}. Please verify the URL."
            )

        html = response.text

        # 1. Primary Strategy: DOM & OpenGraph / JSON-LD Extraction
        result = parse_with_dom(html, url)

        # 2. Fallback Strategy: LLM Parser if DOM parser could not find title or critical dates
        if not result or not result.title or result.title == "Untitled" or not result.prize_pool:
            llm_result = await parse_with_llm(html, url)
            if llm_result:
                # Merge if DOM had banner
                if result and result.banner_url and not llm_result.banner_url:
                    llm_result.banner_url = result.banner_url
                return llm_result

        if not result:
            raise HTTPException(status_code=422, detail="Unable to extract hackathon details from page structure.")

        return result

    except HTTPException:
        raise
    except Exception as e:
        # Fallback to minimal metadata with clean error handling
        platform = detect_platform(url)
        return HackathonMetadata(
            title="Imported Hackathon",
            slug=f"hackathon-{secrets.token_hex(4)}",
            source_platform=platform,
            source_url=url,
            prize_pool="TBA",
            description="Extracted via Hackline Magic Link engine.",
            extraction_method="llm_fallback"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.scraper.main:app", host="0.0.0.0", port=8000, reload=True)
