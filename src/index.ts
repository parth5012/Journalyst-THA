import app from './server.ts';
import { cleanupUploads } from './utils/cleanupUploads.ts';

const PORT = 3000;

cleanupUploads().catch((error) => {
  console.warn('Upload cleanup failed on startup:', error instanceof Error ? error.message : error);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
