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

    const loadFromStorage = async (type: 'local' | 'session' | 'idb' | 'memory' | 'redux' | 'network') => { setProducts([]);
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
        if (type === 'redux'){
            dispatch(fetchProductsViaRedux());
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
        <div style={{ fontFamily: 'sans-serif', padding: '24px'}}>
            <h1>Multi layer Cache Landing page</h1>
            <Suspense fallback={<div>Loading Banner Section Component via code splitting...</div>}>
                <HeavyHero />
            </Suspense>
            <div style={{ background: '#e0f2fe', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
            <h3>Data Fetching Metrics</h3>
            <p><strong>Current Active Data Source Layer:</strong> <span style={{color: 'red'}}>{sourceInfo || 'None'}</span></p>
            <button onClick={() => { clickCountRef.current++; console.log(`Unrendered clicks logged: ${clickCountRef.current}`); }}>
                Inc Ref Counter (Check Console - Zero Re-renders)
            </button>
            </div>
            <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                <button onClick={() => loadFromStorage('network')}>Fetch Fresh / seed Layers</button>
                <button onClick={() => loadFromStorage('memory')}>Test JS from memory cache</button>
                <button onClick={() => loadFromStorage('session')}>Test Session Storage</button>
                <button onClick={() => loadFromStorage('local')}>Test Local Storage</button>
                <button onClick={() => loadFromStorage('idb')}>Test IndexedDB</button>
                <button onClick={() => loadFromStorage('redux')}>Test Redux Store</button>
                <button onClick={testCacheAPI}> Trigger Cache API Spec</button>
            </div>
            {products.length > 0 && <ProductList products={products} />}
            </div>
        );
}