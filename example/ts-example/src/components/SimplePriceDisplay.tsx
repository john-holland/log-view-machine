import * as React from 'react';
import { createSimplePriceDisplayView } from '../machines/SimplePriceDisplayViewStateMachine';
import { createView } from '../core/ViewMachine';

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
    currency?: string;
    locale?: string;
}

export const SimplePriceDisplay: React.FC<SimplePriceDisplayProps> = ({
    items,
    total,
    showTax = false,
    taxRate = 0.08,
    currency = 'USD',
    locale = 'en-US'
}) => {
    // Create the state machine
    const priceMachine = createSimplePriceDisplayView({
        machineId: 'simple-price-display',
        showTax,
        taxRate,
        currency,
        locale
    });

    // Initialize with props
    React.useEffect(() => {
        priceMachine.setItems(items);
        priceMachine.setShowTax(showTax);
        priceMachine.setTaxRate(taxRate);
        priceMachine.setCurrency(currency);
        priceMachine.setLocale(locale);
    }, [items, showTax, taxRate, currency, locale]);

    // Create the view with state-specific rendering
    const view = createView({
        machineId: 'simple-price-display-view',
        states: ['loading', 'basic', 'withTax', 'withCurrency', 'error'],
        defaultViewModel: priceMachine.getViewModel(),
        defaultConfig: { machineId: 'simple-price-display-view' }
    })
    .withState('loading', (context) => (
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
                Price Information
            </h3>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ color: '#6b7280' }}>Loading price information...</div>
            </div>
        </div>
    ))
    .withState('basic', (context) => {
        const vm = context.viewModel;
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
                    Price Information
                </h3>
                
                {vm.items.map((item: any, index: number) => (
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
                            {priceMachine.formatPrice(item.price * item.quantity)}
                        </span>
                    </div>
                ))}
                
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
                    <span>{priceMachine.formatPrice(vm.total)}</span>
                </div>
            </div>
        );
    })
    .withState('withTax', (context) => {
        const vm = context.viewModel;
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
                    Price Information (with Tax)
                </h3>
                
                {vm.items.map((item: any, index: number) => (
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
                
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0'
                }}>
                    <span>Tax ({(vm.taxRate * 100).toFixed(1)}%)</span>
                    <span>{priceMachine.formatPrice(vm.tax)}</span>
                </div>
                
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
            </div>
        );
    })
    .withState('withCurrency', (context) => {
        const vm = context.viewModel;
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
                    Price Information ({vm.currency})
                </h3>
                
                {vm.items.map((item: any, index: number) => (
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
                
                {vm.showTax && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0'
                    }}>
                        <span>Tax ({(vm.taxRate * 100).toFixed(1)}%)</span>
                        <span>{priceMachine.formatPrice(vm.tax)}</span>
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
                    <span>{priceMachine.formatPrice(vm.finalTotal)}</span>
                </div>
            </div>
        );
    })
    .withState('error', (context) => {
        const vm = context.viewModel;
        return (
            <div style={{
                padding: '1rem',
                border: '1px solid #ef4444',
                borderRadius: '0.5rem',
                backgroundColor: '#fef2f2',
                margin: '1rem 0',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#dc2626'
                }}>
                    Price Information Error
                </h3>
                <div style={{ color: '#dc2626' }}>
                    {vm.error || 'An error occurred while loading price information'}
                </div>
            </div>
        );
    });

    // Get current view model and render
    const currentViewModel = priceMachine.getViewModel();
    return view.createView(currentViewModel);
}; 