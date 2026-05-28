import 'dotenv/config';
import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'gateway' });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
