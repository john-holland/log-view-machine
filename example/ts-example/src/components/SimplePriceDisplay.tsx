import React from 'react';

interface SimplePriceDisplayProps {
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    total: number;
    showTax?: boolean;
    taxRate?: number;
}

export const SimplePriceDisplay: React.FC<SimplePriceDisplayProps> = ({
    items,
    total,
    showTax = false,
    taxRate = 0.08
}) => {
    const tax = showTax ? total * taxRate : 0;
    const finalTotal = total + tax;

    return (
        <div style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            backgroundColor: '#f9fafb',
            margin: '1rem 0',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#374151'
            }}>
                Price Information (Server-Side Rendered)
            </h3>
            
            {items.map((item, index) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #e5e7eb'
                    }}
                >
                    <span style={{ color: '#374151' }}>
                        {item.name} (x{item.quantity})
                    </span>
                    <span style={{ fontWeight: '500', color: '#059669' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                    </span>
                </div>
            ))}
            
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderTop: '2px solid #e5e7eb',
                fontWeight: '600'
            }}>
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
            </div>
            
            {showTax && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0'
                }}>
                    <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                    <span>${tax.toFixed(2)}</span>
                </div>
            )}
            
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderTop: '2px solid #e5e7eb',
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#059669'
            }}>
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
            </div>
        </div>
    );
}; 