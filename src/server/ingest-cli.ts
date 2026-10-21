import 'dotenv/config';
import { fetchArxiv } from './connectors';
const sources = await fetchArxiv();
console.log(JSON.stringify({ retrieved: sources.length, sources }, null, 2));
// This diagnostic command fetches and validates live metadata. Use Evidence Studio
// to persist records into a particular browser workspace and review their implications.
