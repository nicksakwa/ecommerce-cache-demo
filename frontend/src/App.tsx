import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsViaRedux } from '.store/store';
import { ProductList } from './components/ProductList';
import { openIndexedDB } from './utils/db';

const HeavyHero = lazy(()=> import('./components/HeavyHero'));
const localInMemoryCache: Record<string, any> ={};
export default function App(){
    const dispatch = useDispatch(<any>();
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

    const loadFromStorage = async (type: 'local'| 'session' | 'idb'|'memory' | 'redux')=> { setProducts([]);
        if (type === 'memory' && LocalInMemoryCache['products']){
            setProducts(LocalInMemoryCache['products']);
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
            setSourceInfo('Loaded data from Session storage'):
            return;
            }
        }
        if (type === 'idb'){
            const db = await openIndexedDB();
            const tx = db.transaction('products', 'readonly');
            const store = tx.objectStore('products');
            const request =store.getAll();
            request.onsuccess = ()=> {
                if (request.result.length){
                    setProducts(request.result);
                    setSourceInfo('Loaded data from IndexedDB');
                }
            return;
        }
        if (type === 'redux'){
            dispatch(fetchProductsViaRedux());
            return;
        }

        const response = await fetch('http://localhost:8000/api/products');
        const json = await response.json();
        const data = json.products;