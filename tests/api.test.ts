import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildApp } from '../src/server/app';
import { hash, Store } from '../src/server/store';
import { skillMultiplier } from '../src/shared/engine';
import type { AppState, Mapping, Plan, Profile, Snapshot } from '../src/shared/types';

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

describe('hosted HTTPS request boundary', () => {
  it('accepts same-origin HTTPS writes behind the preview proxy and keeps secure first-party cookies', async () => {
    const hosted = await buildApp({ store, production: true, demoReview: true });
    const host = 'shiftbridge-test.replit.dev';
    try {
      const response = await hosted.inject({ method: 'GET', url: '/api/state', headers: { host, 'x-forwarded-proto': 'https', 'x-forwarded-for': '203.0.113.40' } });
      expect(response.statusCode).toBe(200);
      const session = response.cookies.find(c => c.name === 'shiftbridge_session')!;
      expect(session).toMatchObject({ secure: true, httpOnly: true, sameSite: 'Strict' });
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
      const headers = { host, origin: `https://${host}`, cookie: `${session.name}=${session.value}`, 'content-type': 'application/json', 'x-forwarded-proto': 'https', 'x-forwarded-for': '203.0.113.40' };
      const original = response.json<AppState>().profiles[0];
      const saved = await hosted.inject({ method: 'PUT', url: `/api/profiles/${original.id}`, headers, payload: { ...original, name: 'Hosted synthetic edit' } });
      expect(saved.statusCode).toBe(200);
      const adopted = await hosted.inject({ method: 'POST', url: '/api/plans', headers, payload: { profileId: original.id, roleId: 'qa', scenario: 'moderate' } });
      expect(adopted.statusCode).toBe(200);
      const recovered = await hosted.inject({ method: 'GET', url: '/api/state', headers });
      expect(recovered.json<AppState>().profiles[0].name).toBe('Hosted synthetic edit');
      expect(recovered.json<AppState>().plans).toHaveLength(1);
      const crossOrigin = await hosted.inject({ method: 'POST', url: '/api/plans', headers: { ...headers, origin: 'https://other-app.replit.dev' }, payload: { profileId: original.id, roleId: 'qa', scenario: 'moderate' } });
      expect(crossOrigin.statusCode).toBe(403);
    } finally { await hosted.close(); }
  });

  it('uses HTTPS mode for REPL_ID preview startup even when NODE_ENV is development', async () => {
    const signals = ['SIGINT', 'SIGTERM'] as const;
    const oldListeners = new Map(signals.map(signal => [signal, process.listeners(signal)]));
    const fakeApp = { listen: vi.fn().mockResolvedValue('http://0.0.0.0:3001'), close: vi.fn() };
    const fakeStore = { kind: 'postgres', close: vi.fn() };
    const build = vi.fn().mockResolvedValue(fakeApp);
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('REPL_ID', 'synthetic-preview-id');
    vi.stubEnv('REPLIT_DEPLOYMENT', '');
    vi.stubEnv('DATABASE_URL', 'postgresql://synthetic-test-only.invalid/not-connected');
    vi.stubEnv('HOST', '');
    vi.doMock('../src/server/store', () => ({ Store: { open: vi.fn().mockResolvedValue(fakeStore) } }));
    vi.doMock('../src/server/app', () => ({ buildApp: build }));
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await import('../src/server/index');
      expect(build).toHaveBeenCalledWith(expect.objectContaining({ production: true, localReviewer: false }));
      expect(fakeApp.listen).toHaveBeenCalledWith(expect.objectContaining({ host: '0.0.0.0' }));
    } finally {
      for (const signal of signals) for (const listener of process.listeners(signal)) if (!oldListeners.get(signal)!.includes(listener)) process.removeListener(signal, listener);
      log.mockRestore(); vi.unstubAllEnvs();
      vi.doUnmock('../src/server/store'); vi.doUnmock('../src/server/app');
    }
  });
});

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
    const temporaryRoot = resolve(tmpdir());
    const directory = await mkdtemp(join(temporaryRoot, 'shiftbridge-persistence-'));
    try {
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
    } finally {
      const target = resolve(directory);
      if (dirname(target) !== temporaryRoot || !basename(target).startsWith('shiftbridge-persistence-')) throw new Error('Unexpected persistence-test path; refusing cleanup.');
      await rm(target, { recursive: true, force: true });
    }
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
  it('rejects adoption after another tab changes the reviewed profile and preserves saved plans', async () => {
    const current = await session(local);
    const profile = current.state.profiles.find(p => p.id === 'aina')!;
    const selection = { profileId: profile.id, scenario: 'moderate', roleId: 'qa', snapshotId: current.state.activeSnapshotId, expectedProfileVersion: profile.version };
    const original = await local.inject({ method: 'POST', url: '/api/plans', headers: json(current.cookie), payload: selection });
    expect(original.statusCode).toBe(200);
    expect(original.json<Plan>().profileVersion).toBe(profile.version);
    const edit = await local.inject({ method: 'PUT', url: `/api/profiles/${profile.id}`, headers: json(current.cookie), payload: { ...profile, weeklyHours: profile.weeklyHours + 1 } });
    expect(edit.statusCode).toBe(200);
    const beforeRejectedAdoption = await state(local, current.cookie);
    const stale = await local.inject({ method: 'POST', url: '/api/plans', headers: json(current.cookie), payload: selection });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error).toContain('profile changed');
    const unchanged = await state(local, current.cookie);
    expect(unchanged.plans).toEqual(beforeRejectedAdoption.plans);
    expect(unchanged.audit).toEqual(beforeRejectedAdoption.audit);
    const refreshed = await local.inject({ method: 'POST', url: '/api/plans', headers: json(current.cookie), payload: { ...selection, expectedProfileVersion: edit.json<Profile>().version } });
    expect(refreshed.statusCode).toBe(200);
    expect(refreshed.json<Plan>().profileVersion).toBe(edit.json<Profile>().version);
    // A stale request must also fail when an equivalent current plan already exists.
    const savedPlans = (await state(local, current.cookie)).plans;
    const staleRepeat = await local.inject({ method: 'POST', url: '/api/plans', headers: json(current.cookie), payload: selection });
    expect(staleRepeat.statusCode).toBe(409);
    expect((await state(local, current.cookie)).plans).toEqual(savedPlans);
  });
  it('requires a positive integer when an expected profile version is supplied', async () => {
    const current = await session(local);
    for (const expectedProfileVersion of [0, -1, 1.5, '1']) {
      const response = await local.inject({ method: 'POST', url: '/api/plans', headers: json(current.cookie), payload: { profileId: 'aina', roleId: 'qa', expectedProfileVersion } });
      expect(response.statusCode).toBe(400);
    }
    expect((await state(local, current.cookie)).plans).toEqual([]);
  });
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
  it('prefers completion from the same scenario branch when adopting revised evidence', async () => {
    const current = await session(local);
    const moderate = await adopt(current.cookie);
    await complete(current.cookie, moderate);
    const fast = await adopt(current.cookie, { profileId: 'aina', scenario: 'fast', roleId: 'qa' });
    expect(fast.completed.length).toBeGreaterThan(0);
    // A new branch initially inherits route progress, then its own edits stay local.
    for (const step of fast.steps) {
      const response = await local.inject({ method: 'PATCH', url: `/api/plans/${fast.id}/progress`, headers: json(current.cookie), payload: { resourceId: step.resourceId, completed: false } });
      expect(response.statusCode).toBe(200);
    }
    const originalBranches = (await state(local, current.cookie)).plans;
    await publishNext(current.cookie);
    const revisedModerate = await adopt(current.cookie);
    const revisedFast = await adopt(current.cookie, { profileId: 'aina', scenario: 'fast', roleId: 'qa' });
    expect(revisedModerate.completed.length).toBeGreaterThan(0);
    expect(revisedFast.completed).toEqual([]);
    const after = await state(local, current.cookie);
    expect(after.plans.find(p => p.id === moderate.id)).toEqual(originalBranches.find(p => p.id === moderate.id));
    expect(after.plans.find(p => p.id === fast.id)).toEqual(originalBranches.find(p => p.id === fast.id));
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
  it('deduplicates the same paper across RSS and Atom while retaining mapping references and published state', async () => {
    const title = 'Synthetic transport fixture for industrial inspection';
    const excerpt = 'Transport test fixture only: industrial inspection and anomaly detection research.';
    const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>https://arxiv.org/abs/2610.12345v1</id><title>${title}</title><summary>${excerpt}</summary><published>2026-10-20T10:00:00Z</published><updated>2026-10-20T10:00:00Z</updated></entry></feed>`;
    const rss = `<rss version="2.0" xmlns:arxiv="http://arxiv.org/schemas/atom"><channel><link>http://rss.arxiv.org/rss/cs.CV</link><item><title>${title}</title><link>https://arxiv.org/abs/2610.12345</link><description>arXiv:2610.12345v1 Announce Type: new Abstract: ${excerpt}</description><pubDate>Wed, 21 Oct 2026 00:00:00 -0400</pubDate><arxiv:announce_type>new</arxiv:announce_type></item></channel></rss>`;
    const fake = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('Atom unavailable')).mockResolvedValueOnce(new Response(rss)).mockResolvedValueOnce(new Response(atom));
    const app = await buildApp({ store, localReviewer: true, fetcher: fake });
    try {
      const current = await session(app);
      const first = await app.inject({ method: 'POST', url: '/api/ingest', headers: json(current.cookie), payload: {} });
      expect(first.statusCode).toBe(200);
      expect(first.json()).toMatchObject({ created: 1, enriched: 0 });
      const recorded = (await state(app, current.cookie)).sources.find(s => s.url === 'https://arxiv.org/abs/2610.12345v1')!;
      expect(recorded.publishedAt).toBeNull();
      const mapping = await app.inject({ method: 'POST', url: '/api/mappings', headers: json(current.cookie), payload: { sourceId: recorded.id, passage: recorded.excerpt, implication: 'A reviewer-authored test interpretation of an inspection task.', skillId: 'ai_inspection', deltaModerate: 0.1, deltaFast: 0.2, rationale: 'This fixture checks stable references; it is not production evidence.' } });
      expect(mapping.statusCode).toBe(200);
      const beforeEnrichment = await state(app, current.cookie);
      const now = Date.now(); const clock = vi.spyOn(Date, 'now').mockReturnValue(now + 31001);
      try {
        const second = await app.inject({ method: 'POST', url: '/api/ingest', headers: json(current.cookie), payload: {} });
        expect(second.statusCode).toBe(200);
        expect(second.json()).toMatchObject({ created: 0, enriched: 1 });
      } finally { clock.mockRestore(); }
      const after = await state(app, current.cookie);
      const papers = after.sources.filter(s => s.url === recorded.url);
      expect(papers).toHaveLength(1);
      expect(papers[0]).toMatchObject({ id: recorded.id, hash: recorded.hash, excerpt: recorded.excerpt, publishedAt: '2026-10-20' });
      expect(after.mappings).toEqual(beforeEnrichment.mappings);
      expect(after.snapshots).toEqual(beforeEnrichment.snapshots);
      expect(after.plans).toEqual(beforeEnrichment.plans);
      expect(after.activeSnapshotId).toBe(beforeEnrichment.activeSnapshotId);
    } finally { await app.close(); }
  });
  it('replaces or withdraws a published interpretation without changing historical evidence or saved plans', async () => {
    const current = await session(local);
    const base = current.state.mappings.find(m => m.id === 'mapping-intel-ai-literacy')!;
    const propose = async (delta: number) => {
      const response = await local.inject({ method: 'POST', url: '/api/mappings', headers: json(current.cookie), payload: { sourceId: base.sourceId, passage: base.passage, implication: base.implication, skillId: base.skillId, deltaModerate: delta, deltaFast: delta, rationale: 'A bounded inspection scenario assumption requiring human review.' } });
      expect(response.statusCode).toBe(200);
      return response.json<Mapping>();
    };
    const publish = async (payload: object) => {
      const response = await local.inject({ method: 'POST', url: '/api/snapshots', headers: json(current.cookie), payload: { expectedActiveId: (await state(local, current.cookie)).activeSnapshotId, title: 'Reviewed interpretation update', ...payload } });
      expect(response.statusCode).toBe(200);
      return response.json<Snapshot>();
    };
    const original = await propose(0.25);
    expect((await review(local, current.cookie, original.id)).statusCode).toBe(200);
    const oldSnapshot = await publish({ mappingIds: [original.id] });
    expect(skillMultiplier(oldSnapshot, 'ai_inspection', 'moderate').multiplier).toBe(1.25);
    const plan = await local.inject({ method: 'POST', url: '/api/plans', headers: json(current.cookie), payload: { profileId: 'aina', roleId: 'qa', scenario: 'moderate' } });
    expect(plan.statusCode).toBe(200);
    const correction = await propose(0.10);
    expect((await review(local, current.cookie, correction.id)).statusCode).toBe(200);
    const reason = 'Closer review supports a smaller adjustment than the earlier interpretation.';
    const replacement = await publish({ mappingIds: [correction.id], retireMappingIds: [original.id], retirementNote: reason });
    expect(replacement).toMatchObject({ retiredMappingIds: [original.id], retirementNote: reason });
    expect(replacement.mappings.map(m => m.id)).not.toContain(original.id);
    expect(skillMultiplier(replacement, 'ai_inspection', 'moderate').multiplier).toBe(1.1);
    const withdrawn = await publish({ retireMappingIds: [correction.id], retirementNote: 'Withdraw this assumption until better evidence is available.' });
    expect(withdrawn.mappings).toEqual(current.state.snapshots[0].mappings);
    expect(skillMultiplier(withdrawn, 'ai_inspection', 'moderate').multiplier).toBe(1);
    const after = await state(local, current.cookie);
    expect(after.snapshots.find(s => s.id === oldSnapshot.id)).toEqual(oldSnapshot);
    expect(after.snapshots.find(s => s.id === replacement.id)).toEqual(replacement);
    expect(after.plans).toEqual([plan.json()]);
    expect(after.audit.find(a => a.action === 'snapshot.published' && a.detail.includes(replacement.id))?.detail).toContain(reason);
  });
  it('rejects invalid retirement requests and empty publications without changing active evidence', async () => {
    const current = await session(local);
    const id = 'mapping-intel-ai-literacy';
    expect((await review(local, current.cookie, id)).statusCode).toBe(200);
    const published = await local.inject({ method: 'POST', url: '/api/snapshots', headers: json(current.cookie), payload: { expectedActiveId: current.state.activeSnapshotId, mappingIds: [id], title: 'Initial publication' } });
    expect(published.statusCode).toBe(200);
    const before = await state(local, current.cookie);
    const attempts = [
      { retireMappingIds: [id] },
      { retireMappingIds: [id], retirementNote: 'Too short' },
      { retireMappingIds: ['mapping-unrelated-chatbot'], retirementNote: 'This mapping was never part of the active snapshot.' },
      { mappingIds: [id], retireMappingIds: [id], retirementNote: 'The same mapping cannot be added and removed together.' },
    ];
    for (const input of attempts) {
      const result = await local.inject({ method: 'POST', url: '/api/snapshots', headers: json(current.cookie), payload: { expectedActiveId: before.activeSnapshotId, title: 'Invalid retirement', ...input } });
      expect(result.statusCode).toBe(422);
    }
    const empty = await local.inject({ method: 'POST', url: '/api/snapshots', headers: json(current.cookie), payload: { expectedActiveId: before.activeSnapshotId, title: 'Empty publication' } });
    expect(empty.statusCode).toBe(409);
    const after = await state(local, current.cookie);
    expect(after.snapshots).toEqual(before.snapshots);
    expect(after.activeSnapshotId).toBe(before.activeSnapshotId);
    expect(after.audit).toEqual(before.audit);
  });
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
