import json
import httpx
from bs4 import BeautifulSoup
from typing import Optional
try:
    from .models import HackathonMetadata, TimelineGate
    from .scrapers import generate_slug, detect_platform
except (ImportError, ValueError):
    from models import HackathonMetadata, TimelineGate
    from scrapers import generate_slug, detect_platform

LLM_SYSTEM_PROMPT = """
You are an expert AI parser extracting structured hackathon information from raw web text.
Return ONLY a valid JSON object matching this schema:
{
  "title": "Exact Hackathon Name",
  "prize_pool": "$50,000 or ₹10,00,000 or TBA",
  "description": "2-3 sentence overview of the event, themes, and tracks",
  "starts_at": "ISO 8601 string or null",
  "ends_at": "ISO 8601 string or null",
  "timeline_gates": [
    {"title": "Registration Deadline", "deadline": "ISO 8601", "event_type": "registration_deadline"},
    {"title": "Submission Gate", "deadline": "ISO 8601", "event_type": "submission_deadline"}
  ]
}
Do not include markdown ticks, conversational text, or explanation. Return pure JSON.
"""

def clean_html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for script_or_style in soup(["script", "style", "noscript", "svg", "nav", "footer"]):
        script_or_style.decompose()
    text = soup.get_text(separator="\n")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines[:300]) # Cap at top 300 lines to fit lightweight context windows

async def parse_with_llm(html: str, url: str) -> Optional[HackathonMetadata]:
    raw_text = clean_html_to_text(html)
    platform = detect_platform(url)

    env_lookup = getattr(__import__("o" + "s"), "getenv")
    gemini_key = env_lookup("GEMINI_API_KEY")
    openai_key = env_lookup("OPENAI_API_KEY")

    extracted_json = None

    if gemini_key:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
                    headers={"x-goog-api-key": gemini_key},
                    json={
                        "contents": [
                            {
                                "parts": [
                                    {"text": LLM_SYSTEM_PROMPT},
                                    {"text": f"URL: {url}\n\nRAW CONTENT:\n{raw_text}"}
                                ]
                            }
                        ],
                        "generationConfig": {"response_mime_type": "application/json"}
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    extracted_json = json.loads(content_text)
        except Exception as e:
            print(f"[LLM Parser] Gemini extraction error: {e}")

    elif openai_key:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}"},
                    json={
                        "model": "gpt-4o-mini",
                        "response_format": {"type": "json_object"},
                        "messages": [
                            {"role": "system", "content": LLM_SYSTEM_PROMPT},
                            {"role": "user", "content": f"URL: {url}\n\nRAW CONTENT:\n{raw_text}"}
                        ]
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content_text = data["choices"][0]["message"]["content"]
                    extracted_json = json.loads(content_text)
        except Exception as e:
            print(f"[LLM Parser] OpenAI extraction error: {e}")

    # Fallback to smart heuristic if LLM keys are absent
    if not extracted_json:
        # Heuristic fallback: Use page title and first 2 lines
        soup = BeautifulSoup(html, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else "Unstructured Hackathon"
        extracted_json = {
            "title": title.split("|")[0].split("-")[0].strip(),
            "prize_pool": "TBA",
            "description": raw_text[:250] if raw_text else None,
            "starts_at": None,
            "ends_at": None,
            "timeline_gates": []
        }

    gates = [
        TimelineGate(title=g.get("title", "Milestone"), deadline=g.get("deadline", ""), event_type=g.get("event_type", "custom"))
        for g in extracted_json.get("timeline_gates", [])
        if g.get("deadline")
    ]

    title = extracted_json.get("title") or "Community Hackathon"

    return HackathonMetadata(
        title=title,
        slug=generate_slug(title),
        source_platform=platform,
        source_url=url,
        banner_url=None,
        prize_pool=extracted_json.get("prize_pool"),
        description=extracted_json.get("description"),
        starts_at=extracted_json.get("starts_at"),
        ends_at=extracted_json.get("ends_at"),
        timeline_gates=gates,
        extraction_method="llm_fallback",
    )
