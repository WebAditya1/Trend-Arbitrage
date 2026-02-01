# Trend Arbitrage

A MERN stack app that finds trends before they go mainstream. Instead of using "trending" endpoints (which are already too late), this pulls data from multiple sources and scores them to predict what's about to blow up.

## What This Does

The app monitors Reddit, Hacker News, GitHub, RSS feeds, and Product Hunt to find content that's gaining traction early. It calculates a "rising score" for each item based on engagement, how new it is, and which source it came from. The idea is to catch things while they're still rising, not after they've already peaked.

## Getting Started

You'll need Node.js (v14+), MongoDB, and npm/yarn.

### Setup

1. Clone the repo and install dependencies:
```bash
git clone <your-repo-url>
cd trend-arbitrage
npm run install-all
```

2. Create a `.env` file in the `server` directory:
```env
MONGODB_URI=mongodb://localhost:27017/trend-arbitrage
PORT=5000
NODE_ENV=development

# Optional - GitHub token increases rate limits from 60 to 5000 req/hour
# Get one at: https://github.com/settings/tokens
GITHUB_TOKEN=your_github_token_here

# Optional - Reddit API creds (not needed, we scrape instead)
# Get them at: https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

The app works fine without any API keys. I set it up so all sources work without authentication. Keys just give you higher rate limits.

3. Start MongoDB:
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or Docker
docker run -d -p 27017:27017 mongo
```

4. Run it:
```bash
npm run dev
```

This starts both server (port 5000) and client (port 3000). Or run them separately if you prefer.

5. Open `http://localhost:3000` in your browser.

## Data Sources

I'm pulling from 5 sources:

**Reddit** - Scrapes `/r/all/rising` JSON endpoint. No auth needed, just hit their public API. Focuses on posts less than 6 hours old. Reddit's rising section is perfect because it shows stuff before it hits the front page.

**Hacker News** - Uses their public Firebase API. No rate limits, no auth. Grabs new stories less than 6 hours old. HN's new section often has interesting stuff before it trends.

**GitHub** - REST API for repos created in the last 7 days, sorted by stars. Works without a token (60 req/hour limit), but you can add a token to bump it to 5000. New repos gaining stars quickly usually means something interesting is happening.

**RSS Feeds** - Parses TechCrunch, The Verge, and O'Reilly Radar. Just standard RSS parsing, nothing fancy. Looks at posts less than 24 hours old.

**Product Hunt** - This one was tricky. Their API requires auth and approval, so I'm scraping their homepage with Cheerio. It's a bit fragile (HTML changes break it), but I added fallback logic. Product Hunt is great because products that gain traction there often represent real emerging trends before they spread elsewhere.

## How the Scoring Works

The rising score combines a few things:

- **Engagement (50%)** - Upvotes, comments, stars, etc. Comments are weighted 2x more than upvotes because discussion usually means real interest, not just bots.

- **Recency (30%)** - Newer stuff scores higher. Less than 1 hour gets 20 points, 1-3 hours gets 15, 3-6 hours gets 10, 6-12 hours gets 5, older gets 0.

- **Source Bonus (20%)** - Each source has its own logic. Reddit uses upvote ratio, HN uses comment-to-score ratio, GitHub uses stars, Product Hunt uses votes, RSS just gets a base bonus.

The formula is basically: `(engagement * 0.5) + (recency * 0.3) + (source_bonus * 0.2)`

I tried to balance it so it catches things that are accelerating, not just things that are already popular. The recency bonus helps prioritize fresh content, and the source bonuses add some validation.

## How It Works

The server runs a cron job every 15 minutes that:
1. Fetches data from all 5 sources in parallel
2. Calculates a rising score for each item
3. Saves/updates them in MongoDB (same URL = update, new URL = create)

The frontend pulls from MongoDB and displays trends sorted by score. It auto-refreshes every 5 minutes, or you can hit the refresh button.

MongoDB stores everything so we don't have to recalculate scores on every request. It also handles deduplication (same URL = update existing record) and tracks when trends were first seen.

## Features

- View trends from all sources or filter by source
- Filter by minimum rising score
- Trend clustering - groups related trends together (the buzzword feature)
- Switch between individual trends and clusters
- Manual refresh button
- Auto-refresh every 15 min (server) and 5 min (client)

## API Endpoints

`GET /api/trends` - Get trends. Query params: `limit`, `minScore`, `clustered`

`POST /api/trends/refresh` - Manually trigger a refresh

`GET /api/trends/sources/:source` - Get trends from a specific source

`GET /api/trends/clusters` - Get trend clusters

## Trend Clustering (Buzzwords)

I implemented the optional clustering feature. It groups trends that share keywords or have similar titles. Uses Jaccard similarity for title matching and keyword overlap for grouping.

If "GPT-5", "OpenAI announcement", and "ChatGPT update" are all trending, they get grouped into one cluster with a buzzword like "GPT" or "OpenAI". The UI has a toggle to switch between individual trends and clusters.

## Handling API Restrictions

**Reddit** - Their official API needs OAuth which is annoying, so I just hit their public JSON endpoints. Works fine, might be less reliable long-term but it's good enough for this.

**Product Hunt** - API requires auth and approval. Scraping their homepage works but it's fragile. I added fallback logic that tries multiple endpoints and also extracts JSON from script tags (React apps often embed data there).

**GitHub** - Public API works without auth, just rate-limited. Handles 403 errors gracefully and suggests adding a token.

**Hacker News** - Public Firebase API, no restrictions.

**RSS** - Just standard RSS feeds, no restrictions.

## Assumptions & Trade-offs

I assumed MongoDB is available and all sources need internet access. Everything uses UTC for timestamps.

Trade-offs:
- Scraping instead of proper APIs for Reddit/Product Hunt - less reliable but works immediately
- Simple keyword extraction (just stop-word filtering) - could use TF-IDF or embeddings but this works
- Fixed scoring weights - not adaptive, but simple and predictable
- No historical tracking - just current state, no velocity over time
- Basic error handling - try-catch and continue, no retries or circuit breakers

For production I'd use proper APIs with auth, add retry logic, maybe use Redis for caching, and track trend history over time. But for a prototype this works.

## What I'd Improve

- Better clustering with TF-IDF or word embeddings
- Historical tracking to show trend velocity over time
- Retry logic and circuit breakers for failed API calls
- User accounts and saved trends
- ML model for adaptive scoring weights
- Redis caching layer
- Dark mode and trend charts

## Known Issues

- GitHub hits rate limits without a token (60 req/hour) - it handles this gracefully
- Reddit scraping might get rate-limited
- Product Hunt scraping breaks if their HTML changes (has fallback logic)
- RSS feeds sometimes timeout
- MongoDB connection errors don't retry automatically

## Project Structure

```
trend-arbitrage/
├── server/
│   ├── index.js              # Express server
│   ├── routes/trends.js      # API routes
│   ├── services/
│   │   ├── sources/          # Data source files
│   │   └── scoring.js        # Scoring algorithm
│   └── models/Trend.js       # MongoDB schema
├── client/
│   └── src/                  # React app
└── README.md
```