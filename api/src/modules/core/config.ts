import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

// Starter kit data, unless DATA_DIR points elsewhere (e.g. the evaluators' kit).
export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? path.join(repoRoot, 'site-viewer-lite-starter/data'));

export const PORT = Number(process.env.PORT ?? 3000);
