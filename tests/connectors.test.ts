import { describe, expect, it, vi } from 'vitest';
import { ARXIV_URL, ARXIV_RSS_URL, MODEL, PREPROCESSING, RELEVANCE_QUERY, boundedText, cacheKey, configured, fetchArxiv, parseArxiv, parseArxivRss, pollInference, submitInference } from '../src/server/connectors';
import type { Inference } from '../src/shared/types';

const retrievedAt = '2026-10-21T06:00:00.000Z';
const feed = (overrides: Partial<Record<'id' | 'title' | 'summary' | 'published' | 'updated', string>> = {}) => {
  const values = { id: 'http://arxiv.org/abs/2106.08265v2', title: 'Industrial inspection &amp; quality', summary: 'A bounded abstract about visual inspection of manufactured parts.', published: '2021-06-15T16:27:02Z', updated: '2022-05-05T23:01:53Z', ...overrides };
  return `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry>${Object.entries(values).map(([key, value]) => `<${key}>${value}</${key}>`).join('')}</entry></feed>`;
};
const source = parseArxiv(feed(), retrievedAt)[0];
const config = { key: 'test-only-placeholder', endpoint: 'test-endpoint', revision: 'a'.repeat(40) };
const pending = (): Inference => ({ id: cacheKey(source, config), sourceId: source.id, model: MODEL, modelRevision: config.revision, jobId: 'job-123', status: 'pending', mode: 'live', score: null, createdAt: retrievedAt, error: null });
const output = () => ({ score: 0.72, model: MODEL, revision: config.revision, source_hash: source.hash, device: 'cuda', preprocessing: PREPROCESSING, query: RELEVANCE_QUERY });
const transport = (body: unknown) => vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }));
const rssItem = (overrides: Partial<Record<'title' | 'link' | 'description' | 'pubDate' | 'arxiv:announce_type', string>> = {}) => {
  const item = { title: 'Industrial defect inspection research', link: 'https://arxiv.org/abs/2106.08265', description: 'arXiv:2106.08265v2 Announce Type: replace Abstract: Research on industrial inspection and anomaly detection.', pubDate: 'Wed, 21 Oct 2026 00:00:00 -0400', 'arxiv:announce_type': 'replace', ...overrides };
  return `<item>${Object.entries(item).map(([key, value]) => `<${key}>${value}</${key}>`).join('')}</item>`;
};
const rssFeed = (items = rssItem()) => `<rss version="2.0" xmlns:arxiv="http://arxiv.org/schemas/atom"><channel><link>http://rss.arxiv.org/rss/cs.CV</link>${items}</channel></rss>`;

describe('arXiv metadata and bounded retrieval', () => {
  it('preserves publication/revision provenance and decodes safe XML entities', () => {
    expect(source).toMatchObject({ publishedAt: '2021-06-15', retrievedAt, datePrecision: 'day', type: 'research', live: true, title: 'Industrial inspection & quality', url: 'https://arxiv.org/abs/2106.08265v2' });
    expect(source.limitation).toContain('2022-05-05T23:01:53Z');
    expect(parseArxiv(feed(), retrievedAt)[0].hash).toBe(source.hash);
    expect(parseArxiv(feed({ updated: '2022-05-06T00:00:00Z' }), retrievedAt)[0].hash).not.toBe(source.hash);
  });
  it('keeps distinct article identities even when their abstract/title/date coincide', () => {
    expect(parseArxiv(feed({ id: 'http://arxiv.org/abs/2106.08266v2' }), retrievedAt)[0].hash).not.toBe(source.hash);
  });
  it.each([
    '<feed><entry></feed>',
    '<html><body>Not an Atom feed</body></html>',
    '<!DOCTYPE feed [<!ENTITY x SYSTEM "file:///secret">]><feed>&x;</feed>',
    feed({ title: 'Undefined &madeup; entity' }),
    feed({ title: 'Invalid &#0; character' }),
    feed({ title: 'Invalid &#xD800; surrogate' }),
    feed({ title: 'Unescaped A & B' }),
  ])('rejects malformed or unsafe XML (%#)', xml => expect(() => parseArxiv(xml, retrievedAt)).toThrow());
  it.each([
    ['published', '2026-02-30T00:00:00Z'],
    ['published', '2026-13-01T00:00:00Z'],
    ['published', '2026-01-01T24:00:00Z'],
    ['published', 'tomorrow'],
    ['published', '2026-01-01'],
    ['updated', 'invalid'],
    ['updated', '2020-01-01T00:00:00Z'],
    ['id', 'https://arxiv.org.evil.invalid/abs/2106.08265'],
    ['id', 'https://arxiv.org/abs/2199.08265'],
    ['id', 'https://arxiv.org/abs/2106.08265v0'],
    ['summary', ''],
  ])('rejects invalid %s metadata %s', (field, value) => expect(() => parseArxiv(feed({ [field]: value }), retrievedAt)).toThrow());
  it('accepts an honestly empty feed and a valid leap day', () => {
    expect(parseArxiv('<feed xmlns="http://www.w3.org/2005/Atom"></feed>', retrievedAt)).toEqual([]);
    expect(parseArxiv(feed({ published: '2024-02-29T00:00:00Z', updated: '2024-02-29T00:00:01Z' }), retrievedAt)[0].publishedAt).toBe('2024-02-29');
  });
  it('uses only the fixed query URL and bounded response body', async () => {
    const fake = vi.fn<typeof fetch>().mockResolvedValue(new Response(feed()));
    const result = await fetchArxiv(fake);
    expect(result).toHaveLength(1);
    expect(fake.mock.calls[0][0]).toBe(ARXIV_URL);
    expect(fake.mock.calls[0][1]).toMatchObject({ redirect: 'error' });
    await expect(boundedText(new Response('too large'), 3)).rejects.toThrow('size limit');
    await expect(boundedText(new Response('x', { headers: { 'content-length': '100' } }), 3)).rejects.toThrow('size limit');
    await expect(boundedText(new Response('down', { status: 503 }))).rejects.toThrow('HTTP 503');
  });
});

describe('official daily RSS fallback', () => {
  it('preserves announcement dates without relabelling them as paper publication dates', () => {
    const [result] = parseArxivRss(rssFeed(), retrievedAt);
    expect(result).toMatchObject({ publishedAt: null, datePrecision: 'unknown', retrievedAt, live: true, url: 'https://arxiv.org/abs/2106.08265v2', type: 'research' });
    expect(result.summary).toContain('2026-10-21 (replace)');
    expect(result.limitation).toContain('not a first-submission');
    expect(result.excerpt).toBe('Research on industrial inspection and anomaly detection.');
  });
  it('filters unrelated daily items and deduplicates matching entries', () => {
    const unrelated = rssItem({ title: 'A retail chatbot', description: 'arXiv:2106.08265v2 Announce Type: replace Abstract: Conversational answers about deliveries.' });
    expect(parseArxivRss(rssFeed(unrelated + rssItem() + rssItem()), retrievedAt)).toHaveLength(1);
    expect(parseArxivRss(rssFeed(''), retrievedAt)).toEqual([]);
  });
  it.each([
    { pubDate: 'Wed, 30 Feb 2026 00:00:00 -0400' },
    { pubDate: 'unknown' },
    { link: 'https://attacker.invalid/abs/2106.08265' },
    { description: 'arXiv:2106.99999v2 Announce Type: replace Abstract: Industrial inspection research.' },
    { 'arxiv:announce_type': 'unknown' },
  ])('rejects invalid RSS provenance %#', invalid => expect(() => parseArxivRss(rssFeed(rssItem(invalid)), retrievedAt)).toThrow());
  it('uses the documented RSS endpoint after an Atom failure', async () => {
    const fake = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('network timeout')).mockResolvedValueOnce(new Response(rssFeed()));
    const results = await fetchArxiv(fake);
    expect(fake.mock.calls.map(call => call[0])).toEqual([ARXIV_URL, ARXIV_RSS_URL]);
    expect(results).toHaveLength(1);
    expect(results[0].publisher).toContain('daily research announcement');
  });
  it('reports failure if both live providers fail rather than returning a sample record', async () => {
    const fake = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    await expect(fetchArxiv(fake)).rejects.toThrow('offline');
    expect(fake).toHaveBeenCalledTimes(2);
  });
});

describe('RunPod relevance provenance (mock transports only)', () => {
  it('never calls the provider when configuration is absent or unpinned', async () => {
    const fake = vi.fn<typeof fetch>();
    expect(configured({ ...config, revision: 'main' })).toBe(false);
    expect(configured({ ...config, endpoint: '../other' })).toBe(false);
    const result = await submitInference(source, {}, fake);
    expect(result).toMatchObject({ status: 'unconfigured', mode: 'none', score: null, jobId: null });
    expect(fake).not.toHaveBeenCalled();
  });
  it('submits a bounded job with the expected provenance and no automatic relevance verdict', async () => {
    const fake = transport({ id: 'job-123', status: 'IN_QUEUE' });
    const result = await submitInference(source, config, fake);
    expect(result).toMatchObject({ id: cacheKey(source, config), status: 'pending', mode: 'live', score: null, jobId: 'job-123' });
    const body = JSON.parse(fake.mock.calls[0][1]?.body as string);
    expect(body.input).toMatchObject({ source_hash: source.hash, revision: config.revision, query: RELEVANCE_QUERY, preprocessing: PREPROCESSING });
    expect(body.input.text.length).toBeLessThanOrEqual(2000);
  });
  it('accepts a matching completed GPU result', async () => {
    const result = await pollInference(pending(), source, config, transport({ id: 'job-123', status: 'COMPLETED', output: output() }));
    expect(result).toMatchObject({ status: 'completed', mode: 'live', score: 0.72 });
  });
  it.each([
    ['source_hash', 'different-source'], ['revision', 'b'.repeat(40)], ['model', 'other-model'], ['preprocessing', 'other'], ['query', 'retail chatbots'], ['device', 'cpu'], ['score', 1.01], ['score', '0.72'],
  ])('rejects completed output with mismatched %s', async (field, value) => {
    await expect(pollInference(pending(), source, config, transport({ id: 'job-123', status: 'COMPLETED', output: { ...output(), [field]: value } }))).rejects.toThrow('provenance');
  });
  it('rejects a different returned job and unknown provider statuses', async () => {
    await expect(pollInference(pending(), source, config, transport({ id: 'job-other', status: 'COMPLETED', output: output() }))).rejects.toThrow('job identifier');
    await expect(pollInference(pending(), source, config, transport({ id: 'job-123', status: 'MYSTERY' }))).rejects.toThrow('unrecognised');
  });
  it('rejects stale pending configuration before any remote request', async () => {
    const fake = vi.fn<typeof fetch>();
    await expect(pollInference(pending(), { ...source, hash: 'changed-content' }, config, fake)).rejects.toThrow('current source');
    await expect(pollInference(pending(), source, { ...config, revision: 'b'.repeat(40) }, fake)).rejects.toThrow('current source');
    expect(fake).not.toHaveBeenCalled();
  });
  it('keeps queued jobs pending and records provider failures without inventing scores', async () => {
    expect(await pollInference(pending(), source, config, transport({ id: 'job-123', status: 'IN_QUEUE' }))).toEqual(pending());
    expect(await pollInference(pending(), source, config, transport({ id: 'job-123', status: 'TIMED_OUT' }))).toMatchObject({ status: 'failed', score: null });
  });
});
