import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/static', express.static(path.resolve(process.cwd(), 'static')));
app.use(express.static(path.resolve(process.cwd(), 'dist')));
app.use('/api', apiRouter);

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FitBuddy server listening on port ${PORT}`);
});
