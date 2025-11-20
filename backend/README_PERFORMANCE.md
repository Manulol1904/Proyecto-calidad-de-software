Performance testing guide

This document describes how to run load tests, profiling and frontend bundle analysis for the project.

1) Load testing with Locust

- Install Locust (recommended in a virtualenv):

```bash
pip install locust
```

- Configure test user credentials as environment variables (optional):

```bash
export LOCUST_TEST_EMAIL=test_locust@example.com
export LOCUST_TEST_PASSWORD=testpass123
```

- Run headless Locust (100 users, spawn rate 10 users/s, duration 2m):

```bash
cd backend
locust -f tools/locustfile.py --host http://localhost:8000 --headless -u 100 -r 10 -t 2m
```

- To run the web UI:

```bash
locust -f tools/locustfile.py --host http://localhost:8000
# then open http://localhost:8089
```

Notes:
- The locustfile hits `/health`, `/` and authenticated endpoints (`/auth/login`, `/expenses`).
- Ensure the test user exists in the DB (you can create a user via /auth/register or via fixtures).

2) Profiling backend endpoints (cProfile)

A lightweight script `backend/tools/profile_endpoints.py` is included. It performs a number of requests against the API and writes a cProfile report.

Example:

```bash
python backend/tools/profile_endpoints.py --base http://localhost:8000 --endpoints / /health /expenses --requests 50 --out profile_stats.txt
```

Open `profile_stats.txt` to inspect the functions consuming most time. For server-side profiling, prefer running cProfile inside the FastAPI process or use remote profilers (py-spy, yappi) for production profiling.

3) MongoDB query analysis

- Use `explain()` in the mongo shell to check indexes and query plans:

```js
use expense_tracker
db.expenses.explain("executionStats").find({ user_id: ObjectId("<id>") }).sort({date: -1}).limit(10)
```

- Check slow query log and enable profiler in dev:

```js
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ts:-1}).limit(10)
```

- Ensure indexes exist for `user_id`, `date` and `category` (the app already creates several indexes on startup).

4) Frontend bundle analysis

This project uses Vite. To analyze bundle size:

- Install visualizer plugin:

```bash
cd mi-app
npm install --save-dev rollup-plugin-visualizer
```

- Add plugin in `vite.config.js` (example):

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [react(), visualizer({ filename: 'dist/stats.html' })]
})
```

- Build and open the visual report:

```bash
npm run build
# open mi-app/dist/stats.html
```

- Use Lighthouse in Chrome DevTools to measure performance metrics (TTFB, FCP, LCP, Total Blocking Time).

5) CI recommendations

- Add a separate pipeline job for performance checks (locust/ab tests) that runs periodically (nightly) and fails only on severe regressions.
- Store baseline metrics and compare new runs to detect regressions.

---
If you want, I can:
- Run a sample Locust headless test here (I can install locust if you allow). Note: it will generate load on your local server.
- Run the profiling script against your local server and attach the `profile_stats.txt` output.
- Add a Vite plugin snippet to `vite.config.js` in your repo (I can modify the file).

Which of the above do you want me to run or implement now?
