# Dependency declaration appendix

Generated from the local package-lock.json on 21 October 2026. These are resolved versions and package-declared licence identifiers, not version ranges or a legal opinion. Keep upstream notices; verify the distributed artefacts and any missing metadata before release.

Lockfile SHA-256: `4eeabb5ae18b490350450dedeb94dc3d35be042fd50e6e065276ca90aec80c7c`.
Lockfile inventory: 260 package entries, including transitive and optional platform entries. Missing licence metadata: 0.
Full inventory: [dependency-licenses.csv](dependency-licenses.csv). Not every optional platform entry is installed or executed on this Windows host.

## Runtime

| Name and resolved version | Purpose | Package-declared licence |
| --- | --- | --- |
| @electric-sql/pglite 0.3.16 | Local embedded PostgreSQL storage | Apache-2.0 |
| @fastify/cookie 11.1.3 | Session-cookie handling | MIT |
| @fastify/rate-limit 11.2.1 | API request rate limits | MIT |
| @fastify/static 10.1.6 | Serve the built client | MIT |
| dotenv 17.4.2 | Environment configuration | BSD-2-Clause |
| fast-xml-parser 5.11.2 | Validate and parse arXiv Atom/RSS | MIT |
| fastify 5.12.7 | HTTP API framework | MIT |
| lucide-react 0.468.0 | Interface icons | ISC |
| pg 8.23.1 | Managed PostgreSQL driver | MIT |
| react 19.3.1 | Interface components | MIT |
| react-dom 19.3.1 | Browser interface rendering | MIT |
| zod 4.6.7 | Input schemas and validation | MIT |

## Development and verification

| Name and resolved version | Purpose | Package-declared licence |
| --- | --- | --- |
| @types/node 24.19.2 | Node type definitions | MIT |
| @types/pg 8.23.1 | PostgreSQL driver type definitions | MIT |
| @types/react 19.3.0 | React type definitions | MIT |
| @types/react-dom 19.3.0 | React DOM type definitions | MIT |
| @vitejs/plugin-react 5.2.0 | React build integration | MIT |
| concurrently 9.2.5 | Local client/server development runner | MIT |
| tsx 4.23.15 | Execute TypeScript in development/server scripts | MIT |
| typescript 5.9.3 | Type checking and TypeScript language tooling | Apache-2.0 |
| vite 7.3.7 | Development server and production client build | MIT |
| vitest 5.0.5 | Automated test runner | MIT |

## Other tools and material

Inventory generator runtime: Node.js v24.14.0. Earlier hosted verification used Node.js 22.22.0. Record the final host runtime, npm and database versions when deployment is resumed.

Node.js, npm and PostgreSQL have their own distribution notices and bundled dependencies. The package inventory is not a complete operating-system or cloud-service software bill of materials.

OpenAI Codex and Gemini are development services under their provider/account terms, not Apache-licensed runtime dependencies. Exact assistant model identities require participant confirmation. The BAAI model executed at pinned revision `d4aa6901d3a41ba39fb536a557fa166f842b0e09`; see `../RUNPOD_VERIFICATION.md` for genuine jobs and limits. Complete the final model-card/licence review. The npm inventory excludes Python worker dependencies listed in `runpod/requirements.txt` and its Dockerfile.

TalentCorp, Intel, O*NET, arXiv, Microsoft Learn, ASQ and NIST references retain their source-specific rights. Do not treat public access as a blanket right to redistribute reports, papers or courses. Application code licensing does not relicense that content.

Regenerate with `node docs/submission/prepare-inventory.mjs` after dependency changes. This command only writes the two inventory files in this submission directory.
