import React from 'react';

export interface PriceDisplayConfig {
    showIndividualPrices?: boolean;
    showTotal?: boolean;
    showTax?: boolean;
    taxRate?: number;
    currency?: string;
    priceFormat?: 'decimal' | 'currency';
}

export interface ServerSideRenderedPriceDisplayProps {
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    total: number;
    config?: PriceDisplayConfig;
    isLive?: boolean;
}

export const ServerSideRenderedPriceDisplay: React.FC<ServerSideRenderedPriceDisplayProps> = ({
    items,
    total,
    config = {},
    isLive = false
}) => {
    const priceDisplayConfig = {
        showIndividualPrices: true,
        showTotal: true,
        showTax: false,
        taxRate: 0.08,
        currency: 'USD',
        priceFormat: 'currency' as const,
        ...config
    };

    const formatPrice = (price: number): string => {
        if (priceDisplayConfig.priceFormat === 'currency') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: priceDisplayConfig.currency
            }).format(price);
        } else {
            return price.toFixed(2);
        }
    };

    const tax = priceDisplayConfig.showTax ? total * priceDisplayConfig.taxRate! : 0;
    const finalTotal = total + tax;

    return (
        <div 
            className="server-side-price-display"
            style={{
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#f9fafb',
                margin: '1rem 0'
            }}
        >
            {/* Header */}
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#374151'
            }}>
                Price Information (Server-Side Rendered)
                {isLive && (
                    <span style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280', 
                        marginLeft: '0.5rem',
                        fontWeight: 'normal'
                    }}>
                        • Live
                    </span>
                )}
            </h3>
            
            {/* Individual items */}
            {priceDisplayConfig.showIndividualPrices && items.map((item, index) => (
                <div
                    key={`item-${index}`}
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
                        {formatPrice(item.price * item.quantity)}
                    </span>
                </div>
            ))}
            
            {/* Subtotal */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderTop: '2px solid #e5e7eb',
                fontWeight: '600'
            }}>
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
            </div>
            
            {/* Tax */}
            {priceDisplayConfig.showTax && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0'
                }}>
                    <span>Tax ({(priceDisplayConfig.taxRate! * 100).toFixed(1)}%)</span>
                    <span>{formatPrice(tax)}</span>
                </div>
            )}
            
            {/* Total */}
            {priceDisplayConfig.showTotal && (
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
                    <span>{formatPrice(finalTotal)}</span>
                </div>
            )}
        </div>
    );
}; 