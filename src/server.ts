import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { identifyBroker } from './parsers/index.ts';

const app = express();
const uploadDir = path.join(process.cwd(), 'uploads');
await fs.mkdir(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

app.use(express.json());

app.post('/import', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing CSV file upload.' });
  }

  try {
    const csvText = await fs.readFile(req.file.path, 'utf8');
    const result = identifyBroker(csvText);

    if (result.errors.length && result.trades.length === 0) {
      return res.status(400).json({ message: 'No valid trades found.', result });
    }

    return res.json(result);
  } catch (error) {
    next(error);
  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => undefined);
    }
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'File upload failed.', details: err.message });
  }

  if (err instanceof Error) {
    return res.status(500).json({ error: 'Internal server error.', details: err.message });
  }

  return res.status(500).json({ error: 'Unexpected server error.' });
});

export default app;
