import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT p.*, json_agg(json_build_object('id', a.id, 'name', a.name, 'damage', a.damage)) AS attacks
    FROM pokemons p
    LEFT JOIN pokemon_attacks pa ON pa.pokemon_id = p.id
    LEFT JOIN attacks a ON a.id = pa.attack_id
    GROUP BY p.id ORDER BY p.id
  `);
  res.json({ pokemons: rows });
});

router.post('/', async (req, res) => {
  const { name, lifePoint, maxLifePoint, trainerId } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO pokemons (name, life_point, max_life_point, trainer_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, lifePoint, maxLifePoint, trainerId || null]
  );
  res.status(201).json({ pokemon: rows[0] });
});

router.post('/:id/heal', async (req, res) => {
  const id = Number(req.params.id);
  await pool.query('UPDATE pokemons SET life_point = max_life_point WHERE id = $1', [id]);
  await pool.query('UPDATE pokemon_attacks SET usage_count = 0 WHERE pokemon_id = $1', [id]);
  res.json({ message: 'Pokémon soigné' });
});

router.post('/:id/learn-attack', async (req, res) => {
  const pokemonId = Number(req.params.id);
  const attackId = Number(req.body.attackId);
  await pool.query(
    'INSERT INTO pokemon_attacks (pokemon_id, attack_id, usage_count) VALUES ($1, $2, 0)',
    [pokemonId, attackId]
  );
  res.json({ message: 'Attaque apprise' });
});

export default router;
