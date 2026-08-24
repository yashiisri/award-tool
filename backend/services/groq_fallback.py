"""
groq_fallback.py
─────────────────
Centralised Groq model fallback. Every service that calls Groq should go
through call_with_fallback() instead of calling client.chat.completions.create()
directly with one hardcoded model — this account's free-tier daily token
quota (TPD) is shared per-model, and openai/gpt-oss-120b alone has already
exhausted it mid-session before (200000/200000 used), which used to make
every single LLM-dependent call fail for the rest of the day with no
recovery path. Rotating to a fresh model on that specific failure keeps the
pipeline working instead of hard-failing until the quota resets.
"""

import asyncio
import logging

from groq import AsyncGroq, RateLimitError

logger = logging.getLogger(__name__)

# Tried in order. Each has its own independent daily token budget on this
# account, so when the first is exhausted the others can still serve
# requests. Ordered strongest/preferred first.
FALLBACK_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"]


def _extra_body_for(model: str, extra_body: dict | None) -> dict | None:
    """reasoning_effort's accepted values differ by model family — gpt-oss
    models take low/medium/high, qwen only takes none/default. Sending "low"
    to qwen is a hard 400, so remap it per-model instead of forwarding the
    same extra_body to every model in the fallback chain unchanged."""
    if not extra_body or "reasoning_effort" not in extra_body:
        return extra_body
    if model.startswith("qwen/") and extra_body["reasoning_effort"] not in ("none", "default"):
        remapped = dict(extra_body)
        remapped["reasoning_effort"] = "none"
        return remapped
    return extra_body


def _is_daily_quota_exhausted(exc: Exception) -> bool:
    """True for a Groq 429 caused by the DAILY (TPD) token cap, as opposed to
    a per-minute burst limit. TPD exhaustion won't clear for potentially
    hours, so retrying the same model is pointless — move to the next model
    immediately instead of burning the retry budget on a dead end."""
    if not isinstance(exc, RateLimitError):
        return False
    msg = str(exc).lower()
    return "tokens per day" in msg or "(tpd)" in msg


async def call_with_fallback(
    client: AsyncGroq,
    *,
    messages: list[dict],
    temperature: float = 0.2,
    max_tokens: int | None = None,
    extra_body: dict | None = None,
    models: list[str] | None = None,
    attempts_per_model: int = 2,
):
    """Calls Groq chat completions, trying each model in `models` (default
    FALLBACK_MODELS) in order. A daily-quota 429 skips straight to the next
    model with no wasted retry; any other error (transient 429, timeout,
    server hiccup) gets `attempts_per_model` tries with short backoff before
    moving on. Raises the last exception if every model in the chain fails."""
    models = models or FALLBACK_MODELS
    last_exc: Exception | None = None

    for model in models:
        for attempt in range(1, attempts_per_model + 1):
            try:
                kwargs = dict(model=model, messages=messages, temperature=temperature)
                if max_tokens is not None:
                    kwargs["max_tokens"] = max_tokens
                model_extra_body = _extra_body_for(model, extra_body)
                if model_extra_body is not None:
                    kwargs["extra_body"] = model_extra_body
                return await client.chat.completions.create(**kwargs)
            except Exception as exc:
                last_exc = exc
                if _is_daily_quota_exhausted(exc):
                    logger.warning(
                        "call_with_fallback: %s exhausted its daily quota, switching model", model,
                    )
                    break
                logger.warning("call_with_fallback: %s attempt %d failed: %s", model, attempt, exc)
                if attempt < attempts_per_model:
                    await asyncio.sleep(2 ** attempt)

    raise last_exc
