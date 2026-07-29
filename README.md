# Ecommerce Cache Demo

A learning project that demonstrates multi-layer caching strategies across a full-stack application. The frontend (React + TypeScript + Vite) connects to a lightweight FastAPI backend with mock product data and an in-memory cache layer that simulates Redis behaviour.

Each button on the UI exercises a different cache layer so you can observe where data is served from and how fast it responds.

---

## Cache Layers Demonstrated

| Layer | Technology | Scope |
|---|---|---|
| Server-side cache | MockRedis (in-memory, 10s TTL) | Shared across all clients |
| Redux store | Redux Toolkit | Per browser tab, survives re-renders |
| JS in-memory cache | Plain JS object | Per page load |
| LocalStorage | Web Storage API | Persists across sessions |
| SessionStorage | Web Storage API | Current tab/session only |
| IndexedDB | Browser IDB API | Persistent structured storage |
| Browser Cache API | Cache API spec | Network request cache |

---

## Project Structure

```
ecommerce-cache-demo/
├── backend/
│   ├── main.py               # FastAPI app, mock DB, MockRedis, endpoint
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.tsx           # Root component, cache orchestration
│   │   │   ├── HeavyHero.tsx     # Lazy-loaded banner (code splitting demo)
│   │   │   ├── ProductCard.tsx   # Memoized product card (React.memo)
│   │   │   └── ProductList.tsx   # useMemo + useCallback demo
│   │   ├── store/
│   │   │   └── store.ts          # Redux Toolkit slice + async thunk
│   │   └── utils/
│   │       └── db.ts             # IndexedDB helper
│   ├── Dockerfile
│   ├── .dockerignore
│   └── vite.config.ts
├── docker-compose.yml
└── docs/
    ├── technicalmanual.md
    └── systemarchitecturedesign.md
```

---

## Prerequisites

### Backend
- Python 3.12+
- pip

### Frontend
- Node.js 22+
- pnpm (`npm install -g pnpm`)

### Docker (optional)
- Docker Desktop or Docker Engine with the Compose plugin

---

## Running Independently (Local Development)

### Backend

```bash
cd backend

# Create and activate virtual environment (first time only)
python3 -m venv venv

source venv/bin/activate          # Linux / macOS
# venv\Scripts\activate           # Windows

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
python -m uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### Frontend

```bash
cd frontend

# Install dependencies (first time only)
pnpm install

# Start the dev server
pnpm run dev
```

Open `http://localhost:5173` in your browser.

---

## Running with Docker

Both services start together with a single command from the project root:

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |

To stop:
```bash
docker compose down
```

To rebuild after code changes:
```bash
docker compose up --build
```

---

## Usage

1. Click **Fetch Fresh / Seed Layers** — fetches from the backend (1.5s simulated DB delay on first call), seeds all client-side caches simultaneously.
2. Click **Fetch Fresh** again immediately — returns instantly from the server-side MockRedis cache (10s TTL).
3. Click each other button to read from that specific cache layer and observe the **Active Source** label change.
4. Wait 10+ seconds and click **Fetch Fresh** again — the server cache expires, triggering a fresh DB query.
