# GET SELECTED

**Practice. Prepare. Get Selected.**

A completely **free** engineering placement preparation platform. Practice questions, take timed tests, solve coding problems, track your performance and get AI-powered analysis — no subscriptions, no paywalls.

## Features

- **Practice** — filter by subject, topic, difficulty; practice weak topics, unattempted or bookmarked questions.
- **Timed Tests** — quick quizzes, sectional tests, full mocks and company tests with negative marking, randomization, attempt limits, palette navigation and auto-submit on timeout. Score, percentile and rank after every test.
- **Daily Challenge** — a fresh Aptitude + Reasoning + Technical + Coding challenge every day, auto-generated.
- **Coding Practice** — curated programming, DSA and SQL problems with examples, approach and reference solutions (Phase 1 records submissions; code execution is planned for Phase 2).
- **Company Preparation** — per-company prep pages with focus areas, test series and coding problems. Practice content only, clearly not affiliated with any company.
- **Analytics** — subject/topic/difficulty performance, score trends and daily activity charts.
- **AI Performance Analysis** — uses any OpenAI-compatible API (or a deterministic fallback) to summarize strengths and weaknesses. No data leaves through the AI key; when the key is absent a clearly-labelled fallback is used.
- **Leaderboard & Ranking** — all-India and 7-day ranks with percentiles.
- **Admin Panel** — manage questions (with CSV/JSON bulk import), tests, companies, coding problems, users and the daily challenge.
- **Search** — global search over questions, tests, companies and coding problems.

## Tech Stack

- Node.js + Express (server)
- EJS + vanilla JavaScript (views, no build step)
- MongoDB + Mongoose (data)
- express-session + connect-mongo (sessions)
- bcryptjs (password hashing)
- express-rate-limit (auth rate limiting)
- multer + csv-parse (bulk question import)
- Chart.js + Lucide icons (CDN)

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database — local (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas cluster

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Port to run on (Render injects this in production) |
| `MONGODB_URI` | MongoDB connection string |
| `SESSION_SECRET` | Long random string used to sign session cookies |
| `BASE_URL` | Public URL of the app |
| `AI_BASE_URL` | OpenAI-compatible API base URL (e.g. `https://api.openai.com/v1`) |
| `AI_API_KEY` | API key (optional — fallback analysis is used if empty) |
| `AI_MODEL` | Model name (e.g. `gpt-4o-mini`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin account created by the seed script |

### 3. Seed the database

```bash
node seed/seed.js
```

This creates 6 subjects, 55 topics, 170+ questions, 11 coding problems, 10 tests, 9 companies and the admin account.

- Add `--reset` to wipe the collections first: `node seed/seed.js --reset`
- Admin login: `admin@getselected.in` / `Admin@12345` (or your `ADMIN_EMAIL`/`ADMIN_PASSWORD`)
- **Automatic on first boot**: the server seeds automatically when it starts if the database is empty (`server.js` checks the questions collection). On Render, a fresh empty database is populated on the first deploy with no manual step.

### 4. Run

```bash
npm run dev    # nodemon, auto-restart
npm start      # plain node
```

Open http://localhost:5000

### Local development without installing MongoDB

The repo includes `mongodb-memory-server` for local testing without a MongoDB install:

```bash
node scripts/dev-mongo.js
# copy the printed URI, then in another terminal:
#   set MONGODB_URI=mongodb://127.0.0.1:PORT/getselected
node seed/seed.js
npm run dev
```

### Smoke test

`scripts/smoke-test.js` boots an in-memory MongoDB, seeds, and exercises auth, practice, tests, daily challenge, coding and the admin panel:

```bash
node scripts/smoke-test.js
```

## Deployment (Render)

1. Push this repo to GitHub.
2. In Render, create a **Web Service** pointing at the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the environment variables from `.env` (set `NODE_ENV=production`). Use a MongoDB Atlas cluster for `MONGODB_URI`.
6. Deploy. The database is seeded automatically on first boot if it's empty — no manual step required.

## Project Structure

```
├── config/          # Database connection
├── controllers/     # Route handlers
├── middleware/      # Auth, admin, flash, activity tracking
├── models/          # Mongoose models
├── public/          # CSS, JS, favicon
├── routes/          # Express routers
├── scripts/         # dev-mongo.js, smoke-test.js
├── seed/            # Seed script + question content
├── services/        # Grading, ranking, analytics, AI
└── views/           # EJS templates (public, auth, student, coding, admin)
```

## Troubleshooting

- **`MONGODB_URI` required** — the seed and app need a valid MongoDB connection string.
- **Blank AI analysis** — set `AI_API_KEY` (and if needed `AI_BASE_URL`/`AI_MODEL`). Without a key the app uses a built-in fallback so the page still works.
- **Cookies don't persist in production** — make sure `NODE_ENV=production` so the session cookie is flagged `Secure` (HTTPS required on Render).
- **Timeouts connecting to Atlas** — check network rules / allow all IPs (0.0.0.0/0) for the cluster, at least during setup.

## License

This is a student project. All content is original practice material created for educational purposes and is not affiliated with any company.
