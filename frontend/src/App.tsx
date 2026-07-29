import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsViaRedux } from './store/store';
import { ProductList } from './components/ProductList';
import { openIndexedDB } from './utils/db';

const HeavyHero = lazy(()=> import('./components/HeavyHero'));
const localInMemoryCache: Record<string, any> ={};
export default function App(){
    const dispatch = useDispatch<any>();
    const reduxProducts = useSelector((state: any) => state.products.items);
    const reduxSource = useSelector((state: any) => state.products.source);
    const [sourceInfo, setSourceInfo] = useState('');
    const [products,setProducts] = useState<any[]>([]);

    const clickCountRef = useRef(0);
    const testCacheAPI = async ()=>{
        if('caches' in window){
            const cache = await caches.open('vl-api-cache');
            await cache.add(new Request('http://localhost:8000/api/products'));
            setSourceInfo('Data safely stored in Browser Cache API');
        }
    };

    const loadFromStorage = async (type: 'local' | 'session' | 'idb' | 'memory' | 'redux' | 'network') => {
        // Handle redux before clearing — if store already has data the useEffect
        // won't re-fire on the same reference, leaving products blank
        if (type === 'redux') {
            if (reduxProducts.length > 0) {
                setProducts(reduxProducts);
                setSourceInfo('Redux In-Memory Cache');
            } else {
                setProducts([]);
                dispatch(fetchProductsViaRedux());
            }
            return;
        }

        setProducts([]);
        if (type === 'memory' && localInMemoryCache['products']){
            setProducts(localInMemoryCache['products']);
            setSourceInfo('Loaded data from pure JS In-memory cache');
            return;
        }
        if (type === 'local'){
            const data = localStorage.getItem('products');
            if (data) { setProducts(JSON.parse(data)); 
            setSourceInfo('Loaded data from Local Storage');
            return;
            }
        }
        if (type === 'session'){
            const data = sessionStorage.getItem('products');
            if (data) { setProducts(JSON.parse(data)); 
            setSourceInfo('Loaded data from Session storage');
            return;
            }
        }
        if (type === 'idb'){
            const db = await openIndexedDB();
            const tx = db.transaction('products', 'readonly');
            const store = tx.objectStore('products');
            const request =store.getAll();
            request.onsuccess = () => {
                if (request.result.length){
                    setProducts(request.result);
                    setSourceInfo('Loaded data from IndexedDB');
                }
            };
            return;
        }

        const response = await fetch('http://localhost:8000/api/products');
        const json = await response.json();
        const data = json.data;

        localStorage.setItem('products', JSON.stringify(data));
        sessionStorage.setItem('products', JSON.stringify(data));
        localInMemoryCache['products'] = data;
        const db = await openIndexedDB();
        const tx = db.transaction('products', 'readwrite');
        data.forEach((product: any) => tx.objectStore('products').put(product));
        setProducts(data);
        setSourceInfo(json.source);
    };
    
    useEffect(() => {
        if (reduxProducts.length > 0){
            setProducts(reduxProducts);
            setSourceInfo(reduxSource);
        }
    }, [reduxProducts, reduxSource]);

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '32px 48px', maxWidth: '1200px', margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', marginBottom: '24px', letterSpacing: '-0.5px' }}>Multi-Layer Cache Demo</h1>
            <Suspense fallback={<div>Loading Banner Section Component via code splitting...</div>}>
                <HeavyHero />
            </Suspense>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '20px 24px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 10px', color: '#1e40af', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Fetching Metrics</h3>
                <p style={{ margin: '0 0 12px', color: '#374151' }}>
                    <strong>Active Source:</strong>{' '}
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>{sourceInfo || 'None — click a button below'}</span>
                </p>
                <button
                    onClick={() => { clickCountRef.current++; console.log(`Unrendered clicks: ${clickCountRef.current}`); }}
                    style={{ padding: '7px 14px', background: '#fff', border: '1px solid #93c5fd', borderRadius: '6px', color: '#1d4ed8', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    Inc Ref Counter (Check Console — Zero Re-renders)
                </button>
            </div>
            <div style={{ marginBottom: '28px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {([
                    { label: '🔄 Fetch Fresh / Seed Layers', type: 'network', primary: true },
                    { label: '🧠 JS Memory Cache', type: 'memory' },
                    { label: '📦 Redux Store', type: 'redux' },
                    { label: '💾 LocalStorage', type: 'local' },
                    { label: '🗂 SessionStorage', type: 'session' },
                    { label: '🗄 IndexedDB', type: 'idb' },
                ] as const).map(({ label, type, primary }) => (
                    <button
                        key={type}
                        onClick={() => loadFromStorage(type)}
                        style={{
                            padding: '9px 16px',
                            background: primary ? '#2563eb' : '#fff',
                            color: primary ? '#fff' : '#374151',
                            border: `1px solid ${primary ? '#2563eb' : '#d1d5db'}`,
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                        }}
                    >{label}</button>
                ))}
                <button
                    onClick={testCacheAPI}
                    style={{ padding: '9px 16px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >🌐 Browser Cache API</button>
            </div>
            {products.length > 0 && <ProductList products={products} />}
            </div>
        );
}