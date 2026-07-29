# Technical Manual

Audience: developers onboarding to the ecommerce-cache-demo codebase.  
This document covers every function, class, and module in the project with implementation detail.

---

## Backend — `backend/main.py`

### Module-level setup

```python
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
```

A FastAPI application instance is created and configured with `CORSMiddleware`. `allow_origins=["*"]` permits requests from any origin, which is acceptable for a local development demo but must be restricted to specific domains in production.

---

### `get_db() -> Generator[Dict[int, Dict[str, Any]], None, None]`

**Purpose:** FastAPI dependency that provides a mock PostgreSQL database.

**Implementation:** Uses a Python generator (`yield`) so FastAPI's dependency injection system can manage setup and teardown around the request lifecycle. The yielded value is a plain dictionary keyed by integer product ID, where each value is a product record dictionary.

**Why a generator:** Mirrors how a real database connection dependency would be written — yielding allows cleanup code (e.g. `db.close()`) to run after the request, even though none is needed here.

**Returns:** A dict of four mock product records: Wireless Headphones, Running Shoes, Smart Watch, Leather Bag.

---

### `class MockRedis`

Simulates a Redis in-memory cache without requiring a running Redis server. Maintains two internal dicts:

- `self.store: Dict[str, Any]` — maps cache keys to cached values.
- `self.ttl: Dict[str, float]` — maps cache keys to the Unix timestamp of when they were written.

#### `__init__(self)`

Initialises both internal dicts as empty.

#### `get(self, key: str) -> Any`

Checks if `key` exists in `self.store`. If it does, computes elapsed time as `time.time() - self.ttl[key]`. If more than 10 seconds have passed, the entry is deleted from both dicts and `None` is returned (simulating TTL expiry). If still fresh, the cached value is returned.

Returns `None` if the key does not exist.

#### `set(self, key: str, value: Any)`

Writes `value` into `self.store[key]` and records the current Unix timestamp in `self.ttl[key]`. This timestamp is later used by `get` to determine expiry.

---

### `redis_instance = MockRedis()`

A module-level singleton. Because this is defined at import time and Python modules are only loaded once, the same `MockRedis` object is reused for every request, preserving cached state between calls. This is the server-side shared cache.

---

### `get_redis() -> MockRedis`

**Purpose:** FastAPI dependency that returns the shared `redis_instance`.

**Implementation:** A plain function (not a generator) since no cleanup is needed. FastAPI injects the return value into any route that declares `redis: MockRedis = Depends(get_redis)`.

---

### `get_products(db, redis)`

**Route:** `GET /api/products`

**Dependencies injected:** `db` from `get_db`, `redis` from `get_redis`.

**Logic:**
1. Checks the MockRedis cache for key `"all_products"`.
2. If a cache hit is found, returns immediately with `{"data": cached_data, "source": "Redis Cache"}`.
3. If a cache miss, calls `time.sleep(1.5)` to simulate a slow database query.
4. Converts the mock DB dict values to a list, stores it in Redis under `"all_products"`, then returns `{"data": products, "source": "PostgreSQL Database (Slow DB Query)"}`.

The `source` field in the response is consumed by the frontend to display which layer served the data.

---

## Frontend — `frontend/src/`

### `utils/db.ts`

#### `openIndexedDB(): Promise<IDBDatabase>`

Opens (or creates) an IndexedDB database named `"EcommerceDB"` at version 1.

- `onupgradeneeded`: Runs when the DB is created for the first time or when the version number increases. Creates an object store named `"products"` with `id` as the keyPath (the field used as the primary key).
- `onsuccess`: Resolves the promise with the opened `IDBDatabase` instance.
- `onerror`: Rejects the promise with the IDB error.

Returns a `Promise<IDBDatabase>` that callers `await` before performing reads or writes.

---

### `store/store.ts`

#### `fetchProductsViaRedux` (async thunk)

Created with `createAsyncThunk('products/fetch', ...)`. The thunk function receives `(_, { getState })` — the first argument is unused payload, the second provides access to the Redux store state.

**Logic:**
1. Reads current `products.items` from the store via `getState()`.
2. If `items.length > 0`, the store already has data — returns it immediately with source label `'Redux In-Memory Cache'` without making a network request.
3. If empty, fetches `http://localhost:8000/api/products`, parses the JSON, and returns `{ data, source }` from the response.

This implements Redux as a client-side cache: once populated, subsequent dispatches skip the network entirely until the page is refreshed.

#### `productsSlice`

Created with `createSlice`. Initial state:
```ts
{ items: [], source: '', loading: false }
```

**Extra reducers:**
- `fetchProductsViaRedux.pending` — sets `loading: true`.
- `fetchProductsViaRedux.fulfilled` — sets `loading: false`, writes `action.payload.data` to `items` and `action.payload.source` to `source`.

#### `store`

The Redux store created with `configureStore`, containing the single `products` reducer. Exported and passed to the React `<Provider>` in `main.tsx`.

---

### `components/HeavyHero.tsx`

A presentational component with no props. Renders a promotional banner section styled with a blue gradient, a badge, headline text, and an Unsplash image.

**Caching relevance:** This component is loaded with React's `lazy()` in `App.tsx`, making it a code-splitting demonstration. It is bundled into a separate JavaScript chunk and only downloaded when the component is first rendered, reducing the initial bundle size.

---

### `components/ProductCard.tsx`

#### `productImageMap: Record<string, string>`

A module-level constant mapping product names to Unsplash CDN image URLs. Used to look up the correct image for each product without needing the backend to serve image URLs.

#### `ProductCard` (React.memo)

**Props:** `product: { id, name, price }`, `onAddToCart: (productId: number) => void`

Wrapped in `React.memo`, which performs a shallow comparison of props before re-rendering. If the parent re-renders but the product data and `onAddToCart` reference have not changed, React skips re-rendering this component entirely.

`productImageMap[product.name]` resolves the image URL. Falls back to a generic Unsplash shopping image if the product name is not in the map.

`ProductCard.displayName = 'ProductCard'` sets the component name in React DevTools (required when using `React.memo` with anonymous components).

---

### `components/ProductList.tsx`

#### `ProductList`

**Props:** `products: Array<{ id, name, price, category }>`

#### `cartCount` / `setCartCount`

Local state tracking how many items have been added to the cart. Used purely as a re-render demonstration — incrementing the counter triggers a re-render of `ProductList` but not of individual `ProductCard` children (because of `React.memo` + `useCallback`).

#### `handleAddToCart` (useCallback)

```ts
const handleAddToCart = useCallback((productId: number) => {
    setCartCount(prev => prev + 1);
}, []);
```

`useCallback` memoizes the function reference. The empty dependency array `[]` means the same function instance is returned on every render. This prevents `ProductCard` from re-rendering unnecessarily, because `React.memo` would see a new function reference as a changed prop if `useCallback` were not used.

#### `filteredProducts` (useMemo)

```ts
const filteredProducts = useMemo(() => {
    return products.filter(p => p.price > 10);
}, [products]);
```

`useMemo` caches the result of the filter computation. The filtered list is only recomputed when the `products` array reference changes. This simulates an expensive derived computation (e.g. sorting, heavy transformation) that should not run on every render.

---

### `App.tsx`

#### Module-level `localInMemoryCache`

```ts
const localInMemoryCache: Record<string, any> = {};
```

Defined outside the component function, so it persists for the entire page session and is not reset by React re-renders. Acts as a plain JavaScript in-memory cache.

#### `HeavyHero` (lazy import)

```ts
const HeavyHero = lazy(() => import('./components/HeavyHero'));
```

Defers loading the `HeavyHero` module until it is first rendered. Wrapped in `<Suspense>` with a fallback string. This is React's built-in code splitting — the HeavyHero chunk is only fetched from the network when needed.

#### `clickCountRef` (useRef)

```ts
const clickCountRef = useRef(0);
```

`useRef` holds a mutable value that persists across renders without triggering a re-render when mutated. Demonstrates the difference between ref-based mutation and state-based mutation — incrementing `clickCountRef.current` produces no UI update.

#### `testCacheAPI()`

Checks for the `caches` global (Browser Cache API). Opens a named cache `'vl-api-cache'` and uses `cache.add()` to fetch and store the `/api/products` request/response pair. This is the Service Worker Cache API, separate from HTTP caching headers.

#### `loadFromStorage(type)`

The central cache routing function. Takes a union type literal and routes to the appropriate cache layer:

- **`'redux'`**: Checked before clearing products. If the Redux store already holds items, sets them directly. Otherwise clears products and dispatches the async thunk. The early-check design prevents a blank screen caused by `setProducts([])` running before a stale-reference `useEffect` has a chance to re-fire.
- **`'memory'`**: Reads from `localInMemoryCache`. Falls through to network if empty.
- **`'local'`**: Reads from `localStorage.getItem('products')` and parses JSON.
- **`'session'`**: Reads from `sessionStorage.getItem('products')` and parses JSON.
- **`'idb'`**: Opens IndexedDB via `openIndexedDB()`, starts a readonly transaction, and calls `getAll()` on the products object store. Results are set asynchronously in `onsuccess`.
- **`'network'`** (default fallback): Fetches from `http://localhost:8000/api/products`. On success, seeds all four client-side caches simultaneously: `localStorage`, `sessionStorage`, `localInMemoryCache`, and IndexedDB.

#### `useEffect` (Redux sync)

```ts
useEffect(() => {
    if (reduxProducts.length > 0) {
        setProducts(reduxProducts);
        setSourceInfo(reduxSource);
    }
}, [reduxProducts, reduxSource]);
```

Watches the Redux selector values. When the async thunk completes and Redux state updates, this effect fires and pushes the new products into local component state for rendering.

---

### `main.tsx`

Entry point. Mounts the React application into `document.getElementById('root')`. Wraps `<App>` in:

- `<React.StrictMode>` — enables additional runtime warnings during development.
- `<Provider store={store}>` — makes the Redux store available to all child components via context, required for `useDispatch` and `useSelector` to work.
