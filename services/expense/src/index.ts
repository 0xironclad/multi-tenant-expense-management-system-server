import 'dotenv/config';
import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'expense' });
});

const PORT = process.env.PORT ?? 3003;
app.listen(PORT, () => {
  console.log(`Expense service running on port ${PORT}`);
});
