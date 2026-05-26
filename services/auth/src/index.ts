import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.route';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth' });
});

app.use('/auth', authRoutes);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
