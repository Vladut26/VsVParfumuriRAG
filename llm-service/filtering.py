"""
filtering.py — Prefiltrare inteligentă a catalogului pentru chatbot-ul RAG.

Extrage intenția utilizatorului (note de parfum, limite de preț, branduri, categorii) din mesajul de chat
și acordă scoruri produselor pentru a le selecta doar pe cele mai relevante în vederea introducerii lor în prompt-ul Gemini.
"""
import re

from config import (
    HistoryMessage, PROMPT_PRODUCT_LIMIT, MIN_FILTER_RESULTS, logger,
)

# ── Scent synonyms (Romanian ↔ English) 
SCENT_SYNONYMS: dict[str, list[str]] = {
    "cafea":     ["cafea", "coffee", "cafe"],
    "coffee":    ["cafea", "coffee", "cafe"],
    "vanilie":   ["vanilie", "vanilla"],
    "vanilla":   ["vanilie", "vanilla"],
    "floral":    ["floral", "floare", "trandafir", "iasomie", "rose", "jasmine"],
    "floare":    ["floral", "floare", "trandafir", "iasomie"],
    "trandafir": ["trandafir", "rose", "floral"],
    "rose":      ["trandafir", "rose", "floral"],
    "lemn":      ["lemn", "lemnos", "woody", "santal", "cedru", "oud"],
    "lemnos":    ["lemn", "lemnos", "woody", "santal"],
    "woody":     ["lemn", "lemnos", "woody", "santal", "cedru"],
    "oud":       ["oud", "lemn", "lemnos", "woody"],
    "citrice":   ["citrice", "citrus", "bergamot", "lamaie", "portocala", "lemon"],
    "citrus":    ["citrice", "citrus", "bergamot"],
    "bergamot":  ["bergamot", "citrice", "citrus"],
    "fresh":     ["fresh", "proaspat", "aqua", "marin"],
    "proaspat":  ["fresh", "proaspat", "aqua"],
    "marin":     ["marin", "aqua", "fresh"],
    "oriental":  ["oriental", "amber", "ambra", "picant", "spicy"],
    "amber":     ["amber", "ambra", "oriental"],
    "ambra":     ["amber", "ambra", "oriental"],
    "mosc":      ["mosc", "musk", "musc"],
    "musk":      ["mosc", "musk", "musc"],
    "picant":    ["picant", "spicy", "piper", "condimentat"],
    "spicy":     ["picant", "spicy"],
    "fructat":   ["fructat", "fruity", "fructe", "berry"],
    "fruity":    ["fructat", "fruity", "fructe"],
    "piele":     ["piele", "leather", "cuir"],
    "leather":   ["piele", "leather"],
    "tutun":     ["tutun", "tobacco"],
    "tobacco":   ["tutun", "tobacco"],
    "pudrat":    ["pudrat", "powder", "powdery", "iris"],
    "powder":    ["pudrat", "powder", "powdery"],
}

# Price regex 
PRICE_LIMIT_RE = re.compile(
    r"(?:sub|pana la|mai ieftin de|max|maximum|pret\s*max(?:im)?)\s*(\d+)",
    re.IGNORECASE,
)
PRICE_MIN_RE = re.compile(
    r"(?:peste|mai scump de|de la|minim|min)\s*(\d+)",
    re.IGNORECASE,
)

# Known brands 
KNOWN_BRANDS = [
    "chanel", "dior", "gucci", "tom ford", "versace", "ysl", "armani",
    "hermès", "hermes", "creed", "jo malone", "paco rabanne", "givenchy",
    "burberry", "bvlgari", "valentino",
]

#  Category keywords 
CATEGORY_MAP: dict[str, list[str]] = {
    "eau de parfum":   ["eau de parfum", "edp"],
    "eau de toilette": ["eau de toilette", "edt"],
    "parfum":          ["parfum", "extrait"],
    "cologne":         ["cologne", "edc"],
    "elixir":          ["elixir"],
}


#  Public API 

def extract_search_context(message: str, history: list[HistoryMessage]) -> dict:
    """
    Parse the current user message to extract search intent:
    scent keywords, price limits, brands, categories, stock preference.
    """
    text_lower = message.lower()

    # Scent keywords
    scent_terms: set[str] = set()
    for keyword, synonyms in SCENT_SYNONYMS.items():
        if keyword in text_lower:
            scent_terms.update(synonyms)

    # Price limits
    price_max = None
    price_min = None
    for m in PRICE_LIMIT_RE.finditer(text_lower):
        val = float(m.group(1))
        price_max = val if price_max is None else min(price_max, val)
    for m in PRICE_MIN_RE.finditer(text_lower):
        val = float(m.group(1))
        price_min = val if price_min is None else max(price_min, val)

    # Brand mentions
    brands = [b for b in KNOWN_BRANDS if b in text_lower]

    # Category mentions
    categories: list[str] = []
    for cat, keywords in CATEGORY_MAP.items():
        if any(kw in text_lower for kw in keywords):
            categories.append(cat)

    # Stock preference
    exclude_outofstock = any(
        phrase in text_lower
        for phrase in ["in stoc", "disponibil", "disponibile", "sa fie pe stoc"]
    )

    ctx = {
        "scent_terms":        list(scent_terms),
        "price_max":          price_max,
        "price_min":          price_min,
        "brands":             brands,
        "categories":         categories,
        "exclude_outofstock": exclude_outofstock,
    }
    logger.info("Extracted search context: %s", ctx)
    return ctx


def score_product(product: dict, ctx: dict) -> int:
    """Score a product against the search context. 0 = hard-rejected."""
    name        = (product.get("name")        or "").lower()
    brand       = (product.get("brand")       or "").lower()
    description = (product.get("description") or "").lower()
    category    = product.get("category") or {}
    cat_name    = (category.get("name") or "").lower()
    features    = [f.lower() for f in (category.get("features") or [])]
    price       = float(product.get("price") or 0)
    stock_qty   = (product.get("stock") or {}).get("quantity", 0) or 0

    score = 0

    if ctx["exclude_outofstock"] and stock_qty <= 0:
        return 0
    if ctx["price_max"] is not None and price > ctx["price_max"]:
        return 0
    if ctx["price_min"] is not None and price < ctx["price_min"]:
        return 0

    searchable = " ".join([name, brand, description, cat_name] + features)
    for term in ctx["scent_terms"]:
        if term in searchable:
            if any(term in f for f in features):
                score += 10
            elif term in name:
                score += 6
            elif term in description:
                score += 3
            else:
                score += 1

    for b in ctx["brands"]:
        if b in brand or b in name:
            score += 8

    for cat in ctx["categories"]:
        if cat in cat_name:
            score += 5

    if stock_qty > 0:
        score += 1

    return score


def filter_catalog(products: list[dict], ctx: dict) -> list[dict]:
    """Score and filter products. Falls back if too few match."""
    has_filters = bool(
        ctx["scent_terms"] or ctx["price_max"] is not None
        or ctx["price_min"] is not None or ctx["brands"]
        or ctx["categories"] or ctx["exclude_outofstock"]
    )

    if not has_filters:
        logger.info("No filter context — using full catalog (capped at %d)", PROMPT_PRODUCT_LIMIT)
        return products[:PROMPT_PRODUCT_LIMIT]

    scored = [(score_product(p, ctx), p) for p in products]
    matching = [(s, p) for s, p in scored if s > 0]
    matching.sort(key=lambda x: x[0], reverse=True)

    if len(matching) < MIN_FILTER_RESULTS:
        logger.info("Only %d matched — falling back to price-filtered catalog", len(matching))
        fallback = [
            p for p in products
            if (ctx["price_max"] is None or float(p.get("price") or 0) <= ctx["price_max"])
            and (ctx["price_min"] is None or float(p.get("price") or 0) >= ctx["price_min"])
        ]
        return fallback[:PROMPT_PRODUCT_LIMIT] if fallback else products[:PROMPT_PRODUCT_LIMIT]

    result = [p for _, p in matching[:PROMPT_PRODUCT_LIMIT]]
    logger.info(
        "Filtered catalog: %d → %d products (top score=%d)",
        len(products), len(result), matching[0][0] if matching else 0,
    )
    return result