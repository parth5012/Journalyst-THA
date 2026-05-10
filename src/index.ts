import express from 'express';
import type { Request, Response } from 'express';

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// A simple GET endpoint
app.get('/api/hello', (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello from TypeScript API!",
    success: true
  });
});

// A POST endpoint to receive data
app.post('/api/data', (req: Request, res: Response) => {
  const data = req.body;
  res.status(201).json({
    received: data,
    status: "Data processed successfully"
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
