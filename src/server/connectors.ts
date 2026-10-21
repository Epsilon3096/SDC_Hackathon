import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { randomUUID } from 'node:crypto';
import type { Source, Inference } from '../shared/types';
import { hash } from './store';

export const MODEL = 'BAAI/bge-large-en-v1.5';
export const RELEVANCE_QUERY = 'Industrial manufacturing quality inspection: visual defect detection, automated optical inspection, inspection records, measurement and root cause analysis.';
export const PREPROCESSING = 'bounded-abstract-2000-v1';
export const ARXIV_URL = 'https://export.arxiv.org/api/query?search_query=' + encodeURIComponent('cat:cs.CV AND (all:"industrial inspection" OR all:"visual anomaly detection")') + '&sortBy=submittedDate&sortOrder=descending&start=0&max_results=6';
export const ARXIV_RSS_URL = 'https://rss.arxiv.org/rss/cs.CV';

export async function boundedText(response: Response, maxBytes = 350000) {
  if (!response.ok) throw new Error('Source returned HTTP ' + response.status);
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('Source exceeded the size limit');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Source response was empty');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > maxBytes) throw new Error('Source exceeded the size limit'); chunks.push(value); }
  } finally { await reader.cancel().catch(() => undefined); }
  return Buffer.concat(chunks).toString('utf8');
}
const clean = (value: unknown, max = 6000) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
function atomDate(value: unknown, label: string) {
  const text = clean(value, 40);
  const parts = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
  if (!parts || !Number.isFinite(Date.parse(text))) throw new Error('Source article lacks a valid ' + label + ' date');
  const [, year, month, day, hour, minute, second] = parts.map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) throw new Error('Source article has an impossible ' + label + ' date');
  return text;
}
function validateEntities(xml: string) {
  const outsideLiteralText = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->/g, '');
  const remainder = outsideLiteralText.replace(/&(?:amp|lt|gt|apos|quot);|&#(?:x[\da-fA-F]+|\d+);/g, entity => {
    if (!entity.startsWith('&#')) return '';
    const point = entity.startsWith('&#x') ? Number.parseInt(entity.slice(3, -1), 16) : Number.parseInt(entity.slice(2, -1), 10);
    if (![9, 10, 13].includes(point) && !(point >= 32 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) && point !== 0xfffe && point !== 0xffff)) throw new Error('Source contains an invalid XML character entity');
    return '';
  });
  if (remainder.includes('&')) throw new Error('Source contains an unknown or malformed XML entity');
}
export function parseArxiv(xml: string, retrievedAt = new Date().toISOString()): Source[] {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Unsafe XML declarations are not accepted');
  if (XMLValidator.validate(xml) !== true) throw new Error('Source XML is invalid');
  validateEntities(xml);
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: true }).parse(xml);
  if (!parsed.feed) throw new Error('Source did not return an Atom feed');
  const entries = parsed.feed.entry ? (Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry]) : [];
  return entries.slice(0, 6).map((entry: any) => {
    const rawId = clean(entry.id, 300);
    const match = rawId.match(/^https?:\/\/arxiv\.org\/abs\/([\w.\/-]+)$/);
    if (!match || !/^\d{2}(?:0[1-9]|1[0-2])\.\d{4,5}(v[1-9]\d*)?$/.test(match[1])) throw new Error('Source contained an invalid article identifier');
    const publishedAt = atomDate(entry.published, 'first-submission');
    const excerpt = clean(entry.summary, 5000); const title = clean(entry.title, 500);
    if (!excerpt || !title) throw new Error('Source article metadata is incomplete');
    const updated = entry.updated ? atomDate(entry.updated, 'revision') : '';
    if (updated && Date.parse(updated) < Date.parse(publishedAt)) throw new Error('Source revision precedes its first submission');
    const contentHash = hash(JSON.stringify([match[1], title, excerpt, publishedAt, updated]));
    return { id: 'arxiv-' + match[1] + '-' + contentHash.slice(0, 8), title, publisher: 'arXiv · research preprint', url: 'https://arxiv.org/abs/' + match[1], type: 'research', publishedAt: publishedAt.slice(0, 10), datePrecision: 'day', retrievedAt, excerpt, summary: 'Fetched abstract. Inspect the original paper before interpreting it.', limitation: 'Research is not proof of deployment, Malaysian demand, or a qualification requirement. Revision date: ' + (updated || 'not supplied') + '.', hash: contentHash, live: true } satisfies Source;
  });
}
/** Official daily RSS fallback. Its dates are announcements, never first submissions. */
export function parseArxivRss(xml: string, retrievedAt = new Date().toISOString()): Source[] {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Unsafe XML declarations are not accepted');
  if (XMLValidator.validate(xml) !== true) throw new Error('Source XML is invalid');
  validateEntities(xml);
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: true }).parse(xml);
  const channel = parsed.rss?.channel;
  if (!channel || clean(channel.link) !== 'http://rss.arxiv.org/rss/cs.CV' && clean(channel.link) !== ARXIV_RSS_URL) throw new Error('Source did not return the expected arXiv category feed');
  const items = channel.item ? (Array.isArray(channel.item) ? channel.item : [channel.item]) : [];
  if (items.length > 2000) throw new Error('Source feed exceeded the article limit');
  const candidates = items.filter((item: any) => {
    const text = clean(item.title) + ' ' + clean(item.description);
    return /industrial|manufactur|quality.control|inline.inspection|optical.inspection/i.test(text) && /inspection|defect|anomal/i.test(text);
  }).slice(0, 6);
  const seen = new Set<string>();
  return candidates.flatMap((item: any) => {
    const link = clean(item.link, 300);
    const id = link.match(/^https?:\/\/arxiv\.org\/abs\/(\d{2}(?:0[1-9]|1[0-2])\.\d{4,5})(?:v[1-9]\d*)?$/)?.[1];
    if (!id) throw new Error('Source contained an invalid article identifier');
    const description = clean(item.description, 6000);
    const version = description.match(/^arXiv:(\d{4}\.\d{4,5}v[1-9]\d*)\b/)?.[1];
    if (!version || !version.startsWith(id + 'v')) throw new Error('Source article version is missing or inconsistent');
    const title = clean(item.title, 500);
    const excerpt = clean(description.replace(/^arXiv:[\d.v]+\s+Announce Type:\s*[\w-]+\s+Abstract:\s*/i, ''), 5000);
    const announcement = clean(item.pubDate, 60);
    const stamp = announcement.match(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{2}):(\d{2}):(\d{2}) (?:[+-]\d{4}|GMT|UT|UTC)$/);
    const timestamp = Date.parse(announcement);
    if (!title || !excerpt || !stamp || !Number.isFinite(timestamp)) throw new Error('Source announcement metadata is incomplete');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(stamp[2]);
    const calendar = new Date(Date.UTC(Number(stamp[3]), month, Number(stamp[1])));
    if (calendar.getUTCMonth() !== month || calendar.getUTCDate() !== Number(stamp[1]) || Number(stamp[4]) > 23 || Number(stamp[5]) > 59 || Number(stamp[6]) > 59) throw new Error('Source announcement date is impossible');
    const announcedAt = new Date(timestamp).toISOString();
    const announceType = clean(item['arxiv:announce_type'], 50);
    if (!['new', 'cross', 'replace', 'replace-cross'].includes(announceType)) throw new Error('Source announce type is invalid');
    const contentHash = hash(JSON.stringify([version, title, excerpt, announcedAt, announceType]));
    if (seen.has(contentHash)) return [];
    seen.add(contentHash);
    return [{ id: 'arxiv-' + version + '-' + contentHash.slice(0, 8), title, publisher: 'arXiv · daily research announcement', url: 'https://arxiv.org/abs/' + version, type: 'research', publishedAt: null, datePrecision: 'unknown', retrievedAt, excerpt,
      summary: 'Live RSS announcement: ' + announcedAt.slice(0, 10) + ' (' + announceType + '). Candidate selected by keywords; inspect relevance and the original paper before interpretation.',
      limitation: 'Official daily RSS fallback. Announcement time: ' + announcedAt + '. This is not a first-submission or deployment date; those dates are unverified here. Research does not establish Malaysian demand or an occupational requirement.',
      hash: contentHash, live: true } satisfies Source];
  });
}
export async function fetchArxiv(fetcher: typeof fetch = fetch) {
  const headers = { 'User-Agent': 'ShiftBridge/0.1 (educational inspection research catalogue)' };
  try {
    const response = await fetcher(ARXIV_URL, { signal: AbortSignal.timeout(18000), headers: { ...headers, Accept: 'application/atom+xml' }, redirect: 'error' });
    return parseArxiv(await boundedText(response));
  } catch {
    const response = await fetcher(ARXIV_RSS_URL, { signal: AbortSignal.timeout(15000), headers: { ...headers, Accept: 'application/rss+xml' }, redirect: 'error' });
    return parseArxivRss(await boundedText(response, 1500000));
  }
}
/** Transport metadata can differ while the same versioned paper content is unchanged. */
export function mergeSourceBatch(existing: Source[], incoming: Source[]) {
  const version = (source: Source) => source.type === 'research' ? source.url.match(/^https:\/\/arxiv\.org\/abs\/(\d{2}(?:0[1-9]|1[0-2])\.\d{4,5}v[1-9]\d*)$/)?.[1] : undefined;
  const sameContent = (left: Source, right: Source) => left.hash === right.hash || !!version(left)
    && version(left) === version(right) && clean(left.title, 500) === clean(right.title, 500) && clean(left.excerpt, 5000) === clean(right.excerpt, 5000);
  let created = 0; let enriched = 0;
  for (const source of incoming) {
    const known = existing.find(old => sameContent(old, source));
    if (!known) { existing.push(source); created++; continue; }
    if (!known.publishedAt && source.publishedAt) {
      // Preserve the original record identity and text hash: mappings and inference
      // provenance continue to refer to the same version and exact passage.
      known.publishedAt = source.publishedAt;
      known.datePrecision = source.datePrecision;
      known.dateKind = source.dateKind;
      known.limitation = source.limitation + ' First-submission date verified from the official arXiv Atom API at ' + source.retrievedAt + '. Earlier collection: ' + known.summary;
      enriched++;
    }
  }
  return { created, enriched };
}
export interface RunpodConfig { key?: string; endpoint?: string; revision?: string; }
export function configured(config: RunpodConfig) { return !!(config.key && config.endpoint && /^[a-zA-Z0-9-]+$/.test(config.endpoint) && config.revision && /^[0-9a-f]{40}$/i.test(config.revision)); }
export function cacheKey(source: Source, config: RunpodConfig) { return hash(source.hash + MODEL + config.revision + RELEVANCE_QUERY + PREPROCESSING); }
export async function submitInference(source: Source, config: RunpodConfig, fetcher: typeof fetch = fetch): Promise<Inference> {
  if (!configured(config)) return { id: randomUUID(), sourceId: source.id, status: 'unconfigured', mode: 'none', score: null, model: MODEL, modelRevision: config.revision || null, jobId: null, createdAt: new Date().toISOString(), error: 'Configure RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID and a pinned RUNPOD_MODEL_REVISION before running inference.' };
  const response = await fetcher('https://api.runpod.ai/v2/' + config.endpoint + '/run', { method: 'POST', headers: { Authorization: 'Bearer ' + config.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ input: { source_hash: source.hash, text: source.excerpt.slice(0, 2000), query: RELEVANCE_QUERY, model: MODEL, revision: config.revision, preprocessing: PREPROCESSING }, policy: { executionTimeout: 120000, ttl: 600000 } }), signal: AbortSignal.timeout(20000) });
  const body = JSON.parse(await boundedText(response, 50000));
  if (typeof body.id !== 'string' || !/^[\w-]+$/.test(body.id)) throw new Error('RunPod returned no valid job identifier');
  return { id: cacheKey(source, config), sourceId: source.id, status: 'pending', mode: 'live', score: null, model: MODEL, modelRevision: config.revision!, jobId: body.id, createdAt: new Date().toISOString(), error: null };
}
export async function pollInference(inference: Inference, source: Source, config: RunpodConfig, fetcher: typeof fetch = fetch): Promise<Inference> {
  if (!inference.jobId || !configured(config)) throw new Error('Inference is not configured');
  if (inference.status !== 'pending' || inference.mode !== 'live' || inference.id !== cacheKey(source, config) || inference.sourceId !== source.id || inference.model !== MODEL || inference.modelRevision !== config.revision) throw new Error('Pending inference does not match the current source and model configuration');
  const response = await fetcher('https://api.runpod.ai/v2/' + config.endpoint + '/status/' + inference.jobId, { headers: { Authorization: 'Bearer ' + config.key }, signal: AbortSignal.timeout(15000) });
  const body = JSON.parse(await boundedText(response, 50000));
  if (body.id !== inference.jobId) throw new Error('RunPod returned a different job identifier');
  if (body.status === 'COMPLETED') {
    const output = body.output;
    if (!output || typeof output.score !== 'number' || !Number.isFinite(output.score) || output.score < -1 || output.score > 1 || output.model !== MODEL || output.revision !== config.revision || output.source_hash !== source.hash || output.device !== 'cuda' || output.preprocessing !== PREPROCESSING || output.query !== RELEVANCE_QUERY) throw new Error('RunPod output failed provenance or GPU validation');
    return { ...inference, status: 'completed', score: output.score, error: null };
  }
  if (['FAILED', 'CANCELLED', 'TIMED_OUT'].includes(body.status)) return { ...inference, status: 'failed', error: 'Provider job ended: ' + body.status };
  if (!['IN_QUEUE', 'IN_PROGRESS'].includes(body.status)) throw new Error('RunPod returned an unrecognised job status');
  return inference;
}
