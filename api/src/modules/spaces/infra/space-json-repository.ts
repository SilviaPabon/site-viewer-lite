import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Space, SpaceRepository } from '../domain/space.js';

// Projection: same idea as projects, only named fields leave the file.
const toSpace = (s: Space): Space => ({
  id: s.id, name: s.name, level: s.level, use: s.use, x: s.x, y: s.y, z: s.z, w: s.w, d: s.d, h: s.h,
});

export function createSpaceJsonRepository(dataDir: string): SpaceRepository {
  return {
    // Only ever called with the id of a project that exists (it comes from the project repository),
    // never with raw user input, so it can't be used to read arbitrary files.
    async findByProjectId(projectId) {
      try {
        const raw: Space[] = JSON.parse(await readFile(path.join(dataDir, 'spaces', `${projectId}.json`), 'utf8'));
        return raw.map(toSpace);
      } catch (err) {
        // A project without a spaces file simply has no rooms yet.
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
        throw err;
      }
    },
  };
}
