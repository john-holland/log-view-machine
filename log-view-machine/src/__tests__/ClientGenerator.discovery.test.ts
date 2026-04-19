import { createViewStateMachine, ClientGenerator } from '../index';

describe('ClientGenerator discovery', () => {
  it('reflects real states, events, and withState keys from xstateConfig', () => {
    const machine = createViewStateMachine({
      machineId: 'pilot-two-state',
      xstateConfig: {
        initial: 'alpha',
        states: {
          alpha: { on: { GO_BETA: 'beta', SIDE: 'alpha' } },
          beta: { on: { GO_ALPHA: 'alpha' } },
        },
      },
      runHandlersOnTransition: false,
    })
      .withState('alpha', async () => {})
      .withState('beta', async () => {});

    const gen = new ClientGenerator();
    gen.registerMachine('pilot-two-state', machine);

    const d = gen.discover();
    expect([...(d.states.get('pilot-two-state') || [])].sort()).toEqual(['alpha', 'beta']);
    const events = new Set(d.events.get('pilot-two-state') || []);
    expect(events.has('GO_BETA')).toBe(true);
    expect(events.has('GO_ALPHA')).toBe(true);
    expect(events.has('SIDE')).toBe(true);
    expect(d.stateHandlers.get('pilot-two-state')?.sort()).toEqual(['alpha', 'beta']);
    expect(d.documentation).toContain('withState handlers');
    expect(d.documentation).toContain('alpha');
  });

  it('registers default ClientGeneratorConfig when none passed', () => {
    const machine = createViewStateMachine({
      machineId: 'bare',
      xstateConfig: { initial: 'idle', states: { idle: {} } },
    });
    const gen = new ClientGenerator();
    gen.registerMachine('bare', machine);
    const d = gen.discover();
    expect(d.states.get('bare')).toEqual(['idle']);
  });
});
