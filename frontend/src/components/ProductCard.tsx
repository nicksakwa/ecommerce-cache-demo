import React from 'react';

interface ProductCardProps {
    product: { id:number; name: string; price: number};
    onAddToCart: (productId: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onAddToCart }) => {
    console.log(`Rendering ProductCard: ${product.name}`);
    return (
        <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '6px'}}>
            <img src={`https://via.placeholder.com/150?text=${product.name}`} alt={product.name}/>
            <h3>{product.name}</h3>
            <p>${product.price.toFixed(2)}</p>
            <button onClick={() => onAddToCart(product.id)}>Add to cart</button>
        </div>
    );
});

ProductCard.displayName = 'ProductCard';