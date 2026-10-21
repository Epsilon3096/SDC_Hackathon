import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Store } from '../src/server/store';

// Deliberately distinct from DATABASE_URL. The optional suite must never use a
// development/production database by accident, and cleans up only its own schema.
const databaseUrl = process.env.SHIFTBRIDGE_TEST_DATABASE_URL;
const schema = 'shiftbridge_test_' + randomBytes(12).toString('hex');
let pool: pg.Pool;
let first: Store;
let second: Store;
let scopedUrl: string;
let created = false;

function disposableDatabaseUrl(value: string) {
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error('PostgreSQL checks require a valid disposable test database URL.'); }
  // pg accepts query parameters that override the hostname and read TLS files.
  // Validate the bare URL before constructing a pool; only this test may add options.
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.pathname !== '/shiftbridge_ci' || url.search || url.hash) {
    throw new Error('PostgreSQL checks require a bare loopback URL for a disposable database named shiftbridge_ci, without query parameters or fragments.');
  }
  return url;
}

describe('PostgreSQL check configuration safety', () => {
  it('accepts only the intended bare loopback database', () => {
    expect(disposableDatabaseUrl('postgresql://test:test@127.0.0.1:5432/shiftbridge_ci').hostname).toBe('127.0.0.1');
    expect(disposableDatabaseUrl('postgres://test:test@[::1]/shiftbridge_ci').hostname).toBe('[::1]');
  });
  it.each([
    'postgresql://localhost/shiftbridge_ci?host=remote.invalid',
    'postgresql://localhost/shiftbridge_ci?sslkey=private-key.pem',
    'postgresql://localhost/shiftbridge_ci?options=-c%20search_path=public',
    'postgresql://localhost/shiftbridge_ci#ignored-fragment',
    'postgresql://remote.invalid/shiftbridge_ci',
    'postgresql://localhost/another-database',
  ])('rejects unsafe or unintended connection configuration %#', value => {
    expect(() => disposableDatabaseUrl(value)).toThrow('bare loopback URL');
  });
  it('does not echo malformed connection credentials in its error', () => {
    expect(() => disposableDatabaseUrl('postgresql://test:SENSITIVE_TEST_MARKER@[broken')).toThrow('valid disposable test database URL');
    try { disposableDatabaseUrl('postgresql://test:SENSITIVE_TEST_MARKER@[broken'); }
    catch (error) { expect(String(error)).not.toContain('SENSITIVE_TEST_MARKER'); }
  });
});

describe.skipIf(!databaseUrl)('real PostgreSQL transactions', () => {
  beforeAll(async () => {
    const url = disposableDatabaseUrl(databaseUrl!);
    pool = new pg.Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 });
    await pool.query(`CREATE SCHEMA "${schema}"`);
    created = true;
    url.searchParams.set('options', '-c search_path=' + schema);
    scopedUrl = url.toString();
    first = await Store.open(scopedUrl);
    second = await Store.open(scopedUrl);
  }, 30000);

  afterAll(async () => {
    await first?.close();
    await second?.close();
    if (created) await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool?.end();
  });

  it('locks competing changes across independent pools instead of losing one update', async () => {
    await first.read('race');
    const update = (store: Store) => store.mutate('race', state => {
      if (state.profiles[0].version !== 1) throw new Error('stale profile');
      state.profiles[0].version++;
      state.profiles[0].weeklyHours = 7;
    });
    const results = await Promise.allSettled([update(first), update(second)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect((await first.read('race')).state.profiles[0]).toMatchObject({ version: 2, weeklyHours: 7 });
  });

  it('rolls back a failed mutation without corrupting the saved record', async () => {
    const before = (await first.read('rollback')).state;
    await expect(second.mutate('rollback', state => {
      state.profiles[0].name = 'Must not persist';
      throw new Error('simulated failure');
    })).rejects.toThrow('simulated failure');
    expect((await first.read('rollback')).state).toEqual(before);
  });

  it('recovers saved state after reconnect and rejects an old rehearsal generation', async () => {
    await first.mutate('persist', state => { state.profiles[0].weeklyHours = 9; });
    const round = await first.startRehearsal('rehearsal');
    await second.restartRehearsal('rehearsal', round!.generation);
    await expect(first.mutate('rehearsal', state => { state.profiles[0].weeklyHours = 1; }, round!.generation)).rejects.toThrow(/rehearsal changed/);
    const reopened = await Store.open(scopedUrl);
    try {
      expect((await reopened.read('persist')).state.profiles[0].weeklyHours).toBe(9);
      expect((await reopened.read('rehearsal', false)).state.rehearsal!.generation).not.toBe(round!.generation);
    } finally { await reopened.close(); }
  });
});
