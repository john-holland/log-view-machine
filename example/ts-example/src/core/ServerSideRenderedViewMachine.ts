import { ViewMachine, ViewConfig, ViewProps } from './ViewMachine';
import { BaseStateMachine } from './BaseStateMachine';
import * as React from 'react';

export interface ServerSideRenderedViewConfig extends ViewConfig {
    priceDisplayConfig?: {
        showIndividualPrices?: boolean;
        showTotal?: boolean;
        showTax?: boolean;
        taxRate?: number;
        currency?: string;
        priceFormat?: 'decimal' | 'currency';
    };
    serverEndpoint?: string;
    pollingInterval?: number;
}

export interface PriceDisplayProps {
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    total: number;
    tax?: number;
    currency?: string;
    showIndividualPrices?: boolean;
    showTotal?: boolean;
    showTax?: boolean;
}

export class ServerSideRenderedViewMachine extends ViewMachine {
    private priceDisplayConfig: NonNullable<ServerSideRenderedViewConfig['priceDisplayConfig']>;
    private serverEndpoint?: string;
    private pollingInterval?: number;
    private pollingTimer?: NodeJS.Timeout;

    constructor(config: ServerSideRenderedViewConfig, modelMachine: BaseStateMachine) {
        super(config, modelMachine);
        
        this.priceDisplayConfig = {
            showIndividualPrices: true,
            showTotal: true,
            showTax: false,
            taxRate: 0.08,
            currency: 'USD',
            priceFormat: 'currency',
            ...config.priceDisplayConfig
        };
        
        this.serverEndpoint = config.serverEndpoint;
        this.pollingInterval = config.pollingInterval || 5000; // Default 5 seconds
        
        if (this.serverEndpoint) {
            this.startPolling();
        }
    }

    private startPolling(): void {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
        }
        
        this.pollingTimer = setInterval(async () => {
            try {
                await this.syncWithServer();
            } catch (error) {
                console.error('Failed to sync with server:', error);
            }
        }, this.pollingInterval);
    }

    private async syncWithServer(): Promise<void> {
        if (!this.serverEndpoint) return;
        
        try {
            const response = await fetch(this.serverEndpoint);
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const serverData = await response.json();
            this.updateFromServerData(serverData);
        } catch (error) {
            console.error('Server sync failed:', error);
        }
    }

    private updateFromServerData(serverData: any): void {
        // Update the model machine with server data
        const modelMachine = this.getMachine('model');
        if (modelMachine && serverData.viewModel) {
            // Update the view model with server data
            Object.assign(modelMachine.getViewModel(), serverData.viewModel);
        }
    }

    public render(props: any): React.ReactNode {
        const viewModel = this.getViewModel();
        const states: { [key: string]: string } = {};
        
        // Collect states from all machines
        this.machines.forEach((machine, id) => {
            states[id] = machine.getViewModel().currentState;
        });

        const viewProps: ViewProps = {
            model: props,
            state: viewModel.currentState,
            states,
            sendMessage: (message, machineId = 'model') => {
                const targetMachine = this.machines.get(machineId);
                if (targetMachine && typeof (targetMachine as any).sendMessage === 'function') {
                    (targetMachine as any).sendMessage(message);
                }
            },
            transition: (to, machineId = 'model') => {
                const targetMachine = this.machines.get(machineId);
                if (targetMachine && typeof (targetMachine as any).sendMessage === 'function') {
                    (targetMachine as any).sendMessage({
                        type: 'TRANSITION',
                        payload: { to },
                        metadata: { source: 'server-side-view' }
                    });
                }
            },
            machines: Object.fromEntries(this.machines)
        };

        // Add methods to props
        this.methods.forEach((method, name) => {
            (viewProps as any)[name] = (args: any) => method(viewProps);
        });

        // Render price information
        return this.renderPriceDisplay(viewProps);
    }

    private renderPriceDisplay(viewProps: ViewProps): React.ReactNode {
        const viewModel = viewProps.model;
        const items = viewModel.items || [];
        const total = viewModel.total || 0;
        const tax = this.priceDisplayConfig.showTax ? total * this.priceDisplayConfig.taxRate! : 0;
        const finalTotal = total + tax;

        return React.createElement('div', { 
            className: 'server-side-price-display',
            style: {
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#f9fafb',
                margin: '1rem 0'
            }
        }, [
            // Header
            React.createElement('h3', {
                key: 'header',
                style: {
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#374151'
                }
            }, 'Price Information (Server-Side Rendered)'),
            
            // Individual items
            ...(this.priceDisplayConfig.showIndividualPrices ? items.map((item: any, index: number) =>
                React.createElement('div', {
                    key: `item-${index}`,
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #e5e7eb'
                    }
                }, [
                    React.createElement('span', {
                        key: 'name',
                        style: { color: '#374151' }
                    }, `${item.name} (x${item.quantity})`),
                    React.createElement('span', {
                        key: 'price',
                        style: { fontWeight: '500', color: '#059669' }
                    }, this.formatPrice(item.price * item.quantity))
                ])
            ) : []),
            
            // Subtotal
            React.createElement('div', {
                key: 'subtotal',
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderTop: '2px solid #e5e7eb',
                    fontWeight: '600'
                }
            }, [
                React.createElement('span', { key: 'label' }, 'Subtotal'),
                React.createElement('span', { key: 'value' }, this.formatPrice(total))
            ]),
            
            // Tax
            ...(this.priceDisplayConfig.showTax ? [
                React.createElement('div', {
                    key: 'tax',
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0'
                    }
                }, [
                    React.createElement('span', { key: 'label' }, `Tax (${(this.priceDisplayConfig.taxRate! * 100).toFixed(1)}%)`),
                    React.createElement('span', { key: 'value' }, this.formatPrice(tax))
                ])
            ] : []),
            
            // Total
            ...(this.priceDisplayConfig.showTotal ? [
                React.createElement('div', {
                    key: 'total',
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderTop: '2px solid #e5e7eb',
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#059669'
                    }
                }, [
                    React.createElement('span', { key: 'label' }, 'Total'),
                    React.createElement('span', { key: 'value' }, this.formatPrice(finalTotal))
                ])
            ] : [])
        ]);
    }

    private formatPrice(price: number): string {
        if (this.priceDisplayConfig.priceFormat === 'currency') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: this.priceDisplayConfig.currency
            }).format(price);
        } else {
            return price.toFixed(2);
        }
    }

    public destroy(): void {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
        }
    }

    public updatePriceConfig(config: Partial<NonNullable<ServerSideRenderedViewConfig['priceDisplayConfig']>>): void {
        this.priceDisplayConfig = { ...this.priceDisplayConfig, ...config };
    }

    public setServerEndpoint(endpoint: string): void {
        this.serverEndpoint = endpoint;
        this.startPolling();
    }

    public stopPolling(): void {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = undefined;
        }
    }
}

// Factory function for creating server-side rendered view machines
export const createServerSideRenderedView = (
    config: ServerSideRenderedViewConfig
) => {
    return (modelMachine: BaseStateMachine) => {
        return new ServerSideRenderedViewMachine(config, modelMachine);
    };
}; 