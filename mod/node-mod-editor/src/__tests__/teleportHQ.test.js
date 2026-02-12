import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTemplateManager } from '../component-middleware/teleportHQ/templateManager.js';

describe('TeleportHQ Integration', () => {
  let templateManager;

  beforeEach(() => {
    templateManager = createTemplateManager({
      apiKey: 'test-api-key',
      projectId: 'test-project',
      environment: 'test',
      enableRealTimeSync: false,
      enableComponentStateSync: false,
    });
  });

  afterEach(() => {
    // Clean up
    templateManager.clearCache();
  });

  describe('TemplateManager', () => {
    it('should create template manager with configuration', () => {
      expect(templateManager).toBeDefined();
      expect(templateManager.adapter).toBeDefined();
      expect(templateManager.templateCache).toBeDefined();
      expect(templateManager.templateStates).toBeDefined();
    });

    it('should get cache statistics', () => {
      const stats = templateManager.getCacheStats();
      expect(stats).toHaveProperty('cachedTemplates');
      expect(stats).toHaveProperty('templateStates');
      expect(stats).toHaveProperty('cacheEntries');
      expect(stats.cachedTemplates).toBe(0);
      expect(stats.templateStates).toBe(0);
    });

    it('should clear cache', () => {
      templateManager.clearCache();
      const stats = templateManager.getCacheStats();
      expect(stats.cachedTemplates).toBe(0);
      expect(stats.templateStates).toBe(0);
    });

    it('should validate template structure', () => {
      const validation = templateManager.validateTemplate('non-existent');
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Template not found in cache');
    });
  });

  describe('Template State Management', () => {
    it('should update template state', () => {
      const templateId = 'test-template';
      const updates = { formData: { email: 'test@example.com' } };
      
      const newState = templateManager.updateTemplateState(templateId, updates);
      expect(newState).toEqual(updates);
    });

    it('should get template state', () => {
      const templateId = 'test-template';
      const initialState = { formData: {} };
      
      templateManager.updateTemplateState(templateId, initialState);
      const state = templateManager.getTemplateState(templateId);
      expect(state).toEqual(initialState);
    });

    it('should merge state updates', () => {
      const templateId = 'test-template';
      
      // Initial state
      templateManager.updateTemplateState(templateId, { formData: { email: 'test@example.com' } });
      
      // Update state
      const updates = { formData: { name: 'John Doe' }, isSubmitting: true };
      const newState = templateManager.updateTemplateState(templateId, updates);
      
      expect(newState.formData.email).toBe('test@example.com');
      expect(newState.formData.name).toBe('John Doe');
      expect(newState.isSubmitting).toBe(true);
    });
  });

  describe('Template Connections', () => {
    it('should create template connections', () => {
      const sourceTemplateId = 'source-template';
      const targetTemplateId = 'target-template';
      const config = {
        eventMapping: {
          'SUBMIT_ORDER': 'PROCESS_PAYMENT'
        },
        stateMapping: {
          'formData.email': 'customerEmail'
        }
      };

      // Mock ViewStateMachines for testing
      templateManager.adapter.viewStateMachines.set(sourceTemplateId, {
        on: jest.fn(),
        send: jest.fn()
      });
      templateManager.adapter.viewStateMachines.set(targetTemplateId, {
        on: jest.fn(),
        send: jest.fn()
      });

      const connectionId = templateManager.connectTemplates(sourceTemplateId, targetTemplateId, config);
      expect(connectionId).toBeDefined();
      expect(connectionId).toMatch(/^connection_/);
    });

    it('should get connections', () => {
      const connections = templateManager.getConnections();
      expect(Array.isArray(connections)).toBe(true);
    });

    it('should disconnect templates', () => {
      const sourceTemplateId = 'source-template';
      const targetTemplateId = 'target-template';
      
      // Mock ViewStateMachines for testing
      templateManager.adapter.viewStateMachines.set(sourceTemplateId, {
        on: jest.fn(),
        send: jest.fn()
      });
      templateManager.adapter.viewStateMachines.set(targetTemplateId, {
        on: jest.fn(),
        send: jest.fn()
      });

      const connectionId = templateManager.connectTemplates(sourceTemplateId, targetTemplateId, {});
      const disconnected = templateManager.disconnectTemplates(connectionId);
      expect(disconnected).toBe(true);
    });
  });

  describe('Template Validation', () => {
    it('should validate template with required components', () => {
      // Mock a valid template
      const mockTemplate = {
        id: 'valid-template',
        name: 'Valid Template',
        components: [
          {
            id: 'button-1',
            name: 'Button',
            callbacks: { onClick: 'BUTTON_CLICKED' }
          },
          {
            id: 'input-1',
            name: 'Input',
            callbacks: { onChange: 'INPUT_CHANGED' }
          },
          {
            id: 'container-1',
            name: 'Container',
            children: []
          }
        ],
        variables: {
          formData: {},
          validationErrors: []
        }
      };

      // Mock the template in cache
      templateManager.templateCache.set('valid-template', {
        template: mockTemplate,
        loadedAt: new Date(),
        options: {}
      });

      const validation = templateManager.validateTemplate('valid-template');
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.template.componentCount).toBe(3);
      expect(validation.template.variableCount).toBe(2);
    });

    it('should detect missing required components', () => {
      // Mock a template missing required components
      const mockTemplate = {
        id: 'invalid-template',
        name: 'Invalid Template',
        components: [
          {
            id: 'text-1',
            name: 'Text',
            callbacks: {}
          }
        ],
        variables: {}
      };

      // Mock the template in cache
      templateManager.templateCache.set('invalid-template', {
        template: mockTemplate,
        loadedAt: new Date(),
        options: {}
      });

      const validation = templateManager.validateTemplate('invalid-template');
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues.some(issue => issue.includes('Missing required components'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle template loading errors gracefully', async () => {
      // Mock a failed template load
      const originalLoadTemplate = templateManager.adapter.loadTemplate;
      templateManager.adapter.loadTemplate = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(templateManager.loadTemplate('non-existent')).rejects.toThrow('API Error');
      
      // Restore original method
      templateManager.adapter.loadTemplate = originalLoadTemplate;
    });

    it('should handle invalid template creation', () => {
      expect(() => {
        templateManager.createViewStateMachine('non-existent');
      }).toThrow('Template non-existent not cached');
    });
  });
}); 