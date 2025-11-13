import React, { useState } from 'react';
import { LintResult, LintSummary } from '../services/linter-service';

interface LintResultsDisplayProps {
  results: LintResult[];
  summary: LintSummary;
  onRuleClick?: (ruleId: string) => void;
  onLineClick?: (fileName: string, line: number) => void;
}

/**
 * LintResultsDisplay Component
 * 
 * Displays linter results with color-coded severity
 * and expandable details
 */
export const LintResultsDisplay: React.FC<LintResultsDisplayProps> = ({
  results,
  summary,
  onRuleClick,
  onLineClick,
}) => {
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const toggleRule = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  // Group results by rule ID
  const resultsByRule = results.reduce((acc, result) => {
    if (!acc[result.ruleId]) {
      acc[result.ruleId] = [];
    }
    acc[result.ruleId].push(result);
    return acc;
  }, {} as Record<string, LintResult[]>);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return '#d32f2f';
      case 'warning': return '#f57c00';
      case 'info': return '#1976d2';
      default: return '#666';
    }
  };

  return (
    <div className="lint-results-display">
      {/* Summary */}
      <div className={`lint-summary ${summary.passed ? 'passed' : 'failed'}`}>
        <div className="summary-header">
          <span className="summary-icon">
            {summary.passed ? '✅' : '❌'}
          </span>
          <span className="summary-title">
            {summary.passed ? 'All checks passed!' : 'Issues found'}
          </span>
        </div>
        <div className="summary-stats">
          {summary.errors > 0 && (
            <span className="stat error">
              <strong>{summary.errors}</strong> error{summary.errors !== 1 ? 's' : ''}
            </span>
          )}
          {summary.warnings > 0 && (
            <span className="stat warning">
              <strong>{summary.warnings}</strong> warning{summary.warnings !== 1 ? 's' : ''}
            </span>
          )}
          {summary.fixableErrors + summary.fixableWarnings > 0 && (
            <span className="stat fixable">
              {summary.fixableErrors + summary.fixableWarnings} fixable
            </span>
          )}
        </div>
      </div>

      {/* Results grouped by rule */}
      {results.length > 0 && (
        <div className="lint-results-list">
          {Object.entries(resultsByRule).map(([ruleId, ruleResults]) => (
            <div key={ruleId} className="rule-group">
              <div
                className="rule-header"
                onClick={() => toggleRule(ruleId)}
              >
                <span className="expand-icon">
                  {expandedRules.has(ruleId) ? '▼' : '▶'}
                </span>
                <span className="rule-name">{ruleId}</span>
                <span className="rule-count">
                  ({ruleResults.length} issue{ruleResults.length !== 1 ? 's' : ''})
                </span>
                <button
                  className="rule-help-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRuleClick?.(ruleId);
                  }}
                  title="Learn more about this rule"
                >
                  ?
                </button>
              </div>

              {expandedRules.has(ruleId) && (
                <div className="rule-results">
                  {ruleResults.map((result, index) => (
                    <div
                      key={index}
                      className={`lint-result-item ${result.severity}`}
                      onClick={() => onLineClick?.(result.fileName, result.line)}
                    >
                      <span className="severity-icon">
                        {getSeverityIcon(result.severity)}
                      </span>
                      <div className="result-details">
                        <div className="result-location">
                          <span className="file-name">{result.fileName}</span>
                          <span className="separator">:</span>
                          <span className="line-col">{result.line}:{result.column}</span>
                        </div>
                        <div className="result-message">{result.message}</div>
                        {result.fix && (
                          <div className="result-fix">
                            <span className="fix-icon">🔧</span>
                            <span className="fix-text">Auto-fixable</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .lint-results-display {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          overflow: hidden;
        }

        .lint-summary {
          padding: 16px;
          border-bottom: 2px solid #e0e0e0;
        }

        .lint-summary.passed {
          background: #e8f5e9;
          border-bottom-color: #4caf50;
        }

        .lint-summary.failed {
          background: #ffebee;
          border-bottom-color: #f44336;
        }

        .summary-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .summary-icon {
          font-size: 24px;
        }

        .summary-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .summary-stats {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .stat {
          font-size: 14px;
          color: #666;
        }

        .stat strong {
          font-weight: 700;
        }

        .stat.error {
          color: #d32f2f;
        }

        .stat.warning {
          color: #f57c00;
        }

        .stat.fixable {
          color: #1976d2;
        }

        .lint-results-list {
          padding: 8px;
        }

        .rule-group {
          margin-bottom: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }

        .rule-header {
          padding: 12px;
          background: #f5f5f5;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .rule-header:hover {
          background: #ebebeb;
        }

        .expand-icon {
          font-size: 12px;
          color: #999;
          width: 16px;
        }

        .rule-name {
          font-weight: 600;
          font-size: 14px;
          color: #333;
          flex: 1;
        }

        .rule-count {
          font-size: 12px;
          color: #999;
        }

        .rule-help-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #667eea;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          transition: all 0.2s;
        }

        .rule-help-btn:hover {
          background: #5568d3;
          transform: scale(1.1);
        }

        .rule-results {
          padding: 8px;
          background: white;
        }

        .lint-result-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          margin-bottom: 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .lint-result-item:hover {
          background: #f5f5f5;
        }

        .lint-result-item.error {
          border-left: 3px solid #d32f2f;
        }

        .lint-result-item.warning {
          border-left: 3px solid #f57c00;
        }

        .lint-result-item.info {
          border-left: 3px solid #1976d2;
        }

        .severity-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .result-details {
          flex: 1;
        }

        .result-location {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
        }

        .file-name {
          font-weight: 600;
          color: #667eea;
        }

        .separator {
          margin: 0 4px;
        }

        .line-col {
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        }

        .result-message {
          font-size: 14px;
          color: #333;
          line-height: 1.4;
        }

        .result-fix {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          font-size: 12px;
          color: #1976d2;
        }

        .fix-icon {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default LintResultsDisplay;



