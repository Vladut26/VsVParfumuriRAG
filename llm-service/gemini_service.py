"""
gemini_service.py — Logica chatbot-ului Gemini RAG.

Se ocupă cu:

Preluarea în timp real a catalogului de produse de la backend-ul Java
Preluarea rezumatelor de recenzii pentru îmbogățirea contextului
Construirea prompt-ului de sistem cu catalogul prefiltrat
Apelarea API-ului Gemini cu mecanism de reîncercare (retry) + comutare pe un model de rezervă (fallback) în caz de eroare
"""
import asyncio

import httpx
from google import genai
from google.genai import types as genai_types
from fastapi import HTTPException

from config import (
    GEMINI_API_KEY, GEMINI_MODEL, GEMINI_FALLBACK_MODEL,
    JAVA_BACKEND_URL, CATALOG_LIMIT,
    HistoryMessage, logger,
)


#  Catalog fetching 

async def fetch_all_products() -> list[dict]:
    """Fetch the full product catalog from the Java backend."""
    url = f"{JAVA_BACKEND_URL}/api/products?size={CATALOG_LIMIT}&page=0"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
    except Exception as exc:
        logger.warning("Could not fetch catalog: %s", exc)
        return []
    data = resp.json()
    return data.get("content", data) if isinstance(data, dict) else data


async def fetch_review_summaries() -> dict[int, dict]:
    """Fetch aggregated review stats per product for prompt enrichment."""
    url = f"{JAVA_BACKEND_URL}/api/reviews/summary"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                return {item["productId"]: item for item in data}
    except Exception as exc:
        logger.debug("Could not fetch review summaries: %s", exc)
    return {}


#  Prompt building 

def format_product_catalog(products: list[dict]) -> str:
    """Format filtered products as compact text for the Gemini prompt."""
    if not products:
        return "Nu există produse disponibile în catalog."

    lines = []
    for p in products:
        name     = p.get("name", "Produs necunoscut")
        brand    = p.get("brand") or ""
        price    = p.get("price", "?")
        category = (p.get("category") or {}).get("name", "Parfum")
        stock    = p.get("stock") or {}
        qty      = stock.get("quantity", 0)
        features = (p.get("category") or {}).get("features") or []
        reviews  = p.get("_reviews") or {}

        stock_str  = f"în stoc ({qty} buc.)" if qty and qty > 0 else "EPUIZAT"
        brand_str  = f" de {brand}"          if brand            else ""
        feat_str   = f" | Note: {', '.join(features)}" if features else ""
        review_str = ""
        if reviews.get("totalReviews", 0) > 0:
            review_str = (
                f" | ⭐ {reviews['averageRating']:.1f}/5"
                f" ({reviews['totalReviews']} recenzii"
                f", sentiment: {reviews.get('dominantSentiment', 'mixt')})"
            )

        lines.append(
            f"• {name}{brand_str} ({category}) — {price} RON — {stock_str}{feat_str}{review_str}"
        )
    return "\n".join(lines)


def build_system_prompt(catalog: str, ctx: dict) -> str:
    """Build the Gemini system prompt with catalog and filter context."""
    filter_note = ""
    if ctx.get("scent_terms") or ctx.get("brands") or ctx.get("categories"):
        applied = []
        if ctx["scent_terms"]:
            applied.append(f"note olfactive: {', '.join(ctx['scent_terms'][:5])}")
        if ctx["brands"]:
            applied.append(f"brand: {', '.join(ctx['brands'])}")
        if ctx["categories"]:
            applied.append(f"categorie: {', '.join(ctx['categories'])}")
        if ctx.get("price_max"):
            applied.append(f"preț maxim: {ctx['price_max']} RON")
        filter_note = (
            f"\nACEST CATALOG ESTE FILTRAT DUPĂ: {', '.join(applied)}. "
            "Dacă nu există suficiente opțiuni potrivite, spune-i clientului "
            "și sugerează alternative din lista de mai jos."
        )

    return (
        "Ești un asistent de cumpărături prietenos pentru VSV Parfumuri, "
        "un magazin online de parfumuri și cosmetice din România.\n"
        "Misiunea ta este să ajuți clienții să găsească produsul perfect.\n\n"
        "REGULI IMPORTANTE:\n"
        "1. Recomandă NUMAI produse din catalogul de mai jos. Nu inventa produse.\n"
        "2. Dacă un produs este EPUIZAT, spune-i clientului și sugerează o alternativă.\n"
        "3. Răspunde în limba română, prietenos și concis (2–4 propoziții).\n"
        "4. Menționează întotdeauna prețul în RON când recomanzi un produs.\n"
        "5. Nu folosi formatare markdown — răspunde cu text simplu.\n"
        "6. Dacă clientul cere ceva ce nu există, spune-i sincer și "
        "sugerează cele mai apropiate alternative.\n"
        "7. IMPORTANT: Răspunde ÎNTOTDEAUNA cu propoziții complete și terminate cu punct. "
        "Dacă nu ai spațiu, termină fraza curentă și scrie "
        "'Scrie-mi pentru mai multe recomandări!' — nu lăsa niciodată o frază la jumătate.\n"
        "8. Când listezi produse, folosește maxim 4-5 produse pe răspuns.\n"
        f"{filter_note}\n\n"
        f"CATALOGUL DISPONIBIL:\n{catalog}"
    )


#  Gemini API call 

async def call_gemini(
    system_prompt: str,
    history: list[HistoryMessage],
    message: str,
) -> str:
    """
    Call Gemini with conversation history and system prompt.
    Retries on 429/503 and falls back to the secondary model.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY is not configured.")

    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=genai_types.HttpOptions(api_version="v1"),
    )

    # Build conversation contents
    recent = history[-20:] if len(history) > 20 else history
    contents = [
        genai_types.Content(
            role="model" if msg.role == "assistant" else "user",
            parts=[genai_types.Part(text=msg.content)],
        )
        for msg in recent
    ]

    # Append current message with system prompt
    full_message = f"{system_prompt}\n\n---\n\nÎntrebarea clientului: {message}"
    contents.append(genai_types.Content(
        role="user",
        parts=[genai_types.Part(text=full_message)],
    ))

    config = genai_types.GenerateContentConfig(
        temperature=0.7,
        max_output_tokens=2048,
    )

    last_exc = None
    models_to_try = [GEMINI_MODEL, GEMINI_MODEL, GEMINI_FALLBACK_MODEL]

    for attempt, model_name in enumerate(models_to_try):
        try:
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=contents,
                config=config,
            )
            if model_name != GEMINI_MODEL:
                logger.info("Used fallback model %s successfully", model_name)
            return response.text.strip()
        except Exception as exc:
            last_exc = exc
            exc_str  = str(exc)
            is_retryable = any(
                tag in exc_str
                for tag in ("429", "503", "RESOURCE_EXHAUSTED", "UNAVAILABLE")
            )
            if is_retryable:
                if attempt == 1:
                    logger.warning(
                        "Primary model %s unavailable, switching to fallback %s",
                        GEMINI_MODEL, GEMINI_FALLBACK_MODEL,
                    )
                else:
                    wait = (attempt + 1) * 8
                    logger.warning(
                        "Gemini %s unavailable, retrying in %ds (attempt %d/3)",
                        model_name, wait, attempt + 1,
                    )
                    await asyncio.sleep(wait)
            else:
                logger.error("Gemini API error: %s", exc)
                raise HTTPException(502, f"Eroare Gemini API: {exc}") from exc

    logger.error("All Gemini models failed. Last error: %s", last_exc)
    raise HTTPException(
        503,
        "Asistentul AI este temporar indisponibil. Încearcă din nou în câteva secunde.",
    )