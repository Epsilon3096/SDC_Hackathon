import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const here = import.meta.dirname;
const app = resolve(here, '../..');
const rawLock = await readFile(resolve(app, 'package-lock.json'), 'utf8');
const lock = JSON.parse(rawLock);
const pkg = JSON.parse(await readFile(resolve(app, 'package.json'), 'utf8'));
const generatedDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date());
const purposes = {
  '@electric-sql/pglite': 'Local embedded PostgreSQL storage', '@fastify/cookie': 'Session-cookie handling',
  '@fastify/rate-limit': 'API request rate limits', '@fastify/static': 'Serve the built client', dotenv: 'Environment configuration',
  'fast-xml-parser': 'Validate and parse arXiv Atom/RSS', fastify: 'HTTP API framework', 'lucide-react': 'Interface icons',
  pg: 'Managed PostgreSQL driver', react: 'Interface components', 'react-dom': 'Browser interface rendering', zod: 'Input schemas and validation',
  '@types/node': 'Node type definitions', '@types/pg': 'PostgreSQL driver type definitions', '@types/react': 'React type definitions',
  '@types/react-dom': 'React DOM type definitions', '@vitejs/plugin-react': 'React build integration', concurrently: 'Local client/server development runner',
  tsx: 'Execute TypeScript in development/server scripts', typescript: 'Type checking and TypeScript language tooling',
  vite: 'Development server and production client build', vitest: 'Automated test runner',
};
const entries = Object.entries(lock.packages).filter(([path]) => path).map(([path, meta]) => ({
  path, name: path.split('node_modules/').at(-1), version: meta.version ?? 'NOT_RECORDED',
  license: typeof meta.license === 'string' ? meta.license : 'NOT_RECORDED', development: !!meta.dev, optional: !!meta.optional,
})).sort((a, b) => a.path.localeCompare(b.path));
const csv = value => '"' + String(value).replaceAll('"', '""') + '"';
await writeFile(resolve(here, 'dependency-licenses.csv'), [
  'package_path,name,resolved_version,declared_license,development,optional',
  ...entries.map(row => Object.values(row).map(csv).join(',')),
].join('\n') + '\n');
const lines = [
  '# Dependency declaration appendix', '',
  `Generated from the local package-lock.json on ${generatedDate}. These are resolved versions and package-declared licence identifiers, not version ranges or a legal opinion. Keep upstream notices; verify the distributed artefacts and any missing metadata before release.`, '',
  `Lockfile SHA-256: \`${createHash('sha256').update(rawLock).digest('hex')}\`.`,
  `Lockfile inventory: ${entries.length} package entries, including transitive and optional platform entries. Missing licence metadata: ${entries.filter(row => row.license === 'NOT_RECORDED').length}.`,
  'Full inventory: [dependency-licenses.csv](dependency-licenses.csv). Not every optional platform entry is installed or executed on this Windows host.', '',
];
for (const [group, dependencies] of [['Runtime', pkg.dependencies], ['Development and verification', pkg.devDependencies]]) {
  lines.push(`## ${group}`, '', '| Name and resolved version | Purpose | Package-declared licence |', '| --- | --- | --- |');
  for (const name of Object.keys(dependencies)) {
    const row = entries.find(item => item.path === 'node_modules/' + name);
    lines.push(`| ${name} ${row?.version ?? 'NOT_RECORDED'} | ${purposes[name] ?? 'Confirm purpose'} | ${row?.license ?? 'NOT_RECORDED'} |`);
  }
  lines.push('');
}
lines.push('## Other tools and material', '',
  `Inventory generator runtime: Node.js ${process.version}. The 23 October 2026 Replit checkpoint for commit 423bf15 passed 257 tests, with three optional PostgreSQL tests skipped, plus the production build and built-app smoke test. The Autoscale target from 71489cc was then applied. Earlier hosted verification used Node.js 22.22.0. Public production deployment was blocked by Transformers 4.57.6 and certifi dependency findings at that checkpoint; remediation and rescanning were in progress; record the final host runtime, npm and database versions when verified. See ../BUILD_STATUS.md for subsequent changes.`, '',
  'The public [Epsilon3096/SDC_Hackathon repository](https://github.com/Epsilon3096/SDC_Hackathon) was verified without owner credentials, preserving eight commits through 71489cc. All six jobs in [CI run 39939758010](https://github.com/Epsilon3096/SDC_Hackathon/actions/runs/39939758010) passed, including 11 real-PostgreSQL/configuration checks and 11 worker tests. Those checks predate the in-progress dependency and worker-contract remediation; the final revision requires renewed verification.', '',
  'Node.js, npm and PostgreSQL have their own distribution notices and bundled dependencies. The package inventory is not a complete operating-system or cloud-service software bill of materials.', '',
  'OpenAI Codex and Gemini are development services under their provider/account terms, not Apache-licensed runtime dependencies. Exact assistant model identities require participant confirmation. Gemini supplied ideas-only reviews; it did not develop the code.', '',
  'BAAI/bge-large-en-v1.5 executed on RunPod at revision d4aa6901d3a41ba39fb536a557fa166f842b0e09 on 23 October 2026. Seven GPU jobs completed under the recorded v2 preprocessing contract: one public Intel passage accepted by the app and six declared synthetic relevance cases. Both direct inspection cases ranked above both unrelated cases (4/4 pair comparisons), but the negated-keyword case scored above the real Intel passage. This bounded smoke evaluation does not establish accuracy, threshold calibration, occupational readiness or employment outcomes. See [RUNPOD_VERIFICATION.md](../RUNPOD_VERIFICATION.md) for exact provenance and limitations; no universal 0.65 cutoff is applied.', '',
  'The npm inventory excludes the Python worker dependencies listed in ../../runpod/requirements.txt and ../../runpod/Dockerfile: PyTorch, Transformers, huggingface-hub, safetensors and the RunPod SDK. Direct versions are pinned; transitive Python hashes are not frozen. Complete the final model-card/licence and distributed-container notices review. Executed model provenance does not by itself establish licensing clearance. Dependency/contract remediation is in progress; earlier GPU results do not verify the rebuilt worker.', '',
  'TalentCorp, Intel, O*NET, arXiv, Microsoft Learn, ASQ and NIST references retain their source-specific rights. Do not treat public access as a blanket right to redistribute reports, papers or courses. Application code licensing does not relicense that content.', '',
  'Regenerate with `node docs/submission/prepare-inventory.mjs` after dependency changes. This command only writes the two inventory files in this submission directory.', '');
await writeFile(resolve(here, 'DEPENDENCIES.md'), lines.join('\n'));
console.log(`Inventoried ${entries.length} lockfile package entries.`);
