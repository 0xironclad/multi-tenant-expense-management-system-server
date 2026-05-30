import 'dotenv/config';
import express from 'express';
import expenseRoutes from './routes/expense.routes';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'expense' });
});

app.use('/expenses', expenseRoutes);

const PORT = process.env.PORT ?? 3003;
app.listen(PORT, () => {
  console.log(`Expense service running on port ${PORT}`);
});
