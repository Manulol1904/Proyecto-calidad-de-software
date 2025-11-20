"""
Lightweight profiling runner that hits critical endpoints and writes a cProfile report.
Usage:
  python backend/tools/profile_endpoints.py --endpoints / /health /expenses --requests 50

It uses httpx to perform synchronous requests and cProfile to profile the Python runtime
of this script (helps identify client-side bottlenecks when running many requests).
For server-side profiling use cProfile inside the server process or use remote profilers.
"""
import argparse
import cProfile
import pstats
import sys
import time
import httpx


def run_requests(base_url, endpoints, n_requests=100):
    client = httpx.Client(base_url=base_url, timeout=10.0)
    timings = {}
    for ep in endpoints:
        timings[ep] = []

    for i in range(n_requests):
        for ep in endpoints:
            start = time.perf_counter()
            try:
                r = client.get(ep)
                status = r.status_code
            except Exception as e:
                status = None
                print(f"Request error for {ep}: {e}")
            elapsed = (time.perf_counter() - start) * 1000
            timings[ep].append(elapsed)

    client.close()
    return timings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8000", help="Base URL for API")
    parser.add_argument("--endpoints", nargs="+", default=["/", "/health"], help="List of endpoints to hit")
    parser.add_argument("--requests", type=int, default=20, help="Number of times to repeat the sequence")
    parser.add_argument("--out", default="profile_stats.txt", help="Output pstats file")
    args = parser.parse_args()

    profiler = cProfile.Profile()
    profiler.enable()

    timings = run_requests(args.base, args.endpoints, args.requests)

    profiler.disable()

    # Save stats
    with open(args.out, "w") as f:
        ps = pstats.Stats(profiler, stream=f).sort_stats("cumtime")
        ps.print_stats()

    # Print simple timing summary
    for ep, tlist in timings.items():
        tlist_sorted = sorted(tlist)
        print(f"Endpoint {ep}: {len(tlist)} requests | min={tlist_sorted[0]:.2f}ms | median={tlist_sorted[len(tlist)//2]:.2f}ms | p95={tlist_sorted[int(len(tlist)*0.95)-1]:.2f}ms | max={tlist_sorted[-1]:.2f}ms")

    print(f"Wrote profile stats to {args.out}")


if __name__ == "__main__":
    main()
