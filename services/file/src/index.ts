import './tracing';
import 'dotenv/config';
import express from 'express';
import fileRoutes from './routes/file.routes';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'file' });
});

app.use('/files', fileRoutes);

const PORT = process.env.PORT ?? 3005;
app.listen(PORT, () => {
  console.log(`File service running on port ${PORT}`);
});
