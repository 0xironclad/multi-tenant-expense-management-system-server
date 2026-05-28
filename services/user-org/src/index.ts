import 'dotenv/config';
import express from 'express';
import userRoutes from './routes/user.routes';
import orgRoutes from './routes/org.routes';
import internalRoutes from './routes/internal.routes';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-org' });
});

app.use('/users', userRoutes);
app.use('/organisations', orgRoutes);
app.use('/internal', internalRoutes);

const PORT = process.env.PORT ?? 3002;
app.listen(PORT, () => {
  console.log(`User-Org service running on port ${PORT}`);
});
