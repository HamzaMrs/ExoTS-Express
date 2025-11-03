import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM trainers ORDER BY id');
  const trainers = [] as any[];
  for (const row of rows) {
    const { rows: pokemons } = await pool.query(
      'SELECT * FROM pokemons WHERE trainer_id = $1',
      [row.id]
    );
    trainers.push({ ...row, pokemons });
  }
  res.json({ trainers });
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO trainers (name) VALUES ($1) RETURNING *',
    [name]
  );
  res.status(201).json({ trainer: rows[0] });
});

router.post('/:id/add-pokemon', async (req, res) => {
  const trainerId = Number(req.params.id);
  const pokemonId = Number(req.body.pokemonId);
  await pool.query('UPDATE pokemons SET trainer_id = $1 WHERE id = $2', [trainerId, pokemonId]);
  res.json({ message: 'Pokémon ajouté' });
});

router.post('/:id/heal', async (req, res) => {
  const trainerId = Number(req.params.id);
  await pool.query('UPDATE pokemons SET life_point = max_life_point WHERE trainer_id = $1', [trainerId]);
  await pool.query(
    `UPDATE pokemon_attacks SET usage_count = 0
     WHERE pokemon_id IN (SELECT id FROM pokemons WHERE trainer_id = $1)`,
    [trainerId]
  );
  res.json({ message: 'Tous les Pokémon soignés et attaques réinitialisées' });
});

router.post('/:id/gain-experience', async (req, res) => {
  const trainerId = Number(req.params.id);
  const amount = Number(req.body.amount || 1);
  const { rows } = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainerId]);
  let { level, experience } = rows[0];
  experience += amount;
  while (experience >= 10) {
    level++;
    experience -= 10;
  }
  await pool.query('UPDATE trainers SET level = $1, experience = $2 WHERE id = $3', [level, experience, trainerId]);
  res.json({ level, experience });
});

export default router;
