import { describe, expect, it } from 'vitest';
import { workspaceHeaders } from './workspace-scope';

describe('workspace request isolation', () => {
  it('never sends rehearsal routing or generation from the normal workspace', () => {
    expect(workspaceHeaders({ mode: 'normal', generation: 'stale' }, 'POST', '/api/plans', true)).toEqual({ 'Content-Type': 'application/json' });
  });
  it('explicitly routes reads and mutations to the captured rehearsal generation', () => {
    const scope = { mode: 'rehearsal' as const, generation: 'generation-one' };
    expect(workspaceHeaders(scope, 'GET', '/api/state', false)).toEqual({ 'X-ShiftBridge-Workspace': 'rehearsal', 'X-ShiftBridge-Rehearsal-Generation': 'generation-one' });
    expect(workspaceHeaders(scope, 'POST', '/api/plans', true)['X-ShiftBridge-Rehearsal-Generation']).toBe('generation-one');
    expect(scope.generation).toBe('generation-one');
  });
  it('refuses a mutation before a rehearsal generation has been loaded', () => {
    expect(() => workspaceHeaders({ mode: 'rehearsal' }, 'PATCH', '/api/plans/a/progress', true)).toThrow('Load the current demonstration');
  });
  it('allows start and restart to establish a generation, while still routing them explicitly', () => {
    for (const path of ['/api/rehearsal/start', '/api/rehearsal/restart']) {
      expect(workspaceHeaders({ mode: 'rehearsal' }, 'POST', path, true)).toEqual({ 'Content-Type': 'application/json', 'X-ShiftBridge-Workspace': 'rehearsal' });
    }
  });
});
