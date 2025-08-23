/**
 * Fish Burger Demo Controller
 * Handles demo functionality and connection mode switching
 */

export class FishBurgerDemoController {
    constructor() {
        this.connectionMode = 'pact'; // 'pact' or 'live'
        this.liveConfig = {
            apiBaseUrl: 'http://localhost:3000',
            authType: 'bearer',
            authValue: ''
        };
        this.pactConfig = {
            testMode: 'happy_path',
            errorProbability: 0.05,
            responseDelay: { min: 100, max: 1000 }
        };
        this.init();
    }

    init() {
        this.loadSavedConfig();
        this.setupEventListeners();
        this.updateConnectionStatus();
        this.refreshPactStats();
    }

    setupEventListeners() {
        // Connection mode toggle
        const modeOptions = document.querySelectorAll('.mode-option input[type="radio"]');
        modeOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                this.switchConnectionMode(e.target.value);
            });
        });

        // Pact test controls
        const testModeSelect = document.getElementById('test-mode');
        if (testModeSelect) {
            testModeSelect.addEventListener('change', (e) => {
                this.updatePactConfig({ testMode: e.target.value });
            });
        }

        const errorProbabilityInput = document.getElementById('error-probability');
        if (errorProbabilityInput) {
            errorProbabilityInput.addEventListener('change', (e) => {
                this.updatePactConfig({ errorProbability: parseFloat(e.target.value) });
            });
        }

        const responseDelayInput = document.getElementById('response-delay');
        if (responseDelayInput) {
            responseDelayInput.addEventListener('change', (e) => {
                this.updatePactConfig({ responseDelay: { min: 100, max: parseInt(e.target.value) } });
            });
        }

        // Live server configuration
        const liveConfigInputs = document.querySelectorAll('.live-server-config input');
        liveConfigInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.saveLiveConfig();
            });
        });

        // Test connection button
        const testConnectionBtn = document.getElementById('test-connection');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => {
                this.testLiveConnection();
            });
        }

        // Reset stats button
        const resetStatsBtn = document.getElementById('reset-stats');
        if (resetStatsBtn) {
            resetStatsBtn.addEventListener('click', () => {
                this.resetPactStats();
            });
        }
    }

    switchConnectionMode(mode) {
        this.connectionMode = mode;
        this.updateConnectionStatus();
        
        if (mode === 'live') {
            this.showLiveServerConfig();
        } else {
            this.hideLiveServerConfig();
        }

        // Save to localStorage
        localStorage.setItem('fish-burger-demo-connection-mode', mode);
        
        console.log(`Switched to ${mode} mode`);
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        statusElement.className = 'connection-status';
        
        if (this.connectionMode === 'pact') {
            statusElement.textContent = 'Pact Test Mode Active';
            statusElement.classList.add('status-success');
        } else {
            statusElement.textContent = 'Live Server Mode Active';
            statusElement.classList.add('status-saved');
        }
    }

    showLiveServerConfig() {
        const configPanel = document.querySelector('.live-server-config');
        if (configPanel) {
            configPanel.style.display = 'block';
        }
    }

    hideLiveServerConfig() {
        const configPanel = document.querySelector('.live-server-config');
        if (configPanel) {
            configPanel.style.display = 'none';
        }
    }

    async testLiveConnection() {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        statusElement.textContent = 'Testing Connection...';
        statusElement.className = 'connection-status status-testing';

        try {
            const response = await fetch(`${this.liveConfig.apiBaseUrl}/health`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                statusElement.textContent = 'Connection Successful!';
                statusElement.className = 'connection-status status-success';
            } else {
                statusElement.textContent = `Connection Failed: ${response.status}`;
                statusElement.className = 'connection-status status-error';
            }
        } catch (error) {
            statusElement.textContent = `Connection Error: ${error.message}`;
            statusElement.className = 'connection-status status-error';
            console.error('Connection test failed:', error);
        }
    }

    getAuthHeaders() {
        const headers = {};
        
        if (this.liveConfig.authType === 'bearer' && this.liveConfig.authValue) {
            headers['Authorization'] = 'Bearer ' + this.liveConfig.authValue;
        } else if (this.liveConfig.authType === 'api-key' && this.liveConfig.authValue) {
            headers['X-API-Key'] = this.liveConfig.authValue;
        }

        return headers;
    }

    saveLiveConfig() {
        const apiBaseUrlInput = document.getElementById('api-base-url');
        const authTypeInput = document.getElementById('auth-type');
        const authValueInput = document.getElementById('auth-value');

        if (apiBaseUrlInput) this.liveConfig.apiBaseUrl = apiBaseUrlInput.value;
        if (authTypeInput) this.liveConfig.authType = authTypeInput.value;
        if (authValueInput) this.liveConfig.authValue = authValueInput.value;

        localStorage.setItem('fish-burger-demo-live-config', JSON.stringify(this.liveConfig));
        
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = 'Configuration Saved';
            statusElement.className = 'connection-status status-saved';
        }

        console.log('Live server configuration saved:', this.liveConfig);
    }

    loadSavedConfig() {
        // Load connection mode
        const savedMode = localStorage.getItem('fish-burger-demo-connection-mode');
        if (savedMode) {
            this.connectionMode = savedMode;
        }

        // Load live server config
        const savedLiveConfig = localStorage.getItem('fish-burger-demo-live-config');
        if (savedLiveConfig) {
            try {
                this.liveConfig = { ...this.liveConfig, ...JSON.parse(savedLiveConfig) };
            } catch (error) {
                console.error('Error loading live config:', error);
            }
        }

        // Update UI
        const modeRadio = document.querySelector(`input[value="${this.connectionMode}"]`);
        if (modeRadio) {
            modeRadio.checked = true;
        }

        const apiBaseUrlInput = document.getElementById('api-base-url');
        if (apiBaseUrlInput) apiBaseUrlInput.value = this.liveConfig.apiBaseUrl;

        const authTypeInput = document.getElementById('auth-type');
        if (authTypeInput) authTypeInput.value = this.liveConfig.authType;

        const authValueInput = document.getElementById('auth-value');
        if (authValueInput) authValueInput.value = this.liveConfig.authValue;
    }

    async updatePactConfig(updates) {
        Object.assign(this.pactConfig, updates);
        
        try {
            const response = await fetch('/api/pact-test/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.pactConfig)
            });

            if (response.ok) {
                console.log('Pact test configuration updated:', this.pactConfig);
            } else {
                console.error('Failed to update pact test configuration');
            }
        } catch (error) {
            console.error('Error updating pact test configuration:', error);
        }
    }

    async refreshPactStats() {
        try {
            const response = await fetch('/api/pact-test/status');
            if (response.ok) {
                const stats = await response.json();
                this.updatePactStatsDisplay(stats);
            }
        } catch (error) {
            console.error('Error refreshing pact stats:', error);
        }
    }

    updatePactStatsDisplay(stats) {
        const requestCountElement = document.getElementById('request-count');
        const errorCountElement = document.getElementById('error-count');
        const successRateElement = document.getElementById('success-rate');

        if (requestCountElement) requestCountElement.textContent = stats.requestCount || 0;
        if (errorCountElement) errorCountElement.textContent = stats.errorCount || 0;
        
        if (successRateElement && stats.requestCount > 0) {
            const successRate = ((stats.requestCount - stats.errorCount) / stats.requestCount * 100).toFixed(1);
            successRateElement.textContent = `${successRate}%`;
        }
    }

    async resetPactStats() {
        try {
            const response = await fetch('/api/pact-test/reset', {
                method: 'POST'
            });

            if (response.ok) {
                console.log('Pact test statistics reset');
                this.refreshPactStats();
            } else {
                console.error('Failed to reset pact test statistics');
            }
        } catch (error) {
            console.error('Error resetting pact test statistics:', error);
        }
    }

    // Get current connection mode
    getConnectionMode() {
        return this.connectionMode;
    }

    // Get current configuration
    getConfig() {
        return this.connectionMode === 'pact' ? this.pactConfig : this.liveConfig;
    }

    // Check if we should use pact test proxy
    shouldUsePactProxy() {
        return this.connectionMode === 'pact';
    }
}

// Create and export a singleton instance
export const fishBurgerDemo = new FishBurgerDemoController();
