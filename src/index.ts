import express from 'express';
import cors from 'cors';
import path from 'path';
import pool from './db';

import attacksRouter from './routes/attacks';
import pokemonsRouter from './routes/pokemons';
import trainersRouter from './routes/trainers';
import battlesRouter from './routes/battles';
import healthRouter from './routes/health';
import rootRouter from './routes/root';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.resolve(process.cwd())));

app.use('/api/attacks', attacksRouter);
app.use('/api/pokemons', pokemonsRouter);
app.use('/api/trainers', trainersRouter);
app.use('/api/battles', battlesRouter);
app.use('/api/health', healthRouter);
app.use('/', rootRouter);

app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log(`✅ Serveur sur http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Erreur DB', error);
  }
});

export default app;
