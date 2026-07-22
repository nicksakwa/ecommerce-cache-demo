import React, { useMemo, useState, useCallback } from 'react';
import { ProductCard } from './ProductCard';

interface ProductListProps {
    products : Array<{ id: number; name: string; price: number; category: string }>;
}

export const ProductList: React.FC<ProductListProps> = ({ products }) => {
    const [cart, setCart] = useState(0);

    const handleAddToCart = useCallback((productId: number)=>{
        console.log('Product ${id} added to cart');
        setCartCount(prev => prev + 1);
    }, []);

    const filteredProducts = useMemo(() => {
        console.log("Computing filtered products (Expensive operation simulation)...");
        return products.filter(p => p.price > 10);
    }, [products]);

    return (
        <div>
            <h3>Cart Items Counter: {cartCount} (Increments trigger parent re-render)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap'}}>
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
            </div>
        </div>
    );
};