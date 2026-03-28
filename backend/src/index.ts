import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';

const app = express();

// Normalize FRONTEND_URL by removing trailing slash for CORS
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

app.use('/api', apiRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CounterStack API running on http://localhost:${PORT}`);
});
