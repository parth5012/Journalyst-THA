import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { cleanupUploads } from '../utils/cleanupUploads.ts';

async function runCleanupTests() {
  const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'uploads-test-'));

  const staleFile = path.join(tempDir, 'stale.csv');
  const freshFile = path.join(tempDir, 'fresh.csv');

  await fs.writeFile(staleFile, 'old data');
  await fs.writeFile(freshFile, 'new data');

  const staleTime = Date.now() - 48 * 60 * 60 * 1000; // 48 hours ago
  await fs.utimes(staleFile, staleTime / 1000, staleTime / 1000);

  await cleanupUploads(24 * 60 * 60 * 1000, tempDir);

  const remaining = await fs.readdir(tempDir);
  assert.deepStrictEqual(remaining.sort(), ['fresh.csv']);

  await fs.rm(tempDir, { recursive: true, force: true });

  console.log('✅ Cleanup tests passed.');
}

runCleanupTests().catch((error) => {
  console.error(error);
  process.exit(1);
});