import express from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';

const app = express();
const PORT = 3000;
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON bodies
app.use(express.json());


// A POST endpoint to receive csv
app.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file);   // the uploaded file
  console.log(req.body);   // other text fields
  res.json({ file: req.file, fields: req.body });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
