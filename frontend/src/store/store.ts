import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
export const fetchProductsViaRedux = createAsyncThunk(
    'products/fetch',
    async (_, { getState }) =>{
        const { products } = getState() as { products: any };
        if (products.items.length > 0) {
            return { data: products.items, source: 'Redux In-Memory Cache'}
        }

        const response = await fetch('http://localhost:8000/api/products');
        const json = await response.json();
        return { data: json.data, source: json.source };
    }
)