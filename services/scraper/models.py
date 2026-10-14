from pydantic import BaseModel, HttpUrl
from typing import Optional, List

class ScrapeRequest(BaseModel):
    url: str

class TimelineGate(BaseModel):
    title: str
    deadline: str
    event_type: str = "custom"

class HackathonMetadata(BaseModel):
    title: str
    slug: str
    source_platform: str
    source_url: str
    banner_url: Optional[str] = None
    prize_pool: Optional[str] = None
    description: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    timeline_gates: List[TimelineGate] = []
    extraction_method: str = "dom_parser" # "dom_parser" | "llm_fallback"
