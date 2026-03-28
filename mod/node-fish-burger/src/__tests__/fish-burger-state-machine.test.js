/**
 * Unit tests for fish-burger state machine
 */
import { createFishBurgerStateMachine } from '../machines/fish-burger-state-machine.js';
import { interpret } from 'xstate';

describe('fish-burger state machine', () => {
  let service;

  beforeEach(() => {
    const machine = createFishBurgerStateMachine();
    service = interpret(machine).start();
  });

  afterEach(() => {
    service?.stop();
  });

  it('starts in idle', () => {
    const state = service.getSnapshot();
    expect(state.value).toBe('idle');
    expect(state.context.orderId).toBeNull();
  });

  it('transitions to cooking on START_COOKING', () => {
    service.send({
      type: 'START_COOKING',
      orderId: 'ord-1',
      ingredients: ['lettuce'],
    });
    const state = service.getSnapshot();
    expect(state.value).toBe('cooking');
    expect(state.context.orderId).toBe('ord-1');
  });

  it('updates progress in cooking', () => {
    service.send({ type: 'START_COOKING', orderId: 'ord-1' });
    service.send({
      type: 'UPDATE_PROGRESS',
      cookingTime: 60,
      temperature: 200,
      progress: 75,
    });
    const state = service.getSnapshot();
    expect(state.value).toBe('cooking');
    expect(state.context.progress).toBe(75);
    expect(state.context.cookingTime).toBe(60);
  });

  it('transitions to order_complete on COMPLETE_COOKING', () => {
    service.send({ type: 'START_COOKING', orderId: 'ord-1' });
    service.send({ type: 'COMPLETE_COOKING', orderId: 'ord-1' });
    const state = service.getSnapshot();
    expect(state.value).toBe('order_complete');
  });

  it('transitions idle -> ordering on START_ORDER', () => {
    service.send({ type: 'START_ORDER' });
    expect(service.getSnapshot().value).toBe('ordering');
  });

  it('transitions cooking -> paused on PAUSE_COOKING', () => {
    service.send({ type: 'START_COOKING', orderId: 'ord-1' });
    service.send({ type: 'PAUSE_COOKING' });
    expect(service.getSnapshot().value).toBe('paused');
  });

  it('transitions paused -> cooking on RESUME_COOKING', () => {
    service.send({ type: 'START_COOKING', orderId: 'ord-1' });
    service.send({ type: 'PAUSE_COOKING' });
    service.send({ type: 'RESUME_COOKING' });
    expect(service.getSnapshot().value).toBe('cooking');
  });

  it('RESET from cooking returns to idle', () => {
    service.send({ type: 'START_COOKING', orderId: 'ord-1' });
    service.send({ type: 'RESET' });
    expect(service.getSnapshot().value).toBe('idle');
  });
});
