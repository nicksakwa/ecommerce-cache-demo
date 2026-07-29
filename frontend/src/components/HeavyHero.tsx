import React from 'react';
const HeavyHero: React.FC = () => {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            borderRadius: '12px',
            marginBottom: '28px',
            padding: '40px 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            boxShadow: '0 4px 24px rgba(37,99,235,0.18)',
        }}>
            <div>
                <span style={{
                    background: '#f59e0b',
                    color: '#1e3a5f',
                    fontWeight: 700,
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                }}>Limited Time</span>
                <h2 style={{ color: '#fff', fontSize: '2rem', margin: '12px 0 8px', fontWeight: 800 }}>
                    ⚡ Flash Sale Live!
                </h2>
                <p style={{ color: '#bfdbfe', margin: 0, fontSize: '1rem' }}>
                    Up to 40% off on Electronics &amp; Apparel
                </p>
            </div>
            <img
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=480&h=160&fit=crop&auto=format"
                alt="Hero Banner"
                style={{ width: '340px', borderRadius: '8px', flexShrink: 0 }}
            />
        </div>
    );
};

export default HeavyHero;