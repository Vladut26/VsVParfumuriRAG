"""
sentiment_service.py — Analiză de sentiment prin HuggingFace Inference API.

Utilizează InferenceClient din huggingface_hub, care rutează cererile prin domeniul principal
huggingface.co (funcționează atunci când api-inference.huggingface.co este blocat).
"""

import httpx
from config import HF_API_KEY, HF_MODEL, logger

MODEL_NAME = HF_MODEL
MODEL_READY = bool(HF_API_KEY)

# Multiple URLs to try — fallback chain
API_URLS = [
    f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}",
    f"https://api-inference.huggingface.co/models/{HF_MODEL}",
]

LABEL_NORMALIZE = {
    "negative": "negative", "neutral": "neutral", "positive": "positive",
    "LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive",
}


async def analyze_sentiment(text: str) -> dict:
    if not HF_API_KEY:
        logger.warning("HF_API_KEY not set — returning fallback")
        return _fallback()

    try:
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        payload = {"inputs": text[:512]}

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = None
            last_err = None

            for url in API_URLS:
                try:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 503:
                        logger.info("HF model loading at %s, retrying in 10s...", url)
                        import asyncio
                        await asyncio.sleep(10)
                        resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        logger.info("HF API succeeded via: %s", url)
                        break
                except Exception as e:
                    last_err = e
                    logger.debug("HF URL failed (%s): %s", url, e)
                    continue

            if resp is None or resp.status_code != 200:
                logger.error("All HF API URLs failed. Last error: %s", last_err)
                return _fallback()

        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            scores_list = data[0] if isinstance(data[0], list) else data
        else:
            return _fallback()

        probs = {"negative": 0.0, "neutral": 0.0, "positive": 0.0}
        for item in scores_list:
            label = LABEL_NORMALIZE.get(item.get("label", ""), "neutral")
            probs[label] = float(item.get("score", 0.0))

        dominant = max(probs, key=probs.get)
        confidence = probs[dominant]

        sentiment = _map_sentiment(dominant, confidence, probs["negative"], probs["positive"])
        score     = _compute_score(probs["negative"], probs["neutral"], probs["positive"])
        summary   = _generate_summary(sentiment, score, confidence)

        logger.info("Sentiment: %s (score=%d, conf=%.2f)", sentiment, score, confidence)
        return {
            "sentiment": sentiment, "score": score, "summary": summary,
            "probabilities": {k: round(v, 4) for k, v in probs.items()},
        }

    except Exception as exc:
        logger.error("Sentiment analysis failed: %s", exc)
        return _fallback()


def _map_sentiment(dominant, confidence, neg_prob, pos_prob):
    if dominant == "neutral": return "mixed"
    if confidence < 0.5: return "mixed"
    if neg_prob > 0.25 and pos_prob > 0.25: return "mixed"
    return dominant

def _compute_score(neg, neu, pos):
    total = pos + neu + neg
    if total == 0: return 3
    raw = 1 + 4 * (pos + 0.5 * neu) / total
    return max(1, min(5, round(raw)))

def _generate_summary(sentiment, score, confidence):
    conf_label = (
        "cu incredere ridicata" if confidence > 0.8
        else "cu incredere moderata" if confidence > 0.5
        else "cu incredere scazuta"
    )
    templates = {
        "positive": {
            5: f"Recenzie foarte pozitiva ({conf_label}). Clientul este extrem de multumit.",
            4: f"Recenzie pozitiva ({conf_label}). Clientul este multumit de produs.",
            3: f"Recenzie usor pozitiva ({conf_label}). Impresie favorabila.",
        },
        "negative": {
            1: f"Recenzie foarte negativa ({conf_label}). Clientul este nemultumit.",
            2: f"Recenzie negativa ({conf_label}). Clientul are rezerve serioase.",
            3: f"Recenzie usor negativa ({conf_label}). Nu este pe deplin satisfacut.",
        },
        "mixed": {k: f"Recenzie mixta ({conf_label}). Opinie echilibrata." for k in range(1, 6)},
    }
    return templates.get(sentiment, templates["mixed"]).get(
        score, f"Recenzie analizata ({conf_label}). Scor: {score}/5."
    )

def _fallback():
    return {
        "sentiment": "mixed", "score": 3,
        "summary": "Analiza sentimentului nu este disponibila momentan.",
        "probabilities": {"negative": 0.33, "neutral": 0.34, "positive": 0.33},
    }