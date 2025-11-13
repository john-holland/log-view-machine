/**
 * PII (Personally Identifiable Information) Scanner
 *
 * Scans mod content for potential PII including emails, phone numbers,
 * SSNs, credit cards, API keys, and other sensitive data.
 */
export interface PIIMatch {
    type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'api_key' | 'address' | 'name';
    value: string;
    line: number;
    column: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestion: string;
}
export interface PIIScanResult {
    hasPII: boolean;
    matches: PIIMatch[];
    riskScore: number;
    recommendations: string[];
}
export declare class PIIScanner {
    private patterns;
    private severityMap;
    constructor();
    /**
     * Initialize regex patterns for different PII types
     */
    private initializePatterns;
    /**
     * Scan content for PII
     */
    scanContent(content: string, filename?: string): PIIScanResult;
    /**
     * Scan multiple files
     */
    scanFiles(files: Record<string, string>): Map<string, PIIScanResult>;
    /**
     * Get description for PII type
     */
    private getDescription;
    /**
     * Get suggestion for PII type
     */
    private getSuggestion;
    /**
     * Calculate risk score based on matches
     */
    private calculateRiskScore;
    /**
     * Generate recommendations based on scan results
     */
    private generateRecommendations;
    /**
     * Get severity color for UI
     */
    getSeverityColor(severity: PIIMatch['severity']): string;
    /**
     * Get severity icon for UI
     */
    getSeverityIcon(severity: PIIMatch['severity']): string;
    /**
     * Check if content is safe to submit
     */
    isSafeToSubmit(result: PIIScanResult): boolean;
    /**
     * Generate PII report for admin review
     */
    generateReport(results: Map<string, PIIScanResult>): string;
}
/**
 * Initialize PII scanner
 */
export declare const initializePIIScanner: () => PIIScanner;
/**
 * Mock PII scanner for development
 */
export declare class MockPIIScanner extends PIIScanner {
    scanContent(content: string, filename?: string): PIIScanResult;
}
