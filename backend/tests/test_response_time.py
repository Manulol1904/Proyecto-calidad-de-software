import os
import time
import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
@pytest.mark.performance
async def test_health_response_time():
    """Measure response time for /health endpoint"""
    threshold_ms = int(os.getenv("RESPONSE_TIME_THRESHOLD_MS", "500"))

    async with AsyncClient(app=app, base_url="http://testserver") as ac:
        start = time.monotonic()
        r = await ac.get("/health")
        elapsed_ms = (time.monotonic() - start) * 1000

    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert elapsed_ms <= threshold_ms, f"/health too slow: {elapsed_ms:.0f}ms > {threshold_ms}ms"


@pytest.mark.asyncio
@pytest.mark.performance
async def test_root_response_time():
    """Measure response time for root endpoint (/)

    This is a lightweight performance check to detect regressions.
    Threshold can be adjusted via RESPONSE_TIME_THRESHOLD_MS environment variable.
    """
    threshold_ms = int(os.getenv("RESPONSE_TIME_THRESHOLD_MS", "500"))

    async with AsyncClient(app=app, base_url="http://testserver") as ac:
        start = time.monotonic()
        r = await ac.get("/")
        elapsed_ms = (time.monotonic() - start) * 1000

    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert elapsed_ms <= threshold_ms, f"/ too slow: {elapsed_ms:.0f}ms > {threshold_ms}ms"
