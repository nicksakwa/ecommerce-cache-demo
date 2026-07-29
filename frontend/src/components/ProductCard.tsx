import React from 'react';

interface ProductCardProps {
    product: { id:number; name: string; price: number};
    onAddToCart: (productId: number) => void;
}

const productImageMap: Record<string, string> = {
    'Wireless Headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&auto=format',
    'Running Shoes':       'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&auto=format',
    'Smart Watch':         'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&h=300&fit=crop&auto=format',
    'Leather Wallet':      'https://images.unsplash.com/photo-1627123424574-724758594785?w=300&h=300&fit=crop&auto=format',
};

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onAddToCart }) => {
    console.log(`Rendering ProductCard: ${product.name}`);
    const imageUrl = productImageMap[product.name]
        ?? `https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=300&fit=crop&auto=format`;
    return (
        <div style={{
            border: '1px solid #e5e7eb',
            padding: '20px',
            borderRadius: '12px',
            width: '200px',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            transition: 'box-shadow 0.2s',
        }}>
            <img
                src={imageUrl}
                alt={product.name}
                style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: '8px' }}
            />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827', textAlign: 'center' }}>
                {product.name}
            </h3>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>
                ${product.price.toFixed(2)}
            </p>
            <button
                onClick={() => onAddToCart(product.id)}
                style={{
                    width: '100%',
                    padding: '8px 0',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                }}
            >
                Add to Cart
            </button>
        </div>
    );
});

ProductCard.displayName = 'ProductCard';