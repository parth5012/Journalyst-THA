import fs from 'fs/promises';
import path from 'path';

export const defaultUploadDir = path.join(process.cwd(), 'uploads');
const defaultMaxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

export async function cleanupUploads(
  ageMs = Number(process.env.CLEANUP_UPLOAD_MAX_AGE_MS ?? defaultMaxAgeMs),
  uploadDir = defaultUploadDir
) {
  try {
    const entries = await fs.readdir(uploadDir);
    const now = Date.now();
    let removed = 0;

    for (const file of entries) {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) continue;

      if (now - stats.mtimeMs > ageMs) {
        await fs.unlink(filePath);
        removed += 1;
        console.log(`Removed stale upload: ${file}`);
      }
    }

    console.log(`Upload cleanup complete. Removed ${removed} old file(s).`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('Upload directory does not exist; nothing to clean.');
      return;
    }
    throw error;
  }
}
