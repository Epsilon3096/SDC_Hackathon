export interface WorkspaceScope { mode: 'normal' | 'rehearsal'; generation?: string; }

/** Scope is captured by a workspace instance, never read from mutable global mode. */
export function workspaceHeaders(scope: WorkspaceScope, method: string, path: string, hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = hasBody ? { 'Content-Type': 'application/json' } : {};
  if (scope.mode === 'normal') return headers;
  headers['X-ShiftBridge-Workspace'] = 'rehearsal';
  const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  const startsRound = path === '/api/rehearsal/start' || path === '/api/rehearsal/restart';
  if (mutation && !startsRound && !scope.generation) throw new Error('Load the current demonstration before changing its data.');
  if (scope.generation) headers['X-ShiftBridge-Rehearsal-Generation'] = scope.generation;
  return headers;
}
