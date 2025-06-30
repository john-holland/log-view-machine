import * as React from 'react';
import { createServerSideRenderedPriceDisplayView } from '../machines/ServerSideRenderedPriceDisplayViewStateMachine';
import { createView } from '../core/ViewMachine';

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
    locale?: string;
}

export const ServerSideRenderedPriceDisplay: React.FC<ServerSideRenderedPriceDisplayProps> = ({
    items,
    total,
    config = {},
    isLive = false,
    locale = 'en-US'
}) => {
    // Create the state machine
    const priceMachine = createServerSideRenderedPriceDisplayView({
        machineId: 'server-side-rendered-price-display',
        config,
        isLive,
        locale
    });

    // Initialize with props
    React.useEffect(() => {
        priceMachine.setItems(items);
        priceMachine.setConfig(config);
        priceMachine.setIsLive(isLive);
        priceMachine.setLocale(locale);
    }, [items, config, isLive, locale]);

    // Create the view with state-specific rendering
    const view = createView({
        machineId: 'server-side-rendered-price-display-view',
        states: ['loading', 'server', 'client', 'hybrid', 'live', 'error'],
        defaultViewModel: priceMachine.getViewModel(),
        defaultConfig: { machineId: 'server-side-rendered-price-display-view' }
    })
    .withState('loading', (context) => (
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
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#374151'
            }}>
                Price Information (Server-Side Rendered)
            </h3>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ color: '#6b7280' }}>Loading server-side rendered price information...</div>
            </div>
        </div>
    ))
    .withState('server', (context) => {
        const vm = context.viewModel;
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
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#374151'
                }}>
                    Price Information (Server-Side Rendered)
                    {vm.isLive && (
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
                
                {vm.config.showIndividualPrices && vm.items.map((item: any, index: number) => (
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
                            {priceMachine.formatPrice(item.price * item.quantity)}
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
                    <span>{priceMachine.formatPrice(vm.total)}</span>
                </div>
                
                {vm.config.showTax && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0'
                    }}>
                        <span>Tax ({(vm.config.taxRate! * 100).toFixed(1)}%)</span>
                        <span>{priceMachine.formatPrice(vm.tax)}</span>
                    </div>
                )}
                
                {vm.config.showTotal && (
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
                        <span>{priceMachine.formatPrice(vm.finalTotal)}</span>
                    </div>
                )}
            </div>
        );
    })
    .withState('client', (context) => {
        const vm = context.viewModel;
        return (
            <div 
                className="client-side-price-display"
                style={{
                    padding: '1rem',
                    border: '1px solid #3b82f6',
                    borderRadius: '0.5rem',
                    backgroundColor: '#eff6ff',
                    margin: '1rem 0'
                }}
            >
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#1e40af'
                }}>
                    Price Information (Client-Side Rendered)
                    {vm.isLive && (
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
                
                {vm.config.showIndividualPrices && vm.items.map((item: any, index: number) => (
                    <div
                        key={`item-${index}`}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0',
                            borderBottom: '1px solid #dbeafe'
                        }}
                    >
                        <span style={{ color: '#1e40af' }}>
                            {item.name} (x{item.quantity})
                        </span>
                        <span style={{ fontWeight: '500', color: '#059669' }}>
                            {priceMachine.formatPrice(item.price * item.quantity)}
                        </span>
                    </div>
                ))}
                
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderTop: '2px solid #dbeafe',
                    fontWeight: '600'
                }}>
                    <span>Subtotal</span>
                    <span>{priceMachine.formatPrice(vm.total)}</span>
                </div>
                
                {vm.config.showTax && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0'
                    }}>
                        <span>Tax ({(vm.config.taxRate! * 100).toFixed(1)}%)</span>
                        <span>{priceMachine.formatPrice(vm.tax)}</span>
                    </div>
                )}
                
                {vm.config.showTotal && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderTop: '2px solid #dbeafe',
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#059669'
                    }}>
                        <span>Total</span>
                        <span>{priceMachine.formatPrice(vm.finalTotal)}</span>
                    </div>
                )}
            </div>
        );
    })
    .withState('hybrid', (context) => {
        const vm = context.viewModel;
        return (
            <div 
                className="hybrid-price-display"
                style={{
                    padding: '1rem',
                    border: '1px solid #8b5cf6',
                    borderRadius: '0.5rem',
                    backgroundColor: '#faf5ff',
                    margin: '1rem 0'
                }}
            >
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#6d28d9'
                }}>
                    Price Information (Hybrid Rendered - {vm.config.currency})
                    {vm.isLive && (
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
                
                {vm.config.showIndividualPrices && vm.items.map((item: any, index: number) => (
                    <div
                        key={`item-${index}`}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0',
                            borderBottom: '1px solid #e9d5ff'
                        }}
                    >
                        <span style={{ color: '#6d28d9' }}>
                            {item.name} (x{item.quantity})
                        </span>
                        <span style={{ fontWeight: '500', color: '#059669' }}>
                            {priceMachine.formatPrice(item.price * item.quantity)}
                        </span>
                    </div>
                ))}
                
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderTop: '2px solid #e9d5ff',
                    fontWeight: '600'
                }}>
                    <span>Subtotal</span>
                    <span>{priceMachine.formatPrice(vm.total)}</span>
                </div>
                
                {vm.config.showTax && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0'
                    }}>
                        <span>Tax ({(vm.config.taxRate! * 100).toFixed(1)}%)</span>
                        <span>{priceMachine.formatPrice(vm.tax)}</span>
                    </div>
                )}
                
                {vm.config.showTotal && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderTop: '2px solid #e9d5ff',
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#059669'
                    }}>
                        <span>Total</span>
                        <span>{priceMachine.formatPrice(vm.finalTotal)}</span>
                    </div>
                )}
            </div>
        );
    })
    .withState('live', (context) => {
        const vm = context.viewModel;
        return (
            <div 
                className="live-price-display"
                style={{
                    padding: '1rem',
                    border: '1px solid #10b981',
                    borderRadius: '0.5rem',
                    backgroundColor: '#ecfdf5',
                    margin: '1rem 0'
                }}
            >
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#047857'
                }}>
                    Price Information (Live Server-Side Rendered)
                    <span style={{ 
                        fontSize: '0.875rem', 
                        color: '#10b981', 
                        marginLeft: '0.5rem',
                        fontWeight: 'normal'
                    }}>
                        • Live
                    </span>
                </h3>
                
                {vm.config.showIndividualPrices && vm.items.map((item: any, index: number) => (
                    <div
                        key={`item-${index}`}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0',
                            borderBottom: '1px solid #a7f3d0'
                        }}
                    >
                        <span style={{ color: '#047857' }}>
                            {item.name} (x{item.quantity})
                        </span>
                        <span style={{ fontWeight: '500', color: '#059669' }}>
                            {priceMachine.formatPrice(item.price * item.quantity)}
                        </span>
                    </div>
                ))}
                
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderTop: '2px solid #a7f3d0',
                    fontWeight: '600'
                }}>
                    <span>Subtotal</span>
                    <span>{priceMachine.formatPrice(vm.total)}</span>
                </div>
                
                {vm.config.showTax && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0'
                    }}>
                        <span>Tax ({(vm.config.taxRate! * 100).toFixed(1)}%)</span>
                        <span>{priceMachine.formatPrice(vm.tax)}</span>
                    </div>
                )}
                
                {vm.config.showTotal && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderTop: '2px solid #a7f3d0',
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#059669'
                    }}>
                        <span>Total</span>
                        <span>{priceMachine.formatPrice(vm.finalTotal)}</span>
                    </div>
                )}
            </div>
        );
    })
    .withState('error', (context) => {
        const vm = context.viewModel;
        return (
            <div 
                className="error-price-display"
                style={{
                    padding: '1rem',
                    border: '1px solid #ef4444',
                    borderRadius: '0.5rem',
                    backgroundColor: '#fef2f2',
                    margin: '1rem 0'
                }}
            >
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#dc2626'
                }}>
                    Price Information Error
                </h3>
                <div style={{ color: '#dc2626' }}>
                    {vm.error || 'An error occurred while rendering price information'}
                </div>
                {vm.lastRendered && (
                    <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280', 
                        marginTop: '0.5rem' 
                    }}>
                        Last rendered: {new Date(vm.lastRendered).toLocaleString()}
                    </div>
                )}
            </div>
        );
    });

    // Get current view model and render
    const currentViewModel = priceMachine.getViewModel();
    return view.createView(currentViewModel);
}; 