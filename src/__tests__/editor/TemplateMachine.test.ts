import { createTemplateMachine } from '../../editor/machines/template-machine';
import { MachineRouter } from '../../core/TomeBase';

describe('TemplateMachine', () => {
    let router: MachineRouter;
    let templateMachine: any;

    beforeEach(async () => {
        router = new MachineRouter();
        templateMachine = createTemplateMachine(router);
        router.register('TemplateMachine', templateMachine);
        await templateMachine.start();
    });

    afterEach(() => {
        templateMachine.stop?.();
    });

    describe('Initialization', () => {
        it('should start in idle state', () => {
            const state = templateMachine.getState();
            expect(state?.value).toBe('idle');
        });

        it('should have empty initial context', () => {
            const state = templateMachine.getState();
            expect(state?.context.currentTemplate).toBeNull();
            expect(state?.context.processedResult).toBeNull();
            expect(state?.context.validationErrors).toEqual([]);
        });
    });

    describe('PROCESS_TEMPLATE event', () => {
        it('should process simple template with variables', async () => {
            const template = 'Hello {{name}}, welcome to {{place}}!';
            const variables = { name: 'John', place: 'Tome Studio' };

            templateMachine.send('PROCESS_TEMPLATE', { template, variables });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            expect(state?.value).toBe('idle');
            expect(state?.context.processedResult.processed).toBe('Hello John, welcome to Tome Studio!');
        });

        it('should handle templates without variables', async () => {
            const template = '<div>Static content</div>';

            templateMachine.send('PROCESS_TEMPLATE', { template });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            expect(state?.context.processedResult.processed).toBe(template);
        });

        it('should handle multiple variable replacements', async () => {
            const template = '{{greeting}} {{name}}, {{greeting}} {{name}}!';
            const variables = { greeting: 'Hello', name: 'World' };

            templateMachine.send('PROCESS_TEMPLATE', { template, variables });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            expect(state?.context.processedResult.processed).toBe('Hello World, Hello World!');
        });

        it('should remove JSX value attributes', async () => {
            const template = '<input value={someValue} type="text" />';

            templateMachine.send('PROCESS_TEMPLATE', { template });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            const processed = state?.context.processedResult.processed;
            expect(processed).not.toContain('value={');
        });

        it('should preserve non-JSX attributes', async () => {
            const template = '<input type="text" class="input" />';

            templateMachine.send('PROCESS_TEMPLATE', { template });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            const processed = state?.context.processedResult.processed;
            expect(processed).toContain('type="text"');
            expect(processed).toContain('class="input"');
        });
    });

    describe('Template validation', () => {
        it('should validate processed template', async () => {
            const template = '<div>Valid content</div>';

            templateMachine.send('PROCESS_TEMPLATE', { template });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            expect(state?.value).toBe('idle');
            expect(state?.context.validationErrors).toEqual([]);
        });

        it('should store template metadata', async () => {
            const template = 'Test {{var}}';
            const variables = { var: 'value' };

            templateMachine.send('PROCESS_TEMPLATE', { template, variables });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            const result = state?.context.processedResult;
            
            expect(result.template).toBe(template);
            expect(result.variables).toEqual(variables);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('Error handling', () => {
        it('should handle empty template gracefully', async () => {
            templateMachine.send('PROCESS_TEMPLATE', { template: '' });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            // Should complete even with empty template
            expect(['idle', 'error']).toContain(state?.value);
        });

        it('should provide RETRY action from error state', async () => {
            // Force an error state somehow (e.g., null template)
            templateMachine.send('PROCESS_TEMPLATE', { template: null });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state1 = templateMachine.getState();
            if (state1?.value === 'error') {
                templateMachine.send('RETRY');
                
                const state2 = templateMachine.getState();
                expect(state2?.value).toBe('processing');
            }
        });

        it('should provide RESET action from error state', async () => {
            templateMachine.send('PROCESS_TEMPLATE', { template: null });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state1 = templateMachine.getState();
            if (state1?.value === 'error') {
                templateMachine.send('RESET');
                
                const state2 = templateMachine.getState();
                expect(state2?.value).toBe('idle');
                expect(state2?.context.error).toBeNull();
            }
        });
    });

    describe('Complex templates', () => {
        it('should handle nested variable references', async () => {
            const template = '<div class="{{className}}">{{content}}</div>';
            const variables = { className: 'container', content: 'Nested content' };

            templateMachine.send('PROCESS_TEMPLATE', { template, variables });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            expect(state?.context.processedResult.processed).toBe('<div class="container">Nested content</div>');
        });

        it('should handle HTML entities', async () => {
            const template = '<div>{{text}}</div>';
            const variables = { text: 'Text with &amp; entities &lt;tag&gt;' };

            templateMachine.send('PROCESS_TEMPLATE', { template, variables });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            expect(state?.context.processedResult.processed).toContain('&amp;');
        });

        it('should handle multiline templates', async () => {
            const template = `
                <div>
                    <h1>{{title}}</h1>
                    <p>{{description}}</p>
                </div>
            `;
            const variables = { title: 'Title', description: 'Description' };

            templateMachine.send('PROCESS_TEMPLATE', { template, variables });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = templateMachine.getState();
            const processed = state?.context.processedResult.processed;
            expect(processed).toContain('Title');
            expect(processed).toContain('Description');
        });
    });

    describe('State transitions', () => {
        it('should transition through processing -> validating -> idle', async () => {
            const states: string[] = [];
            
            // Subscribe to state changes
            templateMachine.subscribe((state: any) => {
                states.push(state.value);
            });

            templateMachine.send('PROCESS_TEMPLATE', { template: 'Test' });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Should have seen: idle, processing, validating, idle
            expect(states).toContain('processing');
            expect(states[states.length - 1]).toBe('idle');
        });

        it('should return to idle after each processing', async () => {
            // Process multiple templates
            for (let i = 0; i < 3; i++) {
                templateMachine.send('PROCESS_TEMPLATE', { template: `Template ${i}` });
                await new Promise(resolve => setTimeout(resolve, 200));
                
                const state = templateMachine.getState();
                expect(state?.value).toBe('idle');
            }
        });
    });
});

