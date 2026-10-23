import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { randomUUID } from 'node:crypto';
import type { Source, Inference, RunpodContext } from '../shared/types';
import { hash } from './store';
import relevanceContract from '../../runpod/contract.json';

export const MODEL = relevanceContract.model;
export const RELEVANCE_QUERY = relevanceContract.query;
export const PREPROCESSING = relevanceContract.preprocessing;
export const MIN_INFERENCE_TEXT_LENGTH = relevanceContract.minCharacters;
export const ARXIV_URL = 'https://export.arxiv.org/api/query?search_query=' + encodeURIComponent('cat:cs.CV AND (all:"industrial inspection" OR all:"visual anomaly detection")') + '&sortBy=submittedDate&sortOrder=descending&start=0&max_results=6';
export const ARXIV_RSS_URL = 'https://rss.arxiv.org/rss/cs.CV';

export async function boundedText(response: Response, maxBytes = 350000) {
  const rejection = !response.ok ? 'Source returned HTTP ' + response.status : Number(response.headers.get('content-length')) > maxBytes ? 'Source exceeded the size limit' : null;
  if (rejection) { await response.body?.cancel().catch(() => undefined); throw new Error(rejection); }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Source response was empty');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > maxBytes) throw new Error('Source exceeded the size limit'); chunks.push(value); }
  } finally { await reader.cancel().catch(() => undefined); }
  return Buffer.concat(chunks).toString('utf8');
}
const clean = (value: unknown, max = 6000) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
function sourceText(value: unknown, label: string, max = 6000) {
  if (typeof value === 'string') return clean(value, max);
  // Atom text constructs may carry attributes. Child elements and repeated fields
  // are not scalar source text and must never turn into "[object Object]" evidence.
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record['#text'] === 'string' && Object.keys(record).every(key => key === '#text' || key.startsWith('@_'))) return clean(record['#text'], max);
  }
  throw new Error('Source ' + label + ' must be one text value');
}
function atomDate(value: unknown, label: string) {
  const text = sourceText(value, label, 40);
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
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: true, parseTagValue: false }).parse(xml);
  if (!parsed.feed) throw new Error('Source did not return an Atom feed');
  const entries = parsed.feed.entry ? (Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry]) : [];
  return entries.slice(0, 6).map((entry: any) => {
    const rawId = sourceText(entry.id, 'article identifier', 300);
    const match = rawId.match(/^https?:\/\/arxiv\.org\/abs\/([\w.\/-]+)$/);
    if (!match || !/^\d{2}(?:0[1-9]|1[0-2])\.\d{4,5}(v[1-9]\d*)?$/.test(match[1])) throw new Error('Source contained an invalid article identifier');
    const publishedAt = atomDate(entry.published, 'first-submission');
    const excerpt = sourceText(entry.summary, 'abstract', 5000); const title = sourceText(entry.title, 'title', 500);
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
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: true, parseTagValue: false }).parse(xml);
  const channel = parsed.rss?.channel;
  if (!channel || !['http://rss.arxiv.org/rss/cs.CV', ARXIV_RSS_URL].includes(sourceText(channel.link, 'channel link'))) throw new Error('Source did not return the expected arXiv category feed');
  const items = channel.item ? (Array.isArray(channel.item) ? channel.item : [channel.item]) : [];
  if (items.length > 2000) throw new Error('Source feed exceeded the article limit');
  const candidates = items.filter((item: any) => {
    const text = sourceText(item.title, 'title') + ' ' + sourceText(item.description, 'description');
    return /industrial|manufactur|quality.control|inline.inspection|optical.inspection/i.test(text) && /inspection|defect|anomal/i.test(text);
  }).slice(0, 6);
  const seen = new Set<string>();
  return candidates.flatMap((item: any) => {
    const link = sourceText(item.link, 'article link', 300);
    const linkParts = link.match(/^https?:\/\/arxiv\.org\/abs\/(\d{2}(?:0[1-9]|1[0-2])\.\d{4,5})(v[1-9]\d*)?$/);
    const id = linkParts?.[1];
    if (!id) throw new Error('Source contained an invalid article identifier');
    const description = sourceText(item.description, 'description', 6000);
    const descriptionParts = description.match(/^arXiv:(\d{4}\.\d{4,5}v[1-9]\d*)\s+Announce Type:\s*([\w-]+)\s+Abstract:\s*(.*)$/i);
    const version = descriptionParts?.[1];
    if (!version || !version.startsWith(id + 'v') || linkParts?.[2] && version !== id + linkParts[2]) throw new Error('Source article version is missing or inconsistent');
    const title = sourceText(item.title, 'title', 500);
    const excerpt = clean(descriptionParts![3], 5000);
    const announcement = sourceText(item.pubDate, 'announcement date', 60);
    const stamp = announcement.match(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{2}):(\d{2}):(\d{2}) (?:[+-]\d{4}|GMT|UT|UTC)$/);
    const timestamp = Date.parse(announcement);
    if (!title || !excerpt || !stamp || !Number.isFinite(timestamp)) throw new Error('Source announcement metadata is incomplete');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(stamp[2]);
    const calendar = new Date(Date.UTC(Number(stamp[3]), month, Number(stamp[1])));
    if (calendar.getUTCMonth() !== month || calendar.getUTCDate() !== Number(stamp[1]) || Number(stamp[4]) > 23 || Number(stamp[5]) > 59 || Number(stamp[6]) > 59) throw new Error('Source announcement date is impossible');
    const announcedAt = new Date(timestamp).toISOString();
    const announceType = sourceText(item['arxiv:announce_type'], 'announce type', 50);
    if (!['new', 'cross', 'replace', 'replace-cross'].includes(announceType) || announceType !== descriptionParts![2]) throw new Error('Source announce type is invalid or inconsistent');
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
export function configured(config: RunpodConfig) { return !!(config.key?.trim() && config.endpoint && /^[a-zA-Z0-9-]{1,100}$/.test(config.endpoint) && config.revision && /^[0-9a-f]{40}$/.test(config.revision)); }
// Use Unicode code points, matching Python's bound and preserving surrogate pairs.
export function inferenceText(source: Source) { return Array.from(source.excerpt).slice(0, relevanceContract.maxCharacters).join(''); }
export function cacheKey(source: Source, config: RunpodConfig) { return hash(JSON.stringify([source.hash, hash(inferenceText(source)), MODEL, config.revision, RELEVANCE_QUERY, PREPROCESSING])); }
export function runpodContext(config: RunpodConfig): RunpodContext { return { model: MODEL, modelRevision: config.revision || null, preprocessing: PREPROCESSING, query: RELEVANCE_QUERY }; }
export function inferenceProvenance(source: Source, config: RunpodConfig) { return { ...runpodContext(config), textHash: hash(inferenceText(source)), sourceHash: source.hash }; }
/** Legacy fields may be absent, but the full cache key still binds the original context. */
export function matchesInferenceContext(inference: Inference, source: Source, config: RunpodConfig) {
  const expected = inferenceProvenance(source, config);
  return inference.id === cacheKey(source, config) && inference.sourceId === source.id && inference.model === expected.model && inference.modelRevision === expected.modelRevision
    && (['preprocessing', 'query', 'textHash', 'sourceHash'] as const).every(key => inference[key] === undefined || inference[key] === expected[key]);
}
export async function submitInference(source: Source, config: RunpodConfig, fetcher: typeof fetch = fetch): Promise<Inference> {
  if (!configured(config)) return { id: randomUUID(), sourceId: source.id, status: 'unconfigured', mode: 'none', score: null, ...inferenceProvenance(source, config), jobId: null, createdAt: new Date().toISOString(), error: 'Configure RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID and a pinned RUNPOD_MODEL_REVISION before running inference.' };
  const text = inferenceText(source);
  if (text.trim().length < MIN_INFERENCE_TEXT_LENGTH || !/^[0-9a-f]{64}$/.test(source.hash) || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(text)) throw new Error('Public source text or provenance is incomplete');
  const response = await fetcher('https://api.runpod.ai/v2/' + config.endpoint + '/run', { method: 'POST', redirect: 'error', headers: { Authorization: 'Bearer ' + config.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ input: { source_hash: source.hash, text_hash: hash(text), text, query: RELEVANCE_QUERY, model: MODEL, revision: config.revision, preprocessing: PREPROCESSING }, policy: { executionTimeout: 120000, ttl: 600000 } }), signal: AbortSignal.timeout(20000) });
  const body = JSON.parse(await boundedText(response, 50000));
  if (!body || typeof body.id !== 'string' || !/^[\w-]{1,200}$/.test(body.id)) throw new Error('RunPod returned no valid job identifier');
  if (!['IN_QUEUE', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMED_OUT'].includes(body.status)) throw new Error('RunPod returned an unrecognised submission status');
  // Even an immediate result is fetched through /status and fully validated there.
  return { id: cacheKey(source, config), sourceId: source.id, status: 'pending', mode: 'live', score: null, ...inferenceProvenance(source, config), endpointId: config.endpoint, jobId: body.id, createdAt: new Date().toISOString(), error: null };
}
export async function pollInference(inference: Inference, source: Source, config: RunpodConfig, fetcher: typeof fetch = fetch): Promise<Inference> {
  if (!inference.jobId || !/^[\w-]{1,200}$/.test(inference.jobId) || !configured(config)) throw new Error('Inference is not configured');
  if (inference.endpointId && inference.endpointId !== config.endpoint) throw new Error('Pending inference belongs to a different RunPod endpoint');
  if (inference.status !== 'pending' || inference.mode !== 'live' || !matchesInferenceContext(inference, source, config)) throw new Error('Pending inference does not match the current source and model configuration');
  const response = await fetcher('https://api.runpod.ai/v2/' + config.endpoint + '/status/' + inference.jobId, { redirect: 'error', headers: { Authorization: 'Bearer ' + config.key }, signal: AbortSignal.timeout(15000) });
  const body = JSON.parse(await boundedText(response, 50000));
  if (!body || body.id !== inference.jobId) throw new Error('RunPod returned a different job identifier');
  if (body.status === 'COMPLETED') {
    const output = body.output;
    if (!output || typeof output.score !== 'number' || !Number.isFinite(output.score) || output.score < -1 || output.score > 1 || output.model !== MODEL || output.revision !== config.revision || output.source_hash !== source.hash || output.text_hash !== hash(inferenceText(source)) || output.device !== 'cuda' || output.preprocessing !== PREPROCESSING || output.query !== RELEVANCE_QUERY) throw new Error('RunPod output failed provenance or GPU validation');
    return { ...inference, ...inferenceProvenance(source, config), status: 'completed', score: output.score, error: null };
  }
  if (['FAILED', 'CANCELLED', 'TIMED_OUT'].includes(body.status)) return { ...inference, status: 'failed', error: 'Provider job ended: ' + body.status };
  if (!['IN_QUEUE', 'IN_PROGRESS'].includes(body.status)) throw new Error('RunPod returned an unrecognised job status');
  return inference;
}
