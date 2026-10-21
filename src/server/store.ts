import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { mkdir } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import type { AppState } from '../shared/types';
import { profiles, skills, roles, resources, sources, seedMappings, initialSnapshot } from '../shared/catalogue';

type Query = (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>;
export type StoredState = Omit<AppState, 'connection'>;
export interface Workspace { state: StoredState; adminUntil: number; }
class WorkspaceConflict extends Error { statusCode = 409; }
export const hash = (text: string) => createHash('sha256').update(text).digest('hex');
export function seed(): StoredState {
  const state = structuredClone({ profiles, skills, roles, resources, sources, mappings: seedMappings, snapshots: [initialSnapshot], activeSnapshotId: initialSnapshot.id, plans: [], inferences: [], audit: [] });
  state.sources = state.sources.map(s => ({ ...s, hash: hash(s.excerpt + s.summary) }));
  state.snapshots[0].publishedAt = new Date().toISOString();
  return state;
}
export function audit(state: StoredState, action: string, detail: string) {
  state.audit.unshift({ id: randomUUID(), action, detail, at: new Date().toISOString() });
  state.audit = state.audit.slice(0, 300);
}
function rehearsalSeed(): StoredState {
  const state = seed();
  const farid = state.profiles.find(profile => profile.id === 'farid')!;
  farid.skills.records = 1; farid.skills.quality_data = 0; farid.weeklyHours = 4;
  state.rehearsal = { generation: randomUUID(), startedAt: new Date().toISOString(), caseId: 'farid-inspection' };
  audit(state, 'rehearsal.started', 'Constructed synthetic Farid case: records 1/4, quality-data analysis 0/4, four study hours per week. Seeded public evidence is pending review; no source retrieval, GPU inference, approval or plan adoption was performed. The normal workspace is unchanged.');
  return state;
}
function checkGeneration(state: StoredState, expectedGeneration?: string) {
  if (state.rehearsal ? state.rehearsal.generation !== expectedGeneration : expectedGeneration !== undefined) throw new WorkspaceConflict('This rehearsal changed or has not been started. Reload the rehearsal before making changes.');
}

export class Store {
  kind: 'embedded-postgres' | 'postgres';
  private embedded?: PGlite;
  private pool?: pg.Pool;
  private tail: Promise<unknown> = Promise.resolve();
  private constructor(databaseUrl?: string, dataDir?: string) {
    this.kind = databaseUrl ? 'postgres' : 'embedded-postgres';
    if (databaseUrl) this.pool = new pg.Pool({ connectionString: databaseUrl, max: 5, connectionTimeoutMillis: 10000 });
    else this.embedded = new PGlite(dataDir || 'memory://');
  }
  static async open(databaseUrl?: string, dataDir?: string) {
    if (!databaseUrl && dataDir && dataDir !== 'memory://') await mkdir(dataDir, { recursive: true });
    const store = new Store(databaseUrl, dataDir);
    await store.transaction(async query => {
      await query('CREATE TABLE IF NOT EXISTS shiftbridge_workspaces (id TEXT PRIMARY KEY, state JSONB NOT NULL, admin_until BIGINT NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    });
    return store;
  }
  private async transaction<T>(fn: (query: Query) => Promise<T>): Promise<T> {
    const run = async () => {
      if (this.embedded) return this.embedded.transaction(async tx => fn(async (sql, params) => tx.query(sql, params)));
      const client = await this.pool!.connect();
      try { await client.query('BEGIN'); const result = await fn((sql, params) => client.query(sql, params)); await client.query('COMMIT'); return result; }
      catch (e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }
    };
    // PGlite has one connection; serialisation also makes local read/write isolation explicit.
    if (this.pool) return run();
    const result = this.tail.then(run, run);
    this.tail = result.catch(() => undefined);
    return result;
  }
  async read(id: string, initialize = true): Promise<Workspace> {
    return this.transaction(async query => {
      if (initialize) await query('INSERT INTO shiftbridge_workspaces (id,state) VALUES ($1,$2::jsonb) ON CONFLICT (id) DO NOTHING', [id, JSON.stringify(seed())]);
      const { rows } = await query('SELECT state, admin_until FROM shiftbridge_workspaces WHERE id=$1', [id]);
      if (!rows.length) throw new WorkspaceConflict('Start the rehearsal before loading its workspace.');
      return { state: rows[0].state as StoredState, adminUntil: Number(rows[0].admin_until) };
    });
  }
  async mutate<T>(id: string, fn: (state: StoredState) => T, expectedGeneration?: string): Promise<T> {
    return this.transaction(async query => {
      await query('INSERT INTO shiftbridge_workspaces (id,state) VALUES ($1,$2::jsonb) ON CONFLICT (id) DO NOTHING', [id, JSON.stringify(seed())]);
      const { rows } = await query('SELECT state FROM shiftbridge_workspaces WHERE id=$1 FOR UPDATE', [id]);
      const state = rows[0].state as StoredState;
      checkGeneration(state, expectedGeneration);
      const result = fn(state);
      await query('UPDATE shiftbridge_workspaces SET state=$2::jsonb,updated_at=now() WHERE id=$1', [id, JSON.stringify(state)]);
      return result;
    });
  }
  async setAdmin(id: string, until: number, expectedGeneration?: string) {
    await this.transaction(async query => {
      await query('INSERT INTO shiftbridge_workspaces (id,state) VALUES ($1,$2::jsonb) ON CONFLICT (id) DO NOTHING', [id, JSON.stringify(seed())]);
      const { rows } = await query('SELECT state FROM shiftbridge_workspaces WHERE id=$1 FOR UPDATE', [id]);
      checkGeneration(rows[0].state as StoredState, expectedGeneration);
      await query('UPDATE shiftbridge_workspaces SET admin_until=$2 WHERE id=$1', [id, until]);
    });
  }
  async startRehearsal(id: string) {
    return this.transaction(async query => {
      await query('INSERT INTO shiftbridge_workspaces (id,state) VALUES ($1,$2::jsonb) ON CONFLICT (id) DO NOTHING', [id, JSON.stringify(rehearsalSeed())]);
      const { rows } = await query('SELECT state FROM shiftbridge_workspaces WHERE id=$1 FOR UPDATE', [id]);
      const state = rows[0].state as StoredState;
      if (!state.rehearsal) throw new WorkspaceConflict('This workspace is not a rehearsal.');
      return state.rehearsal;
    });
  }
  async restartRehearsal(id: string, expectedGeneration: string) {
    return this.transaction(async query => {
      const { rows } = await query('SELECT state FROM shiftbridge_workspaces WHERE id=$1 FOR UPDATE', [id]);
      if (!rows.length) throw new WorkspaceConflict('Start the rehearsal before restarting it.');
      checkGeneration(rows[0].state as StoredState, expectedGeneration);
      const state = rehearsalSeed();
      await query('UPDATE shiftbridge_workspaces SET state=$2::jsonb,admin_until=0,updated_at=now() WHERE id=$1', [id, JSON.stringify(state)]);
      return state.rehearsal!;
    });
  }
  async close() { await this.tail; if (this.embedded) await this.embedded.close(); if (this.pool) await this.pool.end(); }
}
