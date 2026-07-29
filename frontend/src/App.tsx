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
    