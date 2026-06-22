"""
config.py — Environment variables, logging, and Pydantic schemas.
"""
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

# ─ Logging 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("vsv-ai-service")

# ── Gemini 
GEMINI_API_KEY        = os.getenv("GEMINI_API_KEY",        "")
GEMINI_MODEL          = os.getenv("GEMINI_MODEL",          "gemini-2.5-flash")
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.1-flash-lite")

# ── HuggingFace Inference API ──────────────────────────────────────────────
HF_API_KEY  = os.getenv("HF_API_KEY", "")
HF_MODEL    = os.getenv("HF_MODEL",  "cardiffnlp/twitter-roberta-base-sentiment-latest")

# ─ Java backend 
JAVA_BACKEND_URL     = os.getenv("JAVA_BACKEND_URL",     "http://localhost:8080")
CATALOG_LIMIT        = int(os.getenv("CATALOG_LIMIT",        "200"))
PROMPT_PRODUCT_LIMIT = int(os.getenv("PROMPT_PRODUCT_LIMIT", "15"))
MIN_FILTER_RESULTS   = int(os.getenv("MIN_FILTER_RESULTS",   "3"))

# ─ Pydantic schemas 

class ReviewAnalysisRequest(BaseModel):
    comment: str = Field(..., min_length=1, max_length=5000)

class ReviewAnalysisResponse(BaseModel):
    sentiment: str
    score:     int
    summary:   str

class HistoryMessage(BaseModel):
    role:    str   # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str                  = Field(..., min_length=1, max_length=2000)
    history: list[HistoryMessage] = Field(default_factory=list)

class RecommendedProduct(BaseModel):
    id:        int
    name:      str
    brand:     str | None = None
    price:     float
    imageUrl:  str | None = None
    category:  str | None = None
    inStock:   bool = True

class ChatResponse(BaseModel):
    reply:    str
    products: list[RecommendedProduct] = []