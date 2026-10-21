import Fastify, { type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { assess, createPlan } from '../shared/engine';
import type { AppState, Evaluation, Mapping, Profile, ScenarioId, Snapshot } from '../shared/types';
import { Store, audit, hash, type StoredState } from './store';
import { configured, fetchArxiv, mergeSourceBatch, submitInference, pollInference, cacheKey, type RunpodConfig } from './connectors';

class HttpError extends Error { constructor(public statusCode: number, message: string) { super(message); } }
const fail = (status: number, message: string): never => { throw new HttpError(status, message); };
const idSchema = z.string().min(1).max(160).regex(/^[\w.-]+$/);
const skillEnum = z.enum(['measurement', 'inspection', 'records', 'quality_data', 'ai_inspection', 'root_cause']);
const level = z.number().min(0).max(4).multipleOf(0.5).nullable();
const profileSchema = z.object({ name: z.string().trim().min(1).max(60), qualification: z.enum(['academic_diploma', 'dkm4', 'dlkm5', 'skm3', 'skm2', 'spm', 'unknown']), field: z.string().trim().max(100), experienceYears: z.number().min(0).max(60), weeklyHours: z.number().min(0).max(40), budget: z.number().min(0).max(10000), skills: z.object({ measurement: level, inspection: level, records: level, quality_data: level, ai_inspection: level, root_cause: level }), version: z.number().int().positive() });
const selectionSchema = z.object({ profileId: idSchema, scenario: z.enum(['moderate', 'fast']).default('moderate'), roleId: idSchema.default('qa'), snapshotId: idSchema.optional() });
const adoptionSchema = selectionSchema.extend({ expectedProfileVersion: z.number().int().positive().optional() });
export interface AppOptions { store: Store; localReviewer?: boolean; demoReview?: boolean; adminToken?: string; production?: boolean; publicOrigin?: string; runpod?: RunpodConfig; staticDir?: string; fetcher?: typeof fetch; }

export async function buildApp(options: AppOptions) {
  const app = Fastify({ logger: false, bodyLimit: 20000, trustProxy: options.production ? (_address: string, hop: number) => hop < 1 : false });
  const { store } = options; const runpod = options.runpod || {};
  await app.register(cookie);
  await app.register(rateLimit, { max: 180, timeWindow: '1 minute' });
  const workspaceIds = new WeakMap<FastifyRequest, string>();
  const cooldowns = new Map<string, number>();
  function cooldown(key: string, ms: number) {
    const now = Date.now(); const previous = cooldowns.get(key) || 0;
    if (now - previous < ms) fail(429, 'Please wait before repeating this external request.');
    cooldowns.set(key, now);
    if (cooldowns.size > 1000) for (const [k, v] of cooldowns) if (now - v > 3600000) cooldowns.delete(k);
  }
  app.addHook('onRequest', async (req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff').header('Referrer-Policy', 'strict-origin-when-cross-origin').header('X-Frame-Options', 'DENY');
    if (options.production) reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if (!req.url.startsWith('/api/') || req.url === '/api/health') return;
    reply.header('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.headers.origin;
      const allowed = options.publicOrigin ? [options.publicOrigin] : [((options.production ? 'https://' : 'http://') + req.headers.host)];
      if (!options.production) allowed.push('http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:3001', 'http://localhost:3001');
      if (origin && !allowed.includes(origin)) fail(403, 'This request origin is not allowed.');
      if (req.headers['sec-fetch-site'] === 'cross-site') fail(403, 'Cross-site changes are not allowed.');
      if (!req.headers['content-type']?.includes('application/json')) fail(415, 'Send changes as application/json.');
    }
    let token = req.cookies.shiftbridge_session;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      token = randomBytes(32).toString('hex');
      reply.setCookie('shiftbridge_session', token, { httpOnly: true, secure: !!options.production, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 14 });
    }
    workspaceIds.set(req, hash(token));
  });
  const wid = (req: FastifyRequest) => workspaceIds.get(req)!;
  function validateMapping(state: StoredState, mapping: Mapping) {
    const source = state.sources.find(s => s.id === mapping.sourceId) || fail(422, 'A real supporting source is required.');
    if (mapping.fixture || source.type === 'synthetic') fail(422, 'Only supported real-source mappings may be published.');
    if (mapping.passage.trim().length < 12 || !source.excerpt.includes(mapping.passage)) fail(422, 'A nonempty exact supporting passage is required.');
    if (!Number.isFinite(mapping.deltaModerate) || !Number.isFinite(mapping.deltaFast) || Math.abs(mapping.deltaModerate) > 0.25 || Math.abs(mapping.deltaFast) > 0.5 || (!mapping.deltaModerate && !mapping.deltaFast)) fail(422, 'The mapping needs a valid bounded scenario rule.');
  }
  async function isAdmin(req: FastifyRequest) { return !!options.localReviewer || (await store.read(wid(req))).adminUntil > Date.now(); }
  async function requireAdmin(req: FastifyRequest, paid = false) { if ((!options.demoReview || paid) && !await isAdmin(req)) fail(403, 'Reviewer access is required. Use the team review token.'); }
  function select(state: StoredState, input: unknown) {
    const selection = selectionSchema.parse(input);
    const profile = state.profiles.find(p => p.id === selection.profileId) || fail(404, 'Profile not found.');
    const snapshot = state.snapshots.find(s => s.id === (selection.snapshotId || state.activeSnapshotId)) || fail(404, 'Evidence snapshot not found.');
    if (!state.roles.some(r => r.id === selection.roleId)) fail(404, 'Role not found.');
    return { ...selection, profile, snapshot };
  }
  app.get('/api/health', async () => ({ ok: true, version: '0.1.0' }));
  app.get('/api/state', async (req): Promise<AppState> => {
    const { state, adminUntil } = await store.read(wid(req));
    const authenticated = adminUntil > Date.now();
    return { ...state, connection: { database: store.kind, runpod: configured(runpod), adminConfigured: !!options.adminToken || !!options.localReviewer, admin: !!options.localReviewer || !!options.demoReview || authenticated, reviewMode: options.localReviewer ? 'local' : authenticated ? 'authenticated' : options.demoReview ? 'demo' : 'locked', connector: 'arXiv Atom API / daily RSS fallback · manual refresh' } };
  });
  app.get('/api/evaluate', async (req): Promise<Evaluation> => {
    const { state } = await store.read(wid(req)); const input = select(state, req.query);
    return { profile: input.profile, snapshot: input.snapshot, scenario: input.scenario, assessments: assess(input.profile, input.snapshot, input.scenario, state.roles), plan: createPlan(input.profile, input.snapshot, input.scenario, input.roleId, state.roles, state.resources) };
  });
  app.put<{ Params: { id: string } }>('/api/profiles/:id', async req => {
    const input = profileSchema.parse(req.body);
    return store.mutate(wid(req), state => {
      const index = state.profiles.findIndex(p => p.id === req.params.id);
      if (index === -1) fail(404, 'Profile not found.');
      if (state.profiles[index].version !== input.version) fail(409, 'This profile changed in another tab. Reload before saving.');
      const profile: Profile = { ...input, id: state.profiles[index].id, version: input.version + 1 };
      state.profiles[index] = profile; audit(state, 'profile.saved', profile.id + ' · version ' + profile.version); return profile;
    });
  });
  app.post('/api/plans', async req => store.mutate(wid(req), state => {
    const requested = adoptionSchema.parse(req.body);
    const input = select(state, requested);
    if (requested.expectedProfileVersion !== undefined && requested.expectedProfileVersion !== input.profile.version) fail(409, 'This profile changed after the plan was reviewed. Reload and inspect the updated plan before adopting it.');
    const existing = state.plans.find(p => p.profileId === input.profileId && p.profileVersion === input.profile.version && p.snapshotId === input.snapshot.id && p.scenario === input.scenario && p.roleId === input.roleId);
    if (existing) return existing;
    const plan = { ...createPlan(input.profile, input.snapshot, input.scenario, input.roleId, state.roles, state.resources), id: randomUUID(), createdAt: new Date().toISOString(), completed: [] as string[] };
    if (plan.steps.length === 0) fail(422, 'No feasible learning steps are available. Review your constraints first.');
    const previous = state.plans.find(p => p.profileId === input.profileId && p.roleId === input.roleId && p.scenario === input.scenario)
      || state.plans.find(p => p.profileId === input.profileId && p.roleId === input.roleId);
    if (previous) {
      // Resource IDs refer to this immutable starter catalogue. Carry completion
      // only within the same worker/route and only while prerequisites still hold.
      plan.completed = previous.completed.filter(id => plan.steps.some(step => step.resourceId === id));
      let changed = true;
      while (changed) {
        const valid = plan.completed.filter(id => plan.steps.find(step => step.resourceId === id)!.prerequisiteIds.every(required => plan.completed.includes(required)));
        changed = valid.length !== plan.completed.length; plan.completed = valid;
      }
    }
    state.plans.unshift(plan); state.plans = state.plans.slice(0, 50); audit(state, 'plan.adopted', plan.roleId + ' · ' + plan.snapshotId); return plan;
  }));
  app.patch<{ Params: { id: string } }>('/api/plans/:id/progress', async req => {
    const input = z.object({ resourceId: idSchema, completed: z.boolean() }).parse(req.body);
    return store.mutate(wid(req), state => {
      const plan = state.plans.find(p => p.id === req.params.id) || fail(404, 'Saved plan not found.');
      const step = plan.steps.find(s => s.resourceId === input.resourceId) || fail(400, 'Resource is not part of this saved plan.');
      if (input.completed && step.prerequisiteIds.some(p => !plan.completed.includes(p))) fail(409, 'Complete the prerequisite steps first.');
      if (input.completed) plan.completed = [...new Set([...plan.completed, input.resourceId])];
      else {
        const remove = new Set([input.resourceId]); let changed = true;
        while (changed) { changed = false; for (const candidate of plan.steps) if (!remove.has(candidate.resourceId) && candidate.prerequisiteIds.some(id => remove.has(id))) { remove.add(candidate.resourceId); changed = true; } }
        plan.completed = plan.completed.filter(id => !remove.has(id));
      }
      audit(state, 'plan.progress', plan.id + ' · ' + input.resourceId + ' · ' + input.completed); return plan;
    });
  });
  app.post('/api/admin/login', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async req => {
    const { token } = z.object({ token: z.string().min(1).max(300) }).parse(req.body);
    if (!options.adminToken || !timingSafeEqual(Buffer.from(hash(token)), Buffer.from(hash(options.adminToken)))) fail(401, 'Reviewer token is incorrect or not configured.');
    await store.setAdmin(wid(req), Date.now() + 3600000); return { ok: true };
  });
  app.post('/api/admin/logout', async req => { await store.setAdmin(wid(req), 0); return { ok: true }; });
  app.post('/api/mappings', async req => {
    await requireAdmin(req);
    const input = z.object({ sourceId: idSchema, passage: z.string().trim().min(12).max(1200), implication: z.string().trim().min(20).max(800), skillId: skillEnum, deltaModerate: z.number().min(-0.25).max(0.25), deltaFast: z.number().min(-0.5).max(0.5), rationale: z.string().trim().min(20).max(1200) }).parse(req.body);
    return store.mutate(wid(req), state => {
      const source = state.sources.find(s => s.id === input.sourceId) || fail(404, 'Source not found.');
      if (source.type === 'synthetic') fail(422, 'Synthetic evidence cannot support published recommendations.');
      if (!source.excerpt.includes(input.passage)) fail(422, 'The passage must appear exactly in the stored source excerpt.');
      if (state.mappings.length >= 100) fail(422, 'This demonstration workspace has reached its mapping limit.');
      if (!input.deltaModerate && !input.deltaFast) fail(422, 'A mapping must define a nonzero scenario change.');
      const mapping: Mapping = { ...input, id: randomUUID(), status: 'pending', reviewNote: '', reviewedAt: null, fixture: false };
      state.mappings.push(mapping); audit(state, 'mapping.proposed', mapping.id); return mapping;
    });
  });
  app.post<{ Params: { id: string } }>('/api/evidence/:id/review', async req => {
    await requireAdmin(req); const input = z.object({ decision: z.enum(['approved', 'rejected']), note: z.string().trim().min(12).max(1200) }).parse(req.body);
    return store.mutate(wid(req), state => {
      const mapping = state.mappings.find(m => m.id === req.params.id) || fail(404, 'Mapping not found.');
      if (state.snapshots.some(s => s.mappings.some(m => m.id === mapping.id))) fail(409, 'Published mappings are immutable. Retire or replace them in a new snapshot.');
      if (input.decision === 'approved' && mapping.fixture) fail(422, 'This demonstration fixture has insufficient support and cannot be published. Reject it and record why.');
      if (input.decision === 'approved') validateMapping(state, mapping);
      mapping.status = input.decision; mapping.reviewNote = input.note; mapping.reviewedAt = new Date().toISOString(); audit(state, 'mapping.' + input.decision, mapping.id + ' · ' + input.note); return mapping;
    });
  });
  app.post('/api/snapshots', async req => {
    await requireAdmin(req); const input = z.object({ expectedActiveId: idSchema, mappingIds: z.array(idSchema).max(50).default([]), retireMappingIds: z.array(idSchema).max(50).default([]), retirementNote: z.string().trim().max(1200).optional(), title: z.string().trim().min(1).max(80) }).parse(req.body);
    return store.mutate(wid(req), state => {
      if (state.activeSnapshotId !== input.expectedActiveId) fail(409, 'The active snapshot changed. Reload and inspect the difference before publishing.');
      if (state.snapshots.length >= 50) fail(422, 'This demonstration workspace has reached its snapshot limit.');
      const parent = state.snapshots.find(s => s.id === state.activeSnapshotId)!;
      const retired = [...new Set(input.retireMappingIds)];
      if (retired.length && (!input.retirementNote || input.retirementNote.length < 12)) fail(422, 'Record a retirement reason of at least 12 characters.');
      if (retired.some(id => !parent.mappings.some(mapping => mapping.id === id))) fail(422, 'Only mappings in the active snapshot may be retired.');
      if (retired.some(id => input.mappingIds.includes(id))) fail(422, 'A mapping cannot be added and retired in the same publication.');
      const selected = [...new Set(input.mappingIds)].map(id => state.mappings.find(m => m.id === id) || fail(404, 'Mapping not found.'));
      if (selected.some(m => m.status !== 'approved' || m.fixture)) fail(422, 'Only approved, supported mappings may be published.');
      for (const mapping of selected) validateMapping(state, mapping);
      const additions = selected.filter(m => !parent.mappings.some(old => old.id === m.id));
      if (!additions.length && !retired.length) fail(409, 'The publication needs at least one new mapping or an active mapping to retire.');
      const snapshot: Snapshot = { id: 'snapshot-' + (parent.version + 1) + '-' + randomUUID().slice(0, 8), parentId: parent.id, title: input.title, version: parent.version + 1, publishedAt: new Date().toISOString(), mappings: structuredClone([...parent.mappings.filter(mapping => !retired.includes(mapping.id)), ...additions]), ...(retired.length ? { retiredMappingIds: retired, retirementNote: input.retirementNote! } : {}) };
      state.snapshots.push(snapshot); state.activeSnapshotId = snapshot.id; audit(state, 'snapshot.published', snapshot.id + ' · ' + additions.length + ' reviewed mapping(s)' + (retired.length ? ' · ' + retired.length + ' retired: ' + input.retirementNote : '')); return snapshot;
    });
  });
  app.post('/api/ingest', async req => {
    await requireAdmin(req); cooldown(wid(req) + ':ingest', 30000);
    let incoming; try { incoming = await fetchArxiv(options.fetcher); } catch { fail(503, 'The live arXiv feed could not be retrieved. Existing evidence and plans are unchanged. Retry later.'); }
    return store.mutate(wid(req), state => {
      const result = mergeSourceBatch(state.sources, incoming!);
      if (state.sources.length > 200) fail(422, 'This demonstration workspace has reached its source limit.');
      audit(state, 'source.refreshed', result.created + ' new article version(s); ' + result.enriched + ' existing source date(s) verified; no mappings automatically approved');
      return { ...result, message: result.created ? 'New research saved for review. Recommendations have not changed.' : result.enriched ? 'No new article versions found. Existing source dates were verified; recommendations are unchanged.' : 'No new article versions found. Recommendations are unchanged.' };
    });
  });
  app.post<{ Params: { sourceId: string } }>('/api/inference/:sourceId', async req => {
    await requireAdmin(req, true); const { state } = await store.read(wid(req));
    const source = state.sources.find(s => s.id === req.params.sourceId) || fail(404, 'Source not found.');
    if (source.type === 'synthetic') fail(422, 'Use a real source for the live GPU relevance check.');
    const existing = state.inferences.find(i => i.id === cacheKey(source, runpod) && ['completed', 'pending'].includes(i.status));
    if (existing) return { ...existing, mode: existing.status === 'completed' ? 'cached' : existing.mode };
    cooldown(wid(req) + ':inference', 30000);
    let inference; try { inference = await submitInference(source, runpod, options.fetcher); } catch { fail(503, 'RunPod submission failed. No recommendation was changed.'); }
    return store.mutate(wid(req), s => { s.inferences = [inference!, ...s.inferences.filter(i => i.id !== inference!.id)].slice(0, 100); audit(s, 'inference.' + inference!.status, source.id); return inference!; });
  });
  app.post<{ Params: { id: string } }>('/api/inference-status/:id', async req => {
    await requireAdmin(req, true); const { state } = await store.read(wid(req));
    const inference = state.inferences.find(i => i.id === req.params.id) || fail(404, 'Inference not found.');
    if (inference.status !== 'pending') return inference;
    cooldown(wid(req) + ':poll:' + inference.id, 2000);
    const source = state.sources.find(s => s.id === inference.sourceId)!;
    let updated; try { updated = await pollInference(inference, source, runpod, options.fetcher); } catch { fail(503, 'Provider status could not be verified. The pending job and published recommendations are preserved.'); }
    return store.mutate(wid(req), s => { const index = s.inferences.findIndex(i => i.id === inference.id); s.inferences[index] = updated!; if (updated!.status !== 'pending') audit(s, 'inference.' + updated!.status, updated!.id); return updated!; });
  });
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof z.ZodError) return reply.code(400).send({ error: 'Invalid input: ' + error.issues.map(i => i.path.join('.') + ' ' + i.message).join('; ').slice(0, 700) });
    const status = (error as HttpError).statusCode;
    return reply.code(status && status >= 400 && status < 600 ? status : 500).send({ error: status ? (error as Error).message : 'The request could not be completed. Your published data was preserved.' });
  });
  const staticDir = options.staticDir || resolve('dist');
  if (existsSync(staticDir)) {
    await app.register(staticFiles, { root: staticDir, wildcard: false });
    app.setNotFoundHandler((req, reply) => req.url.startsWith('/api/') ? reply.code(404).send({ error: 'Endpoint not found.' }) : reply.sendFile('index.html'));
  }
  return app;
}
