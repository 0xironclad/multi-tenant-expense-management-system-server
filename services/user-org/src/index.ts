import 'dotenv/config';
import express from 'express';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-org' });
});


const PORT = process.env.PORT ?? 3002;
app.listen(PORT, () => {
  console.log(`User-Org service running on port ${PORT}`);
});
