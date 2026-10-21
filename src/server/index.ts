import 'dotenv/config';
import { resolve } from 'node:path';
import { Store } from './store';
import { buildApp } from './app';

// Replit's editor preview also terminates HTTPS at its proxy, even when NODE_ENV is development.
const production = process.env.NODE_ENV === 'production' || !!process.env.REPLIT_DEPLOYMENT || !!process.env.REPL_ID;
const hosted = production || !!process.env.REPL_ID;
if (hosted && !process.env.DATABASE_URL) throw new Error('Hosted deployment requires DATABASE_URL. Embedded storage is for local development only.');
const host = process.env.HOST || (hosted ? '0.0.0.0' : '127.0.0.1');
const store = await Store.open(process.env.DATABASE_URL, resolve(process.env.DATA_DIR || '.data/postgres'));
const localReviewer = !hosted && ['127.0.0.1', 'localhost', '::1'].includes(host) && process.env.LOCAL_REVIEWER !== 'false';
const app = await buildApp({ store, production, localReviewer, demoReview: process.env.DEMO_REVIEW === 'true', adminToken: process.env.ADMIN_TOKEN, publicOrigin: process.env.PUBLIC_ORIGIN, runpod: { key: process.env.RUNPOD_API_KEY, endpoint: process.env.RUNPOD_ENDPOINT_ID, revision: process.env.RUNPOD_MODEL_REVISION } });
const address = await app.listen({ port: Number(process.env.PORT || 3001), host });
console.log('ShiftBridge API: ' + address + ' · ' + store.kind + ' · reviewer ' + (localReviewer ? 'local-only' : 'token protected'));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, async () => { await app.close(); await store.close(); process.exit(0); });
