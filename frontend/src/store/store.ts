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
);

const productsSlice = createSlice({
    name: 'products',
    initialState: { items: [], source: '', loading: false },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProductsViaRedux.pending, (state)=>{ state.loading = true;})
            .addCase(fetchProductsViaRedux.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.source = action.payload.source;
        });
    },
});

export const store = configureStore({ reducer: { products: productsSlice.reducer }});