import { cleanupUploads } from '../utils/cleanupUploads.ts';

cleanupUploads()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Upload cleanup failed:', error);
    process.exit(1);
  });
