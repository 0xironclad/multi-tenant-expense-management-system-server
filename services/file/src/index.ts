import 'dotenv/config';
import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'file' });
});

const PORT = process.env.PORT ?? 3005;
app.listen(PORT, () => {
  console.log(`File service running on port ${PORT}`);
});
