/**
 * Unit tests for can-publish logic (reviewed + optional login).
 */
const { canPublish } = require('../auth/can-publish.cjs.js');

describe('canPublish', () => {
  it('returns false when not reviewed', () => {
    expect(canPublish(false, false, false)).toBe(false);
    expect(canPublish(false, false, true)).toBe(false);
    expect(canPublish(false, true, false)).toBe(false);
    expect(canPublish(false, true, true)).toBe(false);
  });

  it('returns true when reviewed and login not required', () => {
    expect(canPublish(true, false, false)).toBe(true);
    expect(canPublish(true, false, true)).toBe(true);
  });

  it('returns false when reviewed, login required, and not logged in', () => {
    expect(canPublish(true, true, false)).toBe(false);
  });

  it('returns true when reviewed, login required, and logged in', () => {
    expect(canPublish(true, true, true)).toBe(true);
  });
});
