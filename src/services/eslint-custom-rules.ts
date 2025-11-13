/**
 * Custom ESLint Rules for Mod Security
 * 
 * These rules detect potentially dangerous APIs and patterns
 * that should not be allowed in user-submitted mods
 */

export const customRules = {
  /**
   * no-chrome-apis: Detect usage of Chrome extension APIs
   */
  'no-chrome-apis': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow Chrome extension API usage in mods',
        category: 'Security',
        recommended: true,
      },
      messages: {
        noChromeAPI: 'Chrome extension APIs (chrome.*) are not allowed in mods',
        noBrowserAPI: 'Browser extension APIs (browser.*) are not allowed in mods',
      },
      schema: [],
    },
    create(context: any) {
      return {
        MemberExpression(node: any) {
          // Check for chrome.* or browser.* usage
          if (
            node.object &&
            node.object.type === 'Identifier' &&
            (node.object.name === 'chrome' || node.object.name === 'browser')
          ) {
            context.report({
              node,
              messageId: node.object.name === 'chrome' ? 'noChromeAPI' : 'noBrowserAPI',
            });
          }
        },
      };
    },
  },

  /**
   * no-sensitive-data: Detect potential API keys, tokens, passwords
   */
  'no-sensitive-data': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Detect potential sensitive data in code',
        category: 'Security',
        recommended: true,
      },
      messages: {
        apiKey: 'Potential API key detected: {{value}}',
        token: 'Potential token detected: {{value}}',
        password: 'Potential password detected: {{value}}',
      },
      schema: [],
    },
    create(context: any) {
      const sensitivePatterns = {
        apiKey: /api[_-]?key|apikey/i,
        token: /[_-]?token|access[_-]?token|auth[_-]?token/i,
        password: /password|passwd|pwd/i,
      };

      return {
        Literal(node: any) {
          if (typeof node.value === 'string') {
            const value = node.value.toLowerCase();
            
            // Check for patterns in variable names or string values
            for (const [type, pattern] of Object.entries(sensitivePatterns)) {
              if (pattern.test(value) && value.length > 10) {
                context.report({
                  node,
                  messageId: type,
                  data: { value: node.value.substring(0, 20) + '...' },
                });
              }
            }
          }
        },
        VariableDeclarator(node: any) {
          if (node.id && node.id.name) {
            const varName = node.id.name.toLowerCase();
            
            for (const [type, pattern] of Object.entries(sensitivePatterns)) {
              if (pattern.test(varName)) {
                context.report({
                  node,
                  messageId: type,
                  data: { value: node.id.name },
                });
              }
            }
          }
        },
      };
    },
  },

  /**
   * no-external-scripts: Detect external script loading
   */
  'no-external-scripts': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Warn about external script loading',
        category: 'Security',
        recommended: true,
      },
      messages: {
        externalScript: 'External script loading detected: {{url}}',
        externalFetch: 'External fetch detected: {{url}}',
      },
      schema: [],
    },
    create(context: any) {
      const externalUrlPattern = /^https?:\/\//i;

      return {
        CallExpression(node: any) {
          // Detect fetch() to external URLs
          if (
            node.callee &&
            node.callee.name === 'fetch' &&
            node.arguments.length > 0
          ) {
            const firstArg = node.arguments[0];
            if (
              firstArg.type === 'Literal' &&
              typeof firstArg.value === 'string' &&
              externalUrlPattern.test(firstArg.value)
            ) {
              context.report({
                node,
                messageId: 'externalFetch',
                data: { url: firstArg.value },
              });
            }
          }
        },
      };
    },
  },
};

/**
 * Helper to register custom rules with ESLint
 */
export function registerCustomRules(eslint: any) {
  Object.entries(customRules).forEach(([ruleName, ruleConfig]) => {
    eslint.defineRule(ruleName, ruleConfig);
  });
}



