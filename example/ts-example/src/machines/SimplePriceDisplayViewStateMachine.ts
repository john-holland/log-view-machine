import { createView } from '../core/ViewMachine';

interface PriceItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface SimplePriceDisplayConfig {
    machineId: string;
    showTax?: boolean;
    taxRate?: number;
    currency?: string;
    locale?: string;
}

interface SimplePriceDisplayViewModel {
    items: PriceItem[];
    total: number;
    tax: number;
    finalTotal: number;
    showTax: boolean;
    taxRate: number;
    currency: string;
    locale: string;
    isLoading: boolean;
    error: string | null;
    displayMode: 'basic' | 'withTax' | 'withCurrency' | 'error' | 'loading';
}

export const createSimplePriceDisplayView = (config: SimplePriceDisplayConfig) => {
    const defaultConfig = {
        showTax: false,
        taxRate: 0.08,
        currency: 'USD',
        locale: 'en-US',
        ...config
    };

    const viewModel: SimplePriceDisplayViewModel = {
        items: [],
        total: 0,
        tax: 0,
        finalTotal: 0,
        showTax: defaultConfig.showTax,
        taxRate: defaultConfig.taxRate,
        currency: defaultConfig.currency,
        locale: defaultConfig.locale,
        isLoading: false,
        error: null,
        displayMode: 'basic'
    };

    const machine = {
        machineId: config.machineId,
        
        // Business logic methods
        setItems(items: PriceItem[]) {
            viewModel.items = items;
            viewModel.total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            this.calculateTax();
            this.updateDisplayMode();
        },

        setShowTax(showTax: boolean) {
            viewModel.showTax = showTax;
            this.calculateTax();
            this.updateDisplayMode();
        },

        setTaxRate(taxRate: number) {
            viewModel.taxRate = taxRate;
            this.calculateTax();
            this.updateDisplayMode();
        },

        setCurrency(currency: string) {
            viewModel.currency = currency;
            this.updateDisplayMode();
        },

        setLocale(locale: string) {
            viewModel.locale = locale;
            this.updateDisplayMode();
        },

        setLoading(isLoading: boolean) {
            viewModel.isLoading = isLoading;
            viewModel.displayMode = isLoading ? 'loading' : 'basic';
        },

        setError(error: string | null) {
            viewModel.error = error;
            viewModel.displayMode = error ? 'error' : 'basic';
        },

        calculateTax() {
            viewModel.tax = viewModel.showTax ? viewModel.total * viewModel.taxRate : 0;
            viewModel.finalTotal = viewModel.total + viewModel.tax;
        },

        updateDisplayMode() {
            if (viewModel.error) {
                viewModel.displayMode = 'error';
            } else if (viewModel.isLoading) {
                viewModel.displayMode = 'loading';
            } else if (viewModel.currency !== 'USD' || viewModel.locale !== 'en-US') {
                viewModel.displayMode = 'withCurrency';
            } else if (viewModel.showTax) {
                viewModel.displayMode = 'withTax';
            } else {
                viewModel.displayMode = 'basic';
            }
        },

        formatPrice(amount: number): string {
            if (viewModel.currency === 'USD') {
                return `$${amount.toFixed(2)}`;
            }
            
            try {
                return new Intl.NumberFormat(viewModel.locale, {
                    style: 'currency',
                    currency: viewModel.currency
                }).format(amount);
            } catch {
                return `${amount.toFixed(2)} ${viewModel.currency}`;
            }
        },

        getViewModel(): SimplePriceDisplayViewModel {
            return { ...viewModel };
        }
    };

    return machine;
}; 