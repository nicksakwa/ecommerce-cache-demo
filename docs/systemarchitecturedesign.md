# System Architecture Design

---

## Libraries & Frameworks

### Backend

| Framework/Server | Version | Role |
|---|---|---|
| **FastAPI** | ≥0.110 | ASGI web framework; handles routing, dependency injection, and request validation |
| **Uvicorn** | ≥0.28 | ASGI server that runs the FastAPI app |

No database driver or Redis client is installed — both are simulated in pure Python to keep the environment dependency-free.

### Frontend

| Technology | Version | Role |
|---|---|---|
| **React** | 19 | UI component tree and rendering |
| **TypeScript** | 6 | Static typing across all frontend modules |
| **Vite** | 8 | Dev server and bundler; handles code splitting and HMR |
| **Redux Toolkit** | ≥2.2 | State management and client-side cache layer |
| **react-redux** | ≥9.1 | React bindings for the Redux store (`useSelector`, `useDispatch`) |

---

## System Overview

```
Browser
  │
  ├── React App (localhost:5173)
  │     ├── Redux Store          (in-memory, tab-scoped)
  │     ├── JS Object Cache      (in-memory, page-scoped)
  │     ├── localStorage         (persistent, origin-scoped)
  │     ├── sessionStorage       (session-scoped)
  │     ├── IndexedDB            (persistent, structured)
  │     └── Browser Cache API    (network request cache)
  │
  └── HTTP GET /api/products
        │
        FastAPI (localhost:8000)
              ├── MockRedis cache  (in-memory, 10s TTL)
              └── Mock DB          (in-memory dict)
```

---

## Data Flow

### First Request (cold cache)

1. User clicks **Fetch Fresh / Seed Layers**.
2. React calls `fetch('http://localhost:8000/api/products')`.
3. FastAPI checks MockRedis — cache miss.
4. FastAPI waits 1.5 seconds (simulated DB latency), reads the mock DB dict.
5. FastAPI writes the product list to MockRedis with the current timestamp, returns `{ data, source: "PostgreSQL Database..." }`.
6. React receives the response and simultaneously writes the product list to `localStorage`, `sessionStorage`, `localInMemoryCache`, and IndexedDB.
7. React renders the `ProductList`.

### Subsequent Request within 10 seconds (warm server cache)

1. User clicks **Fetch Fresh** again.
2. FastAPI checks MockRedis — cache hit, elapsed time < 10s.
3. Returns immediately with `{ data, source: "Redis Cache" }` — no sleep, no DB read.

### Client-Side Cache Reads

When any other button is clicked, no network request is made. Data is read directly from the selected browser storage and rendered. The `source` label updates to identify which layer responded.

---

## Data Structures

### Product Record

```ts
{
  id: number;         // Primary key
  name: string;       // Display name, also used as image map key
  price: number;      // Float, displayed to 2 decimal places
  category: string;   // "Electronics" | "Apparel" | "Accessories"
}
```

This shape is defined in the FastAPI mock DB and consumed as-is by every frontend cache layer. No transformation occurs between backend and frontend.

### MockRedis Internal Structure

```python
store: Dict[str, Any]        # key → serialised value
ttl:   Dict[str, float]      # key → Unix timestamp of write time
```

TTL is checked manually on every `get()` call by comparing `time.time() - ttl[key]` against the 10-second threshold. This is a polling expiry pattern — entries are not evicted proactively, only on the next read.

### Redux State Shape

```ts
{
  products: {
    items:   Product[],   // the cached product list
    source:  string,      // label of the layer that last populated items
    loading: boolean      // true while the async thunk is in-flight
  }
}
```

### `localInMemoryCache`

```ts
Record<string, any>   // { products: Product[] }
```

A plain JavaScript object keyed by resource name. Lives at module scope outside the React component, so it is never garbage-collected during the session.

---

## Key Algorithms & Patterns

### Cache-Aside (Lazy Population)
The server follows the cache-aside pattern: the application checks the cache first, reads from the database only on a miss, and writes back to the cache after the DB read. The client uses the same pattern — check the local store first, fall back to the network, then populate all client caches on success.

### TTL Expiry (Passive / Lazy Eviction)
MockRedis does not run a background timer. Expired entries remain in memory until the next `get()` call for that key, at which point the entry is deleted and `None` is returned. This is identical to how many production Redis clients implement key expiry at the application level.

### React Rendering Optimisations

- **`React.memo`** on `ProductCard` — skips re-render if props are shallowly equal.
- **`useCallback`** on `handleAddToCart` — stabilises the function reference so `React.memo` does not see a changed prop on every parent render.
- **`useMemo`** on `filteredProducts` — caches the filter result and recomputes only when the `products` array reference changes.
- **`useRef`** on `clickCountRef` — mutable counter that does not schedule a re-render when written.
- **`React.lazy` + `Suspense`** on `HeavyHero` — splits the component into a separate bundle chunk loaded on demand.
