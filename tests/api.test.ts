import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildApp } from '../src/server/app';
import { hash, Store } from '../src/server/store';
import type { AppState, Plan, Profile } from '../src/shared/types';

type App = Awaited<ReturnType<typeof buildApp>>;
let store: Store;
let local: App;
let locked: App;
const origin = 'http://localhost:3001';
const json = (cookie: string, extra: Record<string, string> = {}) => ({ cookie, origin, 'content-type': 'application/json', ...extra });
async function session(app: App) {
  const response = await app.inject({ method: 'GET', url: '/api/state' });
  expect(response.statusCode).toBe(200);
  const cookie = response.cookies.find(c => c.name === 'shiftbridge_session')!;
  return { cookie: `${cookie.name}=${cookie.value}`, state: response.json<AppState>() };
}
async function state(app: App, cookie: string) {
  const response = await app.inject({ method: 'GET', url: '/api/state', headers: { cookie } });
  expect(response.statusCode).toBe(200);
  return response.json<AppState>();
}
const review = (app: App, cookie: string, id: string, decision = 'approved') => app.inject({ method: 'POST', url: `/api/evidence/${id}/review`, headers: json(cookie), payload: { decision, note: 'Reviewed the exact passage and its limited scenario implication.' } });

beforeAll(async () => {
  store = await Store.open();
  local = await buildApp({ store, localReviewer: true });
  locked = await buildApp({ store, adminToken: 'test-review-token-only' });
}, 30000);
afterAll(async () => { await local?.close(); await locked?.close(); await store?.close(); });

describe('profile persistence, isolation and optimistic writes', () => {
  it('round-trips the fractional seeded skills, retains changes and rejects stale versions', async () => {
    const current = await session(local);
    const profile = current.state.profiles[0];
    const response = await local.inject({ method: 'PUT', url: `/api/profiles/${profile.id}`, headers: json(current.cookie), payload: { ...profile, name: 'Synthetic edited worker' } });
    expect(response.statusCode).toBe(200);
    expect(response.json<Profile>()).toMatchObject({ version: profile.version + 1, skills: profile.skills });
    expect((await state(local, current.cookie)).profiles[0].name).toBe('Synthetic edited worker');
    const stale = await local.inject({ method: 'PUT', url: `/api/profiles/${profile.id}`, headers: json(current.cookie), payload: profile });
    expect(stale.statusCode).toBe(409);
    const other = await session(local);
    expect(other.state.profiles[0].name).toBe(profile.name);
    // A fresh server instance, using the same persistent store, recovers the session state.
    const restarted = await buildApp({ store, localReviewer: true });
    try { expect((await state(restarted, current.cookie)).profiles[0].name).toBe('Synthetic edited worker'); }
    finally { await restarted.close(); }
  });
  it('allows exactly one of two concurrent writes with the same expected profile version', async () => {
    const current = await session(local); const profile = current.state.profiles[0];
    const responses = await Promise.all(['First edit', 'Second edit'].map(name => local.inject({ method: 'PUT', url: `/api/profiles/${profile.id}`, headers: json(current.cookie), payload: { ...profile, name } })));
    expect(responses.map(r => r.statusCode).sort()).toEqual([200, 409]);
    expect((await state(local, current.cookie)).profiles[0].version).toBe(2);
  });
  it('does not commit a partially changed transaction when its callback fails', async () => {
    const id = 'transaction-rollback-test'; const before = await store.read(id);
    await expect(store.mutate(id, s => { s.activeSnapshotId = 'invalid-partial-state'; throw new Error('intentional rollback'); })).rejects.toThrow('intentional');
    expect((await store.read(id)).state.activeSnapshotId).toBe(before.state.activeSnapshotId);
  });
  it('persists data after the embedded database closes and reopens from disk', async () => {
    const root = resolve(import.meta.dirname, '../../../work/backend-test-data');
    await mkdir(root, { recursive: true });
    const directory = await mkdtemp(resolve(root, 'persistence-'));
    const first = await Store.open(undefined, directory);
    try {
      await first.mutate('durable-test', s => { s.profiles[0].name = 'Persisted synthetic worker'; s.profiles[0].version = 7; });
      await first.setAdmin('durable-test', 123456789);
    } finally { await first.close(); }
    const reopened = await Store.open(undefined, directory);
    try {
      const recovered = await reopened.read('durable-test');
      expect(recovered.state.profiles[0]).toMatchObject({ name: 'Persisted synthetic worker', version: 7 });
      expect(recovered.adminUntil).toBe(123456789);
    } finally { await reopened.close(); }
  });
});

describe('saved plans and prerequisite progress', () => {
  async function adopt(cookie: string, selection = { profileId: 'aina', scenario: 'moderate', roleId: 'qa' }) {
    const response = await local.inject({ method: 'POST', url: '/api/plans', headers: json(cookie), payload: selection });
    expect(response.statusCode).toBe(200);
    return response.json<Plan>();
  }
  async function complete(cookie: string, plan: Plan) {
    for (const step of plan.steps) {
      const response = await local.inject({ method: 'PATCH', url: `/api/plans/${plan.id}/progress`, headers: json(cookie), payload: { resourceId: step.resourceId, completed: true } });
      expect(response.statusCode).toBe(200);
    }
  }
  async function publishNext(cookie: string) {
    const before = await state(local, cookie);
    expect((await review(local, cookie, 'mapping-intel-ai-literacy')).statusCode).toBe(200);
    const response = await local.inject({ method: 'POST', url: '/api/snapshots', headers: json(cookie), payload: { expectedActiveId: before.activeSnapshotId, mappingIds: ['mapping-intel-ai-literacy'], title: 'Revised learning priorities' } });
    expect(response.statusCode).toBe(200);
    return response.json<{ id: string }>();
  }
  it('preserves valid completion when adopting a new snapshot and keeps repeat adoption idempotent', async () => {
    const current = await session(local);
    const original = await adopt(current.cookie);
    await complete(current.cookie, original);
    const originalCompleted = (await state(local, current.cookie)).plans.find(p => p.id === original.id)!;
    const snapshot = await publishNext(current.cookie);
    const updated = await adopt(current.cookie);
    expect(updated.id).not.toBe(original.id);
    expect(updated.snapshotId).toBe(snapshot.id);
    const retained = originalCompleted.completed.filter(id => updated.steps.some(step => step.resourceId === id));
    expect(retained.length).toBeGreaterThan(0);
    expect([...updated.completed].sort()).toEqual([...retained].sort());
    expect((await state(local, current.cookie)).plans.find(p => p.id === original.id)).toEqual(originalCompleted);
    const repeated = await adopt(current.cookie);
    expect(repeated).toEqual(updated);
    expect((await state(local, current.cookie)).plans).toHaveLength(2);
  });
  it('does not transfer completion to another worker or another route', async () => {
    const current = await session(local);
    const original = await adopt(current.cookie);
    await complete(current.cookie, original);
    const differentRole = await adopt(current.cookie, { profileId: 'aina', scenario: 'moderate', roleId: 'process' });
    const differentProfile = await adopt(current.cookie, { profileId: 'farid', scenario: 'moderate', roleId: 'qa' });
    expect(differentRole.steps.some(step => original.steps.some(old => old.resourceId === step.resourceId))).toBe(true);
    expect(differentProfile.steps.some(step => original.steps.some(old => old.resourceId === step.resourceId))).toBe(true);
    expect(differentRole.completed).toEqual([]);
    expect(differentProfile.completed).toEqual([]);
  });
  it('drops stale and transitively invalid completion when a prerequisite is absent', async () => {
    const current = await session(local);
    const original = await adopt(current.cookie);
    expect(original.steps.find(step => step.resourceId === 'root-cause-practice')?.prerequisiteIds).toContain('quality-data-practice');
    const workspace = hash(current.cookie.split('=')[1]);
    // Deliberately inconsistent legacy state exercises the migration boundary.
    await store.mutate(workspace, s => {
      const plan = s.plans.find(p => p.id === original.id)!;
      plan.completed = ['inspection-evidence', 'quality-data-practice', 'root-cause-practice', 'removed-legacy-resource'];
    });
    await publishNext(current.cookie);
    const revised = await adopt(current.cookie);
    expect(revised.completed).toEqual(['inspection-evidence']);
    expect(revised.completed).not.toContain('quality-data-practice');
    expect(revised.completed).not.toContain('root-cause-practice');
    expect(revised.completed).not.toContain('removed-legacy-resource');
  });
  it('enforces prerequisites, cascades an uncheck and never increases skill proficiency', async () => {
    const current = await session(local); const selection = { profileId: 'aina', scenario: 'moderate', roleId: 'qa' };
    const save = await local.inject({ method: 'POST', url: '/api/plans', headers: json(current.cookie), payload: selection });
    expect(save.statusCode).toBe(200);
    const plan = save.json<Plan>();
    const repeat = await local.inject({ method: 'POST', url: '/api/plans', headers: json(current.cookie), payload: selection });
    expect(repeat.json<Plan>().id).toBe(plan.id);
    const dependent = plan.steps.find(s => s.prerequisiteIds.length > 0)!;
    expect(dependent).toBeDefined();
    const premature = await local.inject({ method: 'PATCH', url: `/api/plans/${plan.id}/progress`, headers: json(current.cookie), payload: { resourceId: dependent.resourceId, completed: true } });
    expect(premature.statusCode).toBe(409);
    for (const step of plan.steps) {
      const completion = await local.inject({ method: 'PATCH', url: `/api/plans/${plan.id}/progress`, headers: json(current.cookie), payload: { resourceId: step.resourceId, completed: true } });
      expect(completion.statusCode).toBe(200);
    }
    const prerequisite = dependent.prerequisiteIds[0];
    const undone = await local.inject({ method: 'PATCH', url: `/api/plans/${plan.id}/progress`, headers: json(current.cookie), payload: { resourceId: prerequisite, completed: false } });
    expect(undone.json<Plan>().completed).not.toContain(dependent.resourceId);
    expect(undone.json<Plan>().completed).not.toContain(prerequisite);
    expect((await state(local, current.cookie)).profiles).toEqual(current.state.profiles);
  });
});

describe('review and publication boundaries', () => {
  it('persists new live-source metadata once without publishing or changing a saved plan', async () => {
    const xml = '<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>https://arxiv.org/abs/2610.12345v1</id><title>Synthetic transport fixture for inspection research</title><summary>Transport test fixture only: industrial inspection abstract for parser coverage.</summary><published>2026-10-20T10:00:00Z</published><updated>2026-10-20T10:00:00Z</updated></entry></feed>';
    const fake = vi.fn<typeof fetch>().mockImplementation(async () => new Response(xml));
    const app = await buildApp({ store, localReviewer: true, fetcher: fake });
    try {
      const current = await session(app);
      const saved = await app.inject({ method: 'POST', url: '/api/plans', headers: json(current.cookie), payload: { profileId: 'aina', scenario: 'moderate', roleId: 'qa' } });
      const first = await app.inject({ method: 'POST', url: '/api/ingest', headers: json(current.cookie), payload: {} });
      expect(first.statusCode).toBe(200);
      expect(first.json().created).toBe(1);
      const now = Date.now(); const clock = vi.spyOn(Date, 'now').mockReturnValue(now + 31001);
      try {
        const second = await app.inject({ method: 'POST', url: '/api/ingest', headers: json(current.cookie), payload: {} });
        expect(second.statusCode).toBe(200);
        expect(second.json().created).toBe(0);
      } finally { clock.mockRestore(); }
      const after = await state(app, current.cookie);
      expect(after.sources).toHaveLength(current.state.sources.length + 1);
      expect(after.activeSnapshotId).toBe(current.state.activeSnapshotId);
      expect(after.mappings).toEqual(current.state.mappings);
      expect(after.plans).toEqual([saved.json()]);
    } finally { await app.close(); }
  });
  it('leaves stored recommendations intact when both source endpoints are unavailable', async () => {
    const fake = vi.fn<typeof fetch>().mockRejectedValue(new Error('sensitive transport detail should not be exposed'));
    const app = await buildApp({ store, localReviewer: true, fetcher: fake });
    try {
      const current = await session(app);
      const failed = await app.inject({ method: 'POST', url: '/api/ingest', headers: json(current.cookie), payload: {} });
      expect(failed.statusCode).toBe(503);
      expect(failed.body).not.toContain('sensitive transport detail');
      const after = await state(app, current.cookie);
      expect(after.sources).toEqual(current.state.sources);
      expect(after.snapshots).toEqual(current.state.snapshots);
      expect(after.activeSnapshotId).toBe(current.state.activeSnapshotId);
    } finally { await app.close(); }
  });
  it('allows isolated demo review while keeping every paid inference route reviewer-only', async () => {
    const fake = vi.fn<typeof fetch>();
    const demo = await buildApp({ store, demoReview: true, runpod: { key: 'test-only-key', endpoint: 'test-endpoint', revision: 'a'.repeat(40) }, fetcher: fake });
    try {
      const first = await session(demo); const second = await session(demo);
      expect(first.state.connection.reviewMode).toBe('demo');
      expect(first.state.connection.runpod).toBe(true);
      expect((await review(demo, first.cookie, 'mapping-intel-ai-literacy')).statusCode).toBe(200);
      const publication = await demo.inject({ method: 'POST', url: '/api/snapshots', headers: json(first.cookie), payload: { expectedActiveId: first.state.activeSnapshotId, mappingIds: ['mapping-intel-ai-literacy'], title: 'Isolated demo publication' } });
      expect(publication.statusCode).toBe(200);
      const otherState = await state(demo, second.cookie);
      expect(otherState.activeSnapshotId).toBe(second.state.activeSnapshotId);
      expect(otherState.mappings.find(m => m.id === 'mapping-intel-ai-literacy')?.status).toBe('pending');
      expect((await demo.inject({ method: 'POST', url: '/api/inference/intel-inline-2023', headers: json(first.cookie), payload: {} })).statusCode).toBe(403);
      expect((await demo.inject({ method: 'POST', url: '/api/inference-status/any-job', headers: json(first.cookie), payload: {} })).statusCode).toBe(403);
      expect(fake).not.toHaveBeenCalled();
    } finally { await demo.close(); }
  });
  it('requires reviewer access and supports token login/logout without exposing the token', async () => {
    const current = await session(locked); const id = 'mapping-intel-ai-literacy';
    expect((await review(locked, current.cookie, id)).statusCode).toBe(403);
    const incorrect = await locked.inject({ method: 'POST', url: '/api/admin/login', headers: json(current.cookie), payload: { token: 'wrong-test-token' } });
    expect(incorrect.statusCode).toBe(401);
    const login = await locked.inject({ method: 'POST', url: '/api/admin/login', headers: json(current.cookie), payload: { token: 'test-review-token-only' } });
    expect(login.statusCode).toBe(200);
    expect((await review(locked, current.cookie, id)).statusCode).toBe(200);
    expect(JSON.stringify(await state(locked, current.cookie))).not.toContain('test-review-token-only');
    await locked.inject({ method: 'POST', url: '/api/admin/logout', headers: json(current.cookie), payload: {} });
    expect((await review(locked, current.cookie, id, 'rejected')).statusCode).toBe(403);
  });
  it('approval alone does not publish; publication is immutable and stale requests fail', async () => {
    const current = await session(local); const mappingId = 'mapping-intel-ai-literacy';
    expect((await review(local, current.cookie, mappingId)).statusCode).toBe(200);
    const approved = await state(local, current.cookie);
    expect(approved.activeSnapshotId).toBe(current.state.activeSnapshotId);
    expect(approved.snapshots).toHaveLength(1);
    const payload = { expectedActiveId: approved.activeSnapshotId, mappingIds: [mappingId], title: 'Reviewed inspection scenario' };
    const publish = await local.inject({ method: 'POST', url: '/api/snapshots', headers: json(current.cookie), payload });
    expect(publish.statusCode).toBe(200);
    const updated = await state(local, current.cookie);
    expect(updated.activeSnapshotId).toBe(publish.json().id);
    expect(updated.snapshots[0]).toEqual(current.state.snapshots[0]);
    expect((await local.inject({ method: 'POST', url: '/api/snapshots', headers: json(current.cookie), payload })).statusCode).toBe(409);
    expect((await review(local, current.cookie, mappingId, 'rejected')).statusCode).toBe(409);
    expect((await review(local, current.cookie, 'mapping-unrelated-chatbot', 'rejected')).statusCode).toBe(200);
    expect((await state(local, current.cookie)).activeSnapshotId).toBe(updated.activeSnapshotId);
  });
  it('blocks synthetic fixtures and unsupported empty passages from approval or publication', async () => {
    const current = await session(local);
    for (const id of ['mapping-unrelated-chatbot', 'mapping-research-insufficient']) {
      expect((await review(local, current.cookie, id)).statusCode).toBe(422);
      const result = await local.inject({ method: 'POST', url: '/api/snapshots', headers: json(current.cookie), payload: { expectedActiveId: current.state.activeSnapshotId, mappingIds: [id], title: 'Should be rejected' } });
      expect(result.statusCode).toBe(422);
    }
    expect((await state(local, current.cookie)).activeSnapshotId).toBe(current.state.activeSnapshotId);
  });
  it('protects state against cross-origin JSON and non-JSON mutation requests', async () => {
    const current = await session(local); const profile = current.state.profiles[0];
    const crossOrigin = await local.inject({ method: 'PUT', url: `/api/profiles/${profile.id}`, headers: json(current.cookie, { origin: 'https://attacker.invalid' }), payload: profile });
    expect(crossOrigin.statusCode).toBe(403);
    const crossSite = await local.inject({ method: 'PUT', url: `/api/profiles/${profile.id}`, headers: json(current.cookie, { 'sec-fetch-site': 'cross-site' }), payload: profile });
    expect(crossSite.statusCode).toBe(403);
    const text = await local.inject({ method: 'PUT', url: `/api/profiles/${profile.id}`, headers: { cookie: current.cookie, origin, 'content-type': 'text/plain' }, payload: JSON.stringify(profile) });
    expect(text.statusCode).toBe(415);
    expect((await state(local, current.cookie)).profiles).toEqual(current.state.profiles);
  });
  it('reports missing GPU configuration honestly and makes no remote GPU call', async () => {
    const fake = vi.fn<typeof fetch>(); const app = await buildApp({ store, localReviewer: true, fetcher: fake });
    try {
      const current = await session(app);
      const inference = await app.inject({ method: 'POST', url: '/api/inference/intel-inline-2023', headers: json(current.cookie), payload: {} });
      expect(inference.statusCode).toBe(200);
      expect(inference.json()).toMatchObject({ status: 'unconfigured', mode: 'none', score: null });
      expect(fake).not.toHaveBeenCalled();
      expect((await state(app, current.cookie)).activeSnapshotId).toBe(current.state.activeSnapshotId);
    } finally { await app.close(); }
  });
});
