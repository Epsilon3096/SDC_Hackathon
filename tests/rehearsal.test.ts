import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/server/app';
import { Store } from '../src/server/store';
import type { AppState, Profile } from '../src/shared/types';

type App = Awaited<ReturnType<typeof buildApp>>;
type Rehearsal = NonNullable<AppState['rehearsal']>;
let store: Store;
let app: App;
const origin = 'http://localhost:3001';
const headers = (cookie: string, generation?: string) => ({ cookie, origin, 'content-type': 'application/json', 'x-shiftbridge-workspace': 'rehearsal', ...(generation ? { 'x-shiftbridge-rehearsal-generation': generation } : {}) });
const normalHeaders = (cookie: string) => ({ cookie, origin, 'content-type': 'application/json' });
async function visitor(target = app) {
  const result = await target.inject({ method: 'GET', url: '/api/state' });
  expect(result.statusCode).toBe(200);
  const cookie = result.cookies.find(item => item.name === 'shiftbridge_session')!;
  return { cookie: `${cookie.name}=${cookie.value}`, state: result.json<AppState>() };
}
async function start(cookie: string, target = app) {
  const result = await target.inject({ method: 'POST', url: '/api/rehearsal/start', headers: headers(cookie), payload: {} });
  expect(result.statusCode).toBe(200);
  return result.json<Rehearsal>();
}
async function state(cookie: string, rehearsal = true, target = app) {
  const result = await target.inject({ method: 'GET', url: '/api/state', headers: rehearsal ? headers(cookie) : normalHeaders(cookie) });
  expect(result.statusCode).toBe(200);
  return result.json<AppState>();
}
beforeAll(async () => { store = await Store.open(); app = await buildApp({ store }); }, 30000);
afterAll(async () => { await app?.close(); await store?.close(); });

describe('isolated replayable rehearsal', () => {
  it('requires explicit mode and rejects arbitrary workspace identifiers', async () => {
    const current = await visitor();
    expect((await app.inject({ method: 'POST', url: '/api/rehearsal/start', headers: normalHeaders(current.cookie), payload: {} })).statusCode).toBe(400);
    expect((await app.inject({ method: 'GET', url: '/api/state', headers: headers(current.cookie) })).statusCode).toBe(409);
    expect((await app.inject({ method: 'POST', url: '/api/rehearsal/start', headers: { ...headers(current.cookie), 'x-shiftbridge-workspace': 'another-visitor-id' }, payload: {} })).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/api/rehearsal/start', headers: headers(current.cookie), payload: { workspaceId: 'another-visitor-id' } })).statusCode).toBe(400);
    expect(await state(current.cookie, false)).toEqual(current.state);
  });

  it('seeds an honest Farid case and permits only isolated review while another normal tab keeps its work', async () => {
    const current = await visitor();
    const farid = current.state.profiles.find(profile => profile.id === 'farid')!;
    const edit = await app.inject({ method: 'PUT', url: '/api/profiles/farid', headers: normalHeaders(current.cookie), payload: { ...farid, weeklyHours: 7, skills: { ...farid.skills, records: 3.5 } } });
    expect(edit.statusCode).toBe(200);
    const plan = await app.inject({ method: 'POST', url: '/api/plans', headers: normalHeaders(current.cookie), payload: { profileId: 'farid', roleId: 'qa', scenario: 'moderate', expectedProfileVersion: edit.json<Profile>().version } });
    expect(plan.statusCode).toBe(200);
    const normalBefore = await state(current.cookie, false);
    const run = await start(current.cookie);
    const rehearsal = await state(current.cookie);
    expect(rehearsal.rehearsal).toEqual(run);
    expect(run.caseId).toBe('farid-inspection');
    expect(rehearsal.profiles.find(profile => profile.id === 'farid')).toMatchObject({ weeklyHours: 4, skills: { records: 1, quality_data: 0 }, version: 1 });
    expect(rehearsal.plans).toEqual([]);
    expect(rehearsal.inferences).toEqual([]);
    expect(rehearsal.snapshots).toHaveLength(1);
    expect(rehearsal.snapshots[0].mappings).toEqual([]);
    expect(rehearsal.mappings.every(mapping => mapping.status === 'pending')).toBe(true);
    expect(rehearsal.audit[0].detail).toContain('Constructed synthetic Farid case');
    expect(rehearsal.connection).toMatchObject({ admin: true, reviewMode: 'demo' });
    const review = { decision: 'approved', note: 'Reviewed the source and bounded scenario assumption for this rehearsal.' };
    expect((await app.inject({ method: 'POST', url: '/api/evidence/mapping-intel-ai-literacy/review', headers: headers(current.cookie, run.generation), payload: review })).statusCode).toBe(200);
    const publish = await app.inject({ method: 'POST', url: '/api/snapshots', headers: headers(current.cookie, run.generation), payload: { expectedActiveId: rehearsal.activeSnapshotId, mappingIds: ['mapping-intel-ai-literacy'], title: 'Rehearsal evidence update' } });
    expect(publish.statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/evidence/mapping-intel-ai-literacy/review', headers: normalHeaders(current.cookie), payload: review })).statusCode).toBe(403);
    expect(await state(current.cookie, false)).toEqual(normalBefore);
    const other = await visitor();
    const otherRun = await start(other.cookie);
    expect(otherRun.generation).not.toBe(run.generation);
    expect((await state(other.cookie)).activeSnapshotId).toBe('snapshot-a');
    expect((await app.inject({ method: 'POST', url: '/api/evidence/mapping-intel-ai-literacy/review', headers: headers(other.cookie, run.generation), payload: review })).statusCode).toBe(409);
  });

  it('resumes a run and atomically restarts only that run while rejecting stale tab writes', async () => {
    const current = await visitor();
    const run = await start(current.cookie);
    const plan = await app.inject({ method: 'POST', url: '/api/plans', headers: headers(current.cookie, run.generation), payload: { profileId: 'farid', roleId: 'qa', scenario: 'moderate', expectedProfileVersion: 1 } });
    expect(plan.statusCode).toBe(200);
    expect(await start(current.cookie)).toEqual(run);
    expect((await state(current.cookie)).plans).toHaveLength(1);
    const restart = await app.inject({ method: 'POST', url: '/api/rehearsal/restart', headers: headers(current.cookie), payload: { expectedGeneration: run.generation } });
    expect(restart.statusCode).toBe(200);
    const next = restart.json<Rehearsal>();
    expect(next.generation).not.toBe(run.generation);
    const fresh = await state(current.cookie);
    expect(fresh.rehearsal).toEqual(next);
    expect(fresh.plans).toEqual([]);
    expect(fresh.snapshots).toHaveLength(1);
    const profile = fresh.profiles.find(item => item.id === 'farid')!;
    const staleProfile = await app.inject({ method: 'PUT', url: '/api/profiles/farid', headers: headers(current.cookie, run.generation), payload: { ...profile, name: 'Stale tab edit' } });
    expect(staleProfile.statusCode).toBe(409);
    const noGeneration = await app.inject({ method: 'POST', url: '/api/plans', headers: headers(current.cookie), payload: { profileId: 'farid' } });
    expect(noGeneration.statusCode).toBe(409);
    const staleProgress = await app.inject({ method: 'PATCH', url: `/api/plans/${plan.json().id}/progress`, headers: headers(current.cookie, run.generation), payload: { resourceId: plan.json().steps[0].resourceId, completed: true } });
    expect(staleProgress.statusCode).toBe(409);
    const staleLogout = await app.inject({ method: 'POST', url: '/api/admin/logout', headers: headers(current.cookie, run.generation), payload: {} });
    expect(staleLogout.statusCode).toBe(409);
    const staleRestart = await app.inject({ method: 'POST', url: '/api/rehearsal/restart', headers: headers(current.cookie), payload: { expectedGeneration: run.generation } });
    expect(staleRestart.statusCode).toBe(409);
    expect(await state(current.cookie)).toEqual(fresh);
    expect(await state(current.cookie, false)).toEqual(current.state);
    const revised = await app.inject({ method: 'PUT', url: '/api/profiles/farid', headers: headers(current.cookie, next.generation), payload: { ...profile, weeklyHours: 5 } });
    expect(revised.statusCode).toBe(200);
  });

  it('allows only one of two concurrent restarts of the same generation', async () => {
    const current = await visitor(); const run = await start(current.cookie);
    const results = await Promise.all([1, 2].map(() => app.inject({ method: 'POST', url: '/api/rehearsal/restart', headers: headers(current.cookie), payload: { expectedGeneration: run.generation } })));
    expect(results.map(result => result.statusCode).sort()).toEqual([200, 409]);
    expect((await state(current.cookie)).rehearsal).toEqual(results.find(result => result.statusCode === 200)!.json());
  });

  it('rejects an old in-flight source refresh at commit after a restart', async () => {
    let entered!: () => void; const started = new Promise<void>(resolve => { entered = resolve; });
    let finish!: (response: Response) => void;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => { entered(); return new Promise<Response>(resolve => { finish = resolve; }); });
    const target = await buildApp({ store, fetcher });
    try {
      const current = await visitor(target); const run = await start(current.cookie, target);
      const pending = target.inject({ method: 'POST', url: '/api/ingest', headers: headers(current.cookie, run.generation), payload: {} }).then(response => response);
      await started;
      const restarted = await target.inject({ method: 'POST', url: '/api/rehearsal/restart', headers: headers(current.cookie), payload: { expectedGeneration: run.generation } });
      expect(restarted.statusCode).toBe(200);
      const fresh = await state(current.cookie, true, target);
      finish(new Response('<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>https://arxiv.org/abs/2610.12345v1</id><title>Synthetic inspection transport test</title><summary>Industrial inspection transport fixture, not a real evidence claim.</summary><published>2026-10-20T10:00:00Z</published></entry></feed>'));
      expect((await pending).statusCode).toBe(409);
      expect(await state(current.cookie, true, target)).toEqual(fresh);
    } finally { await target.close(); }
  });

  it('blocks both GPU routes even when local reviewer access and RunPod are configured', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const target = await buildApp({ store, localReviewer: true, runpod: { key: 'test-only-placeholder', endpoint: 'test-endpoint', revision: 'a'.repeat(40) }, fetcher });
    try {
      const current = await visitor(target); const run = await start(current.cookie, target);
      expect((await state(current.cookie, true, target)).connection.reviewMode).toBe('demo');
      for (const url of ['/api/inference/intel-inline-2023', '/api/inference-status/test-job']) {
        expect((await target.inject({ method: 'POST', url, headers: headers(current.cookie, run.generation), payload: {} })).statusCode).toBe(403);
      }
      expect(fetcher).not.toHaveBeenCalled();
    } finally { await target.close(); }
  });
});
