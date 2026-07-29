import React, { useMemo, useState, useCallback } from 'react';
import { ProductCard } from './ProductCard';

interface ProductListProps {
    products : Array<{ id: number; name: string; price: number; category: string }>;
}

export const ProductList: React.FC<ProductListProps> = ({ products }) => {
    const [cartCount, setCartCount] = useState(0);

    const handleAddToCart = useCallback((productId: number)=>{
        console.log(`Product ${productId} added to cart`);
        setCartCount(prev => prev + 1);
    }, []);

    const filteredProducts = useMemo(() => {
        console.log("Computing filtered products (Expensive operation simulation)...");
        return products.filter(p => p.price > 10);
    }, [products]);

    return (
        <div>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '10px 18px',
                marginBottom: '20px',
            }}>
                <span style={{ fontSize: '1.2rem' }}>🛒</span>
                <span style={{ fontWeight: 600, color: '#166534' }}>
                    Cart: <strong>{cartCount}</strong> item{cartCount !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>(re-renders on each add)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
            </div>
        </div>
    );
};