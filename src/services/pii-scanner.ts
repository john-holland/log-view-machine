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
    riskScore: number; // 0-100
    recommendations: string[];
}

export class PIIScanner {
    private patterns: Map<string, RegExp> = new Map();
    private severityMap: Map<string, 'low' | 'medium' | 'high' | 'critical'> = new Map();

    constructor() {
        this.initializePatterns();
    }

    /**
     * Initialize regex patterns for different PII types
     */
    private initializePatterns(): void {
        // Email patterns
        this.patterns.set('email', /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        this.severityMap.set('email', 'medium');

        // Phone number patterns (US format)
        this.patterns.set('phone', /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g);
        this.severityMap.set('phone', 'medium');

        // SSN patterns
        this.patterns.set('ssn', /\b\d{3}-?\d{2}-?\d{4}\b/g);
        this.severityMap.set('ssn', 'critical');

        // Credit card patterns (basic Luhn algorithm would be needed for validation)
        this.patterns.set('credit_card', /\b(?:\d{4}[-\s]?){3}\d{4}\b/g);
        this.severityMap.set('credit_card', 'critical');

        // API key patterns (common formats)
        this.patterns.set('api_key', /\b(?:sk|pk|ak|key|token)[-_]?[a-zA-Z0-9]{20,}\b/gi);
        this.severityMap.set('api_key', 'high');

        // Address patterns (basic)
        this.patterns.set('address', /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi);
        this.severityMap.set('address', 'medium');

        // Name patterns (common names - this is very basic)
        this.patterns.set('name', /\b(?:John|Jane|Mike|Sarah|David|Lisa|Chris|Amy|Mark|Jennifer|Robert|Jessica|Michael|Ashley|William|Amanda|James|Stephanie|Christopher|Melissa|Daniel|Nicole|Matthew|Elizabeth|Anthony|Helen|Mark|Deborah|Donald|Dorothy|Steven|Lisa|Paul|Nancy|Andrew|Karen|Joshua|Betty|Kenneth|Sandra|Kevin|Donna|Brian|Carol|George|Ruth|Edward|Sharon|Ronald|Michelle|Timothy|Laura|Jason|Sarah|Jeffrey|Kimberly|Ryan|Deborah|Jacob|Dorothy|Gary|Lisa|Nicholas|Nancy|Eric|Karen|Jonathan|Betty|Stephen|Helen|Larry|Sandra|Justin|Donna|Scott|Carol|Brandon|Ruth|Benjamin|Sharon|Samuel|Michelle|Gregory|Laura|Frank|Sarah|Raymond|Kimberly|Alexander|Deborah|Patrick|Dorothy|Jack|Lisa|Dennis|Nancy|Jerry|Karen|Tyler|Betty|Aaron|Helen|Jose|Sandra|Henry|Donna|Adam|Carol|Douglas|Ruth|Nathan|Sharon|Zachary|Michelle|Peter|Laura|Kyle|Sarah|Walter|Kimberly|Ethan|Deborah|Jeremy|Dorothy|Harold|Lisa|Sean|Nancy|Mason|Karen|Carl|Betty|Arthur|Helen|Lawrence|Sandra|Wayne|Donna|Roy|Carol|Eugene|Ruth|Louis|Sharon|Philip|Michelle|Bobby|Laura|Johnny|Sarah|Austin|Kimberly)\b/gi);
        this.severityMap.set('name', 'low');
    }

    /**
     * Scan content for PII
     */
    scanContent(content: string, filename?: string): PIIScanResult {
        const matches: PIIMatch[] = [];
        const lines = content.split('\n');

        // Scan each line
        lines.forEach((line, lineIndex) => {
            this.patterns.forEach((pattern, type) => {
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    const severity = this.severityMap.get(type) || 'low';
                    
                    matches.push({
                        type: type as PIIMatch['type'],
                        value: match[0],
                        line: lineIndex + 1,
                        column: match.index + 1,
                        severity,
                        description: this.getDescription(type),
                        suggestion: this.getSuggestion(type)
                    });
                }
            });
        });

        const hasPII = matches.length > 0;
        const riskScore = this.calculateRiskScore(matches);
        const recommendations = this.generateRecommendations(matches);

        return {
            hasPII,
            matches,
            riskScore,
            recommendations
        };
    }

    /**
     * Scan multiple files
     */
    scanFiles(files: Record<string, string>): Map<string, PIIScanResult> {
        const results = new Map<string, PIIScanResult>();

        Object.entries(files).forEach(([filename, content]) => {
            const result = this.scanContent(content, filename);
            results.set(filename, result);
        });

        return results;
    }

    /**
     * Get description for PII type
     */
    private getDescription(type: string): string {
        const descriptions: Record<string, string> = {
            email: 'Email address detected',
            phone: 'Phone number detected',
            ssn: 'Social Security Number detected',
            credit_card: 'Credit card number detected',
            api_key: 'API key or token detected',
            address: 'Physical address detected',
            name: 'Common name detected'
        };
        return descriptions[type] || 'Potential PII detected';
    }

    /**
     * Get suggestion for PII type
     */
    private getSuggestion(type: string): string {
        const suggestions: Record<string, string> = {
            email: 'Replace with placeholder like "user@example.com" or use environment variables',
            phone: 'Replace with placeholder like "(555) 123-4567" or use configuration',
            ssn: 'Remove immediately - never store SSNs in code',
            credit_card: 'Remove immediately - use payment processors instead',
            api_key: 'Move to environment variables or secure configuration',
            address: 'Replace with placeholder address or use configuration',
            name: 'Consider using placeholder names or user input'
        };
        return suggestions[type] || 'Review and remove if not necessary';
    }

    /**
     * Calculate risk score based on matches
     */
    private calculateRiskScore(matches: PIIMatch[]): number {
        if (matches.length === 0) return 0;

        let score = 0;
        const severityWeights = {
            low: 10,
            medium: 30,
            high: 60,
            critical: 100
        };

        matches.forEach(match => {
            score += severityWeights[match.severity];
        });

        // Cap at 100
        return Math.min(score, 100);
    }

    /**
     * Generate recommendations based on scan results
     */
    private generateRecommendations(matches: PIIMatch[]): string[] {
        const recommendations: string[] = [];
        const types = new Set(matches.map(m => m.type));

        if (types.has('ssn') || types.has('credit_card')) {
            recommendations.push('🚨 CRITICAL: Remove SSNs and credit card numbers immediately');
        }

        if (types.has('api_key')) {
            recommendations.push('🔑 Move API keys to environment variables or secure configuration');
        }

        if (types.has('email') || types.has('phone')) {
            recommendations.push('📧 Replace personal contact information with placeholders');
        }

        if (types.has('address')) {
            recommendations.push('🏠 Use placeholder addresses or configuration files');
        }

        if (types.has('name')) {
            recommendations.push('👤 Consider using placeholder names or user input fields');
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ No critical PII detected');
        }

        return recommendations;
    }

    /**
     * Get severity color for UI
     */
    getSeverityColor(severity: PIIMatch['severity']): string {
        const colors = {
            low: '#f59e0b',    // yellow
            medium: '#f97316', // orange
            high: '#ef4444',   // red
            critical: '#dc2626' // dark red
        };
        return colors[severity];
    }

    /**
     * Get severity icon for UI
     */
    getSeverityIcon(severity: PIIMatch['severity']): string {
        const icons = {
            low: '⚠️',
            medium: '🔶',
            high: '🔴',
            critical: '🚨'
        };
        return icons[severity];
    }

    /**
     * Check if content is safe to submit
     */
    isSafeToSubmit(result: PIIScanResult): boolean {
        // Only allow submission if no critical or high severity PII
        const hasCriticalPII = result.matches.some(m => 
            m.severity === 'critical' || m.severity === 'high'
        );
        
        return !hasCriticalPII && result.riskScore < 50;
    }

    /**
     * Generate PII report for admin review
     */
    generateReport(results: Map<string, PIIScanResult>): string {
        let report = '# PII Scan Report\n\n';
        
        let totalFiles = 0;
        let filesWithPII = 0;
        let totalMatches = 0;
        let criticalMatches = 0;

        results.forEach((result, filename) => {
            totalFiles++;
            if (result.hasPII) {
                filesWithPII++;
                totalMatches += result.matches.length;
                criticalMatches += result.matches.filter(m => m.severity === 'critical').length;
                
                report += `## ${filename}\n`;
                report += `- Risk Score: ${result.riskScore}/100\n`;
                report += `- Matches: ${result.matches.length}\n\n`;
                
                result.matches.forEach(match => {
                    report += `### ${match.type.toUpperCase()} (${match.severity})\n`;
                    report += `- Value: ${match.value}\n`;
                    report += `- Location: Line ${match.line}, Column ${match.column}\n`;
                    report += `- Description: ${match.description}\n`;
                    report += `- Suggestion: ${match.suggestion}\n\n`;
                });
            }
        });

        report = `# Summary\n- Total Files: ${totalFiles}\n- Files with PII: ${filesWithPII}\n- Total Matches: ${totalMatches}\n- Critical Matches: ${criticalMatches}\n\n` + report;

        return report;
    }
}

/**
 * Initialize PII scanner
 */
export const initializePIIScanner = (): PIIScanner => {
    return new PIIScanner();
};

/**
 * Mock PII scanner for development
 */
export class MockPIIScanner extends PIIScanner {
    scanContent(content: string, filename?: string): PIIScanResult {
        // Mock some PII detection for testing
        const mockMatches: PIIMatch[] = [];
        
        // Simulate email detection
        if (content.includes('@') && content.includes('.')) {
            mockMatches.push({
                type: 'email',
                value: 'user@example.com',
                line: 1,
                column: 1,
                severity: 'medium',
                description: 'Email address detected',
                suggestion: 'Replace with placeholder like "user@example.com" or use environment variables'
            });
        }

        // Simulate API key detection
        if (content.includes('sk-') || content.includes('api_key')) {
            mockMatches.push({
                type: 'api_key',
                value: 'sk-1234567890abcdef',
                line: 2,
                column: 1,
                severity: 'high',
                description: 'API key or token detected',
                suggestion: 'Move to environment variables or secure configuration'
            });
        }

        return {
            hasPII: mockMatches.length > 0,
            matches: mockMatches,
            riskScore: mockMatches.length * 30,
            recommendations: mockMatches.length > 0 ? [
                '🔑 Move API keys to environment variables',
                '📧 Replace personal information with placeholders'
            ] : ['✅ No PII detected']
        };
    }
}
