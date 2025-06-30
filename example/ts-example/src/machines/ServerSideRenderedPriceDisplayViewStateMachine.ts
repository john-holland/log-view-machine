import { createView } from '../core/ViewMachine';

interface PriceItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface PriceDisplayConfig {
    showIndividualPrices?: boolean;
    showTotal?: boolean;
    showTax?: boolean;
    taxRate?: number;
    currency?: string;
    priceFormat?: 'decimal' | 'currency';
}

interface ServerSideRenderedPriceDisplayConfig {
    machineId: string;
    config?: PriceDisplayConfig;
    isLive?: boolean;
    locale?: string;
}

interface ServerSideRenderedPriceDisplayViewModel {
    items: PriceItem[];
    total: number;
    tax: number;
    finalTotal: number;
    config: PriceDisplayConfig;
    isLive: boolean;
    locale: string;
    isLoading: boolean;
    error: string | null;
    renderMode: 'server' | 'client' | 'hybrid' | 'live' | 'error' | 'loading';
    lastRendered: string | null;
    cacheKey: string | null;
}

export const createServerSideRenderedPriceDisplayView = (config: ServerSideRenderedPriceDisplayConfig) => {
    const defaultConfig = {
        showIndividualPrices: true,
        showTotal: true,
        showTax: false,
        taxRate: 0.08,
        currency: 'USD',
        priceFormat: 'currency' as const,
        ...config.config
    };

    const viewModel: ServerSideRenderedPriceDisplayViewModel = {
        items: [],
        total: 0,
        tax: 0,
        finalTotal: 0,
        config: defaultConfig,
        isLive: config.isLive || false,
        locale: config.locale || 'en-US',
        isLoading: false,
        error: null,
        renderMode: 'server',
        lastRendered: null,
        cacheKey: null
    };

    const machine = {
        machineId: config.machineId,
        
        // Business logic methods
        setItems(items: PriceItem[]) {
            viewModel.items = items;
            viewModel.total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            this.calculateTax();
            this.updateRenderMode();
            this.generateCacheKey();
        },

        setConfig(newConfig: Partial<PriceDisplayConfig>) {
            viewModel.config = { ...viewModel.config, ...newConfig };
            this.calculateTax();
            this.updateRenderMode();
            this.generateCacheKey();
        },

        setIsLive(isLive: boolean) {
            viewModel.isLive = isLive;
            this.updateRenderMode();
        },

        setLocale(locale: string) {
            viewModel.locale = locale;
            this.updateRenderMode();
        },

        setLoading(isLoading: boolean) {
            viewModel.isLoading = isLoading;
            viewModel.renderMode = isLoading ? 'loading' : 'server';
        },

        setError(error: string | null) {
            viewModel.error = error;
            viewModel.renderMode = error ? 'error' : 'server';
        },

        calculateTax() {
            viewModel.tax = viewModel.config.showTax ? viewModel.total * (viewModel.config.taxRate || 0.08) : 0;
            viewModel.finalTotal = viewModel.total + viewModel.tax;
        },

        updateRenderMode() {
            if (viewModel.error) {
                viewModel.renderMode = 'error';
            } else if (viewModel.isLoading) {
                viewModel.renderMode = 'loading';
            } else if (viewModel.isLive) {
                viewModel.renderMode = 'live';
            } else if (viewModel.config.priceFormat === 'currency' && viewModel.config.currency !== 'USD') {
                viewModel.renderMode = 'hybrid';
            } else {
                viewModel.renderMode = 'server';
            }
        },

        generateCacheKey() {
            const configHash = JSON.stringify(viewModel.config);
            const itemsHash = JSON.stringify(viewModel.items);
            viewModel.cacheKey = `${configHash}-${itemsHash}`;
        },

        formatPrice(amount: number): string {
            if (viewModel.config.priceFormat === 'currency') {
                try {
                    return new Intl.NumberFormat(viewModel.locale, {
                        style: 'currency',
                        currency: viewModel.config.currency
                    }).format(amount);
                } catch {
                    return `${amount.toFixed(2)} ${viewModel.config.currency}`;
                }
            } else {
                return amount.toFixed(2);
            }
        },

        getServerRenderedData() {
            return {
                items: viewModel.items,
                total: viewModel.total,
                tax: viewModel.tax,
                finalTotal: viewModel.finalTotal,
                config: viewModel.config,
                isLive: viewModel.isLive,
                cacheKey: viewModel.cacheKey,
                lastRendered: new Date().toISOString()
            };
        },

        validateServerSideRendering(): boolean {
            // Check if all required data is available for server-side rendering
            return viewModel.items.length > 0 && 
                   viewModel.total > 0 && 
                   !viewModel.isLoading && 
                   !viewModel.error;
        },

        getViewModel(): ServerSideRenderedPriceDisplayViewModel {
            return { ...viewModel };
        }
    };

    return machine;
}; 