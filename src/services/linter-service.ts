import { ESLint } from 'eslint';
import { customRules } from './eslint-custom-rules';

/**
 * Lint Result for a single issue
 */
export interface LintResult {
  fileName: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  ruleId: string;
  fix?: {
    range: [number, number];
    text: string;
  };
}

/**
 * Lint Summary across all files
 */
export interface LintSummary {
  totalFiles: number;
  errors: number;
  warnings: number;
  infos: number;
  passed: boolean;
  fixableErrors: number;
  fixableWarnings: number;
}

/**
 * File to lint
 */
export interface FileToLint {
  name: string;
  content: string;
}

/**
 * Linter Service
 * 
 * Provides programmatic linting for mod files
 * Detects security issues, code quality problems, and restricted APIs
 */
export class LinterService {
  private eslint: ESLint;
  private cache: Map<string, LintResult[]> = new Map();

  constructor() {
    // Initialize ESLint with custom configuration
    this.eslint = new ESLint({
      baseConfig: {
        env: {
          browser: true,
          es2021: true,
        },
        extends: [
          'eslint:recommended',
          'plugin:@typescript-eslint/recommended',
        ],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 12,
          sourceType: 'module',
        },
        rules: {
          'no-eval': 'error',
          'no-implied-eval': 'error',
          'no-new-func': 'error',
          'no-script-url': 'error',
          'no-console': 'warn',
          'no-debugger': 'error',
          'no-alert': 'warn',
          'no-var': 'error',
          'prefer-const': 'error',
          'eqeqeq': 'error',
        },
      },
      useEslintrc: false,
      fix: false,
    });
  }

  /**
   * Lint multiple files
   */
  async lintFiles(files: FileToLint[]): Promise<{
    results: LintResult[];
    summary: LintSummary;
  }> {
    console.log(`🔍 Linting ${files.length} file(s)...`);

    const allResults: LintResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalInfos = 0;
    let fixableErrors = 0;
    let fixableWarnings = 0;

    for (const file of files) {
      const fileResults = await this.lintFile(file.name, file.content);
      allResults.push(...fileResults);

      // Count by severity
      fileResults.forEach(result => {
        if (result.severity === 'error') {
          totalErrors++;
          if (result.fix) fixableErrors++;
        } else if (result.severity === 'warning') {
          totalWarnings++;
          if (result.fix) fixableWarnings++;
        } else {
          totalInfos++;
        }
      });
    }

    const summary: LintSummary = {
      totalFiles: files.length,
      errors: totalErrors,
      warnings: totalWarnings,
      infos: totalInfos,
      passed: totalErrors === 0,
      fixableErrors,
      fixableWarnings,
    };

    console.log(`🔍 Lint complete:`, summary);

    return { results: allResults, summary };
  }

  /**
   * Lint a single file
   */
  async lintFile(fileName: string, content: string): Promise<LintResult[]> {
    // Check cache first
    const cacheKey = `${fileName}:${this.hashContent(content)}`;
    if (this.cache.has(cacheKey)) {
      console.log(`🔍 Using cached lint results for ${fileName}`);
      return this.cache.get(cacheKey)!;
    }

    try {
      // Run ESLint on the content
      const results = await this.eslint.lintText(content, {
        filePath: fileName,
      });

      const lintResults: LintResult[] = [];

      results.forEach(result => {
        result.messages.forEach(message => {
          lintResults.push({
            fileName,
            line: message.line,
            column: message.column,
            severity: message.severity === 2 ? 'error' : 'warning',
            message: message.message,
            ruleId: message.ruleId || 'unknown',
            fix: message.fix
              ? {
                  range: message.fix.range as [number, number],
                  text: message.fix.text,
                }
              : undefined,
          });
        });
      });

      // Apply custom rules manually (since ESLint doesn't support dynamic rule loading easily)
      const customResults = this.applyCustomRules(fileName, content);
      lintResults.push(...customResults);

      // Cache results
      this.cache.set(cacheKey, lintResults);

      return lintResults;
    } catch (error: any) {
      console.error(`🔍 Error linting ${fileName}:`, error.message);
      return [
        {
          fileName,
          line: 1,
          column: 1,
          severity: 'error',
          message: `Linting failed: ${error.message}`,
          ruleId: 'linter-error',
        },
      ];
    }
  }

  /**
   * Apply custom security rules
   */
  private applyCustomRules(fileName: string, content: string): LintResult[] {
    const results: LintResult[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Detect chrome.* or browser.* API usage
      if (/\b(chrome|browser)\./i.test(line)) {
        results.push({
          fileName,
          line: lineNum,
          column: line.search(/\b(chrome|browser)\./i) + 1,
          severity: 'error',
          message: 'Chrome/Browser extension APIs are not allowed in mods',
          ruleId: 'no-chrome-apis',
        });
      }

      // Detect eval usage
      if (/\beval\s*\(/i.test(line)) {
        results.push({
          fileName,
          line: lineNum,
          column: line.search(/\beval\s*\(/i) + 1,
          severity: 'error',
          message: 'eval() is not allowed for security reasons',
          ruleId: 'no-eval',
        });
      }

      // Detect Function constructor
      if (/\bnew\s+Function\s*\(/i.test(line)) {
        results.push({
          fileName,
          line: lineNum,
          column: line.search(/\bnew\s+Function\s*\(/i) + 1,
          severity: 'error',
          message: 'Function constructor is not allowed for security reasons',
          ruleId: 'no-new-func',
        });
      }

      // Detect setTimeout/setInterval with string argument
      if (/\b(setTimeout|setInterval)\s*\(\s*['"`]/i.test(line)) {
        results.push({
          fileName,
          line: lineNum,
          column: line.search(/\b(setTimeout|setInterval)\s*\(/i) + 1,
          severity: 'warning',
          message: 'setTimeout/setInterval with string argument is discouraged',
          ruleId: 'no-implied-eval',
        });
      }

      // Detect potential API keys (long alphanumeric strings)
      const apiKeyPattern = /['"`]([A-Za-z0-9_-]{32,})['"`]/g;
      let match;
      while ((match = apiKeyPattern.exec(line)) !== null) {
        results.push({
          fileName,
          line: lineNum,
          column: match.index + 1,
          severity: 'warning',
          message: 'Potential API key or token detected',
          ruleId: 'no-sensitive-data',
        });
      }

      // Detect external script tags
      if (/<script[^>]+src\s*=\s*['"]https?:\/\//i.test(line)) {
        results.push({
          fileName,
          line: lineNum,
          column: line.search(/<script/i) + 1,
          severity: 'warning',
          message: 'External script tags should be reviewed for security',
          ruleId: 'no-external-scripts',
        });
      }
    });

    return results;
  }

  /**
   * Auto-fix simple issues
   */
  async autoFix(files: FileToLint[]): Promise<{
    files: FileToLint[];
    fixed: number;
  }> {
    console.log(`🔧 Auto-fixing ${files.length} file(s)...`);

    const fixedFiles: FileToLint[] = [];
    let totalFixed = 0;

    for (const file of files) {
      const eslintWithFix = new ESLint({
        baseConfig: this.eslint['options'].baseConfig,
        useEslintrc: false,
        fix: true,
      });

      const results = await eslintWithFix.lintText(file.content, {
        filePath: file.name,
      });

      if (results[0] && results[0].output) {
        fixedFiles.push({
          name: file.name,
          content: results[0].output,
        });
        totalFixed += results[0].fixableErrorCount + results[0].fixableWarningCount;
      } else {
        fixedFiles.push(file);
      }
    }

    console.log(`🔧 Auto-fixed ${totalFixed} issue(s)`);

    return { files: fixedFiles, fixed: totalFixed };
  }

  /**
   * Get documentation for a specific rule
   */
  getRuleDocumentation(ruleId: string): string {
    const docs: Record<string, string> = {
      'no-eval': 'eval() can execute arbitrary code and is a security risk',
      'no-new-func': 'Function constructor can execute arbitrary code',
      'no-chrome-apis': 'Chrome extension APIs are not available in mods',
      'no-browser-apis': 'Browser extension APIs are not available in mods',
      'no-sensitive-data': 'Sensitive data like API keys should not be in code',
      'no-external-scripts': 'External scripts can pose security risks',
      'no-implied-eval': 'setTimeout/setInterval with strings can execute arbitrary code',
    };

    return docs[ruleId] || 'No documentation available for this rule';
  }

  /**
   * Simple hash function for cache keys
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clear lint cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🔍 Lint cache cleared');
  }
}

// Export singleton instance
export const linterService = new LinterService();



