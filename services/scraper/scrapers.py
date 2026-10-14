import re
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs
from typing import Optional, Dict, Any
try:
    from .models import HackathonMetadata, TimelineGate
except (ImportError, ValueError):
    from models import HackathonMetadata, TimelineGate

def extract_smart_title_from_url(url: str, platform: str) -> str:
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)

    # 1. Check query parameters
    candidate = qs.get("utm_source", [""])[0] or qs.get("utm_campaign", [""])[0] or qs.get("challenge", [""])[0]
    if candidate and candidate.lower() not in ["logged_out_user", "share", "referral"]:
        formatted = re.sub(r"[_-]+", " ", candidate).title()
        return f"{formatted} ({platform.upper()})"

    # 2. Check path segments
    path_parts = [p for p in parsed.path.split("/") if p]
    if path_parts:
        last = path_parts[-1]
        if last not in ["hackathons", "competitions", "events"]:
            if "-" in last:
                return re.sub(r"-+", " ", last).title()
            elif len(last) >= 4:
                return f"{platform.upper()} Sprint #{last.upper()}"

    return f"{platform.upper()} Hackathon"

def detect_platform(url: str) -> str:
    domain = urlparse(url).netloc.lower()
    if "devfolio.co" in domain:
        return "devfolio"
    elif "unstop.com" in domain:
        return "unstop"
    elif "devpost.com" in domain:
        return "devpost"
    elif "lu.ma" in domain:
        return "luma"
    elif "hack2skill.com" in domain:
        return "hack2skill"
    elif "hackculture.com" in domain:
        return "hackculture"
    elif "hackbriven.com" in domain:
        return "hackbriven"
    return "custom"

def generate_slug(title: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9\s-]", "", title).strip().lower()
    return re.sub(r"[\s-]+", "-", cleaned)[:60]

def extract_meta_tags(soup: BeautifulSoup) -> Dict[str, str]:
    meta = {}
    for tag in soup.find_all("meta"):
        prop = tag.get("property", tag.get("name", "")).lower()
        content = tag.get("content", "")
        if prop and content:
            meta[prop] = content
    return meta

def extract_json_ld(soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
    scripts = soup.find_all("script", type="application/ld+json")
    for script in scripts:
        try:
            data = json.loads(script.string or "{}")
            if isinstance(data, dict) and data.get("@type") in ["Event", "Hackathon"]:
                return data
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and item.get("@type") in ["Event", "Hackathon"]:
                        return item
        except Exception:
            continue
    return None

def parse_with_dom(html: str, url: str) -> Optional[HackathonMetadata]:
    soup = BeautifulSoup(html, "html.parser")
    platform = detect_platform(url)
    meta = extract_meta_tags(soup)
    json_ld = extract_json_ld(soup)

    # 1. Title Extraction
    title = None
    if json_ld and json_ld.get("name"):
        title = json_ld["name"].strip()
    elif meta.get("og:title"):
        title = meta["og:title"].split("|")[0].split("-")[0].strip()
    elif meta.get("twitter:title"):
        title = meta["twitter:title"].strip()
    elif soup.title and soup.title.string:
        title = soup.title.string.split("|")[0].split("-")[0].strip()

    if not title:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)

    GENERIC_TITLES = {"unstop", "devfolio", "devpost", "luma", "hack2skill", "competitions", "hackathons", "home", "untitled", "403 forbidden"}
    if not title or title.lower() in GENERIC_TITLES:
        title = extract_smart_title_from_url(url, platform)

    if not title:
        return None

    # 2. Banner Image Extraction
    banner_url = None
    if json_ld and json_ld.get("image"):
        img = json_ld["image"]
        banner_url = img if isinstance(img, str) else img[0] if isinstance(img, list) else None
    if not banner_url:
        banner_url = meta.get("og:image") or meta.get("twitter:image")

    # 3. Description Extraction
    description = None
    if json_ld and json_ld.get("description"):
        description = json_ld["description"].strip()
    if not description:
        description = meta.get("og:description") or meta.get("description")

    # 4. Dates Extraction
    starts_at = None
    ends_at = None
    if json_ld:
        starts_at = json_ld.get("startDate")
        ends_at = json_ld.get("endDate")

    # 5. Prize Pool Search via Regex
    prize_pool = None
    text_corpus = soup.get_text()
    prize_patterns = [
        r"(?:prizes?|prize pool|bounties|rewards?)[^\w\n\r]{0,15}(?:of\s+)?(\$[\d,]+(?:\.\d+)?|\₹[\d,]+(?:\.\d+)?|INR\s*[\d,]+|USD\s*[\d,]+|[\d,]+\s*(?:USDC|USDT|ETH))",
        r"(\$[\d,]{3,}|\₹[\d,]{4,})\s*(?:in prizes|prize pool|total rewards)",
    ]
    for pattern in prize_patterns:
        match = re.search(pattern, text_corpus, re.IGNORECASE)
        if match:
            prize_pool = match.group(1).strip()
            break

    # If critical fields are found, return structured metadata
    return HackathonMetadata(
        title=title,
        slug=generate_slug(title),
        source_platform=platform,
        source_url=url,
        banner_url=banner_url,
        prize_pool=prize_pool or "TBA",
        description=description[:500] if description else None,
        starts_at=starts_at,
        ends_at=ends_at,
        timeline_gates=[],
        extraction_method="dom_parser",
    )
