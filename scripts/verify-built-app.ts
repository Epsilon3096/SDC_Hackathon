import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildApp } from '../src/server/app';
import { Store } from '../src/server/store';
import type { AppState, Plan } from '../src/shared/types';

// Exercise the actual production bundle and HTTP boundary without external services
// or touching the developer's persisted workspace.
const staticDir = resolve('dist');
await readFile(resolve(staticDir, 'index.html'), 'utf8');
const store = await Store.open();
const app = await buildApp({ store, staticDir, production: true, demoReview: true, publicOrigin: 'https://shiftbridge.example' });
try {
  const homepage = await app.inject({ method: 'GET', url: '/' });
  assert.equal(homepage.statusCode, 200);
  assert.match(homepage.body, /<div id="root"><\/div>/);
  assert.doesNotMatch(homepage.body, /\/src\/client\//);
  assert.match(String(homepage.headers['content-security-policy']), /frame-ancestors 'none'/);
  const assets = [...homepage.body.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map(match => match[1]);
  assert(assets.some(asset => asset.endsWith('.js')), 'Built JavaScript is referenced');
  assert(assets.some(asset => asset.endsWith('.css')), 'Built CSS is referenced');
  for (const url of assets) {
    const response = await app.inject({ method: 'GET', url });
    assert.equal(response.statusCode, 200, url);
    assert(!String(response.headers['content-type']).includes('text/html'), `${url} must not fall back to the app shell`);
    assert(response.body.length > 100, `${url} is nonempty`);
  }
  const practice = await app.inject({ method: 'GET', url: '/practice/qa-inspection-cases.csv' });
  assert.equal(practice.statusCode, 200);
  assert.match(practice.body, /reference_defect/);
  assert.match(practice.body, /ai_flag/);
  const missingApi = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
  assert.equal(missingApi.statusCode, 404);
  assert.match(String(missingApi.headers['content-type']), /application\/json/);

  const opened = await app.inject({ method: 'GET', url: '/api/state' });
  assert.equal(opened.statusCode, 200);
  assert.equal(opened.headers['cache-control'], 'no-store');
  const cookie = opened.cookies.find(item => item.name === 'shiftbridge_session')!;
  assert(cookie.httpOnly && cookie.secure && cookie.sameSite === 'Strict');
  const profile = opened.json<AppState>().profiles[0];
  const headers = { cookie: `${cookie.name}=${cookie.value}`, origin: 'https://shiftbridge.example', 'content-type': 'application/json' };
  const adoption = await app.inject({ method: 'POST', url: '/api/plans', headers, payload: { profileId: profile.id, roleId: 'qa', scenario: 'moderate', expectedProfileVersion: profile.version } });
  assert.equal(adoption.statusCode, 200);
  const plan = adoption.json<Plan>();
  const recovered = await app.inject({ method: 'GET', url: '/api/state', headers });
  assert(recovered.json<AppState>().plans.some(item => item.id === plan.id && item.decision?.profile.version === profile.version));
  const stranger = await app.inject({ method: 'GET', url: '/api/state' });
  assert.equal(stranger.json<AppState>().plans.length, 0);
  const denied = await app.inject({ method: 'POST', url: '/api/plans', headers: { ...headers, origin: 'https://other.example' }, payload: { profileId: profile.id } });
  assert.equal(denied.statusCode, 403);
  console.log('Built-app smoke passed: bundled assets, practice data, JSON API, secure cookies, captured plan persistence, visitor isolation and origin protection.');
} finally {
  await app.close();
  await store.close();
}
