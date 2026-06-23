"""
VSV AI Service — FastAPI Inference Gateway v3
==============================================
/analyze  — sentiment analysis via HuggingFace RoBERTa (local, no external API)
/chat     — RAG chatbot via Gemini with smart catalog filtering
/health   — status check

Modules:
  config.py             — env vars, logging, schemas
  sentiment_service.py  — HuggingFace RoBERTa sentiment analysis
  filtering.py          — catalog keyword extraction & scoring
  gemini_service.py     — Gemini RAG: catalog fetch, prompt build, API call
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import (
    logger,
    GEMINI_MODEL, GEMINI_API_KEY, GEMINI_FALLBACK_MODEL,
    JAVA_BACKEND_URL, CATALOG_LIMIT, PROMPT_PRODUCT_LIMIT,
    ReviewAnalysisRequest, ReviewAnalysisResponse,
    ChatRequest, ChatResponse, RecommendedProduct,
)
from sentiment_service import analyze_sentiment, MODEL_NAME, MODEL_READY
from filtering import extract_search_context, filter_catalog
from gemini_service import (
    fetch_all_products, fetch_review_summaries,
    format_product_catalog, build_system_prompt, call_gemini,
)


# ── App lifespan ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("VSV AI Service v3 starting")
    logger.info("  Sentiment:   HuggingFace Inference API  model=%s  ready=%s", MODEL_NAME, MODEL_READY)
    logger.info("  Chatbot:     Gemini  model=%s  fallback=%s", GEMINI_MODEL, GEMINI_FALLBACK_MODEL)
    logger.info("  Catalog:     %s (limit=%d  prompt=%d)",
                JAVA_BACKEND_URL, CATALOG_LIMIT, PROMPT_PRODUCT_LIMIT)
    if not GEMINI_API_KEY:
        logger.warning("  ⚠  GEMINI_API_KEY not set — /chat will return 503")
    else:
        try:
            import urllib.request, json
            url = f"https://generativelanguage.googleapis.com/v1/models?key={GEMINI_API_KEY}"
            with urllib.request.urlopen(url, timeout=5) as r:
                data = json.loads(r.read())
                names = [m["name"] for m in data.get("models", [])
                         if "generateContent" in m.get("supportedGenerationMethods", [])]
                logger.info("  Available Gemini models:")
                for n in names:
                    marker = " ← CURRENT" if GEMINI_MODEL in n else ""
                    logger.info("    %s%s", n, marker)
        except Exception as e:
            logger.warning("  Could not list models: %s", e)
    yield
    logger.info("VSV AI Service shutting down.")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="VSV AI Service",
    version="3.0.0",
    description="Sentiment (HuggingFace RoBERTa) + Smart RAG chatbot (Gemini)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=ReviewAnalysisResponse)
async def analyze_review(request: ReviewAnalysisRequest) -> ReviewAnalysisResponse:
    """
    Sentiment analysis using HuggingFace RoBERTa.

    Unlike the previous Ollama/Gemma approach, this:
      - Runs entirely locally (no external API)
      - Uses a purpose-built 125M param classification model
      - Returns calibrated probability scores in ~50ms
      - No JSON parsing or prompt engineering required
    """
    logger.info("Analyzing review (%d chars)", len(request.comment))

    result = await analyze_sentiment(request.comment)

    return ReviewAnalysisResponse(
        sentiment=result["sentiment"],
        score=result["score"],
        summary=result["summary"],
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    RAG chatbot with smart catalog filtering.

    1. Extract search intent from user message
    2. Fetch products + review summaries concurrently
    3. Score + filter products
    4. Inject relevant products into Gemini system prompt
    5. Call Gemini with conversation history
    """
    logger.info("Chat (history=%d): %.80s", len(request.history), request.message)

    ctx = extract_search_context(request.message, request.history)

    all_products, review_map = await asyncio.gather(
        fetch_all_products(),
        fetch_review_summaries(),
        return_exceptions=True,
    )
    if isinstance(all_products, Exception):
        all_products = []
    if isinstance(review_map, Exception):
        review_map = {}

    for p in all_products:
        pid = p.get("id")
        if pid and pid in review_map:
            p["_reviews"] = review_map[pid]

    relevant = filter_catalog(all_products, ctx)
    catalog  = format_product_catalog(relevant)
    prompt   = build_system_prompt(catalog, ctx)

    reply = await call_gemini(prompt, request.history, request.message)
    if not reply:
        reply = "Îmi pare rău, nu am putut genera un răspuns. Te rog să încerci din nou."

    # Build recommended product cards — only products Gemini actually mentioned
    reply_lower = reply.lower()
    mentioned = []
    not_mentioned = []

    for p in relevant:
        name = (p.get("name") or "").lower()
        brand = (p.get("brand") or "").lower()
        # Check if product name or "brand + descriptor" appears in the reply
        if name and name in reply_lower:
            mentioned.append(p)
        elif brand and any(word in reply_lower for word in name.split() if len(word) > 3):
            mentioned.append(p)
        else:
            not_mentioned.append(p)

    # Show mentioned products first, pad with others if needed (max 4)
    cards_source = (mentioned + not_mentioned)[:4] if mentioned else relevant[:4]

    rec_products = []
    for p in cards_source:
        stock = p.get("stock") or {}
        qty = stock.get("quantity", 0) or 0
        cat = p.get("category") or {}
        rec_products.append(RecommendedProduct(
            id=p.get("id", 0),
            name=p.get("name", ""),
            brand=p.get("brand"),
            price=float(p.get("price", 0)),
            imageUrl=p.get("imageUrl"),
            category=cat.get("name"),
            inStock=qty > 0,
        ))

    logger.info("Reply (products=%d, cards=%d): %.100s",
                len(relevant), len(rec_products), reply)
    return ChatResponse(reply=reply, products=rec_products)


@app.get("/health")
async def health():
    return {
        "status":           "ok",
        "sentiment_model":  MODEL_NAME,
        "sentiment_ready":  MODEL_READY,
        "chat_model":       GEMINI_MODEL,
        "fallback_model":   GEMINI_FALLBACK_MODEL,
        "gemini_ready":     bool(GEMINI_API_KEY),
        "catalog_limit":    CATALOG_LIMIT,
        "prompt_limit":     PROMPT_PRODUCT_LIMIT,
    }