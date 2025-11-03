import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM attacks ORDER BY id');
  res.json({ attacks: rows });
});

router.post('/', async (req, res) => {
  const { name, damage, usageLimit } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO attacks (name, damage, usage_limit) VALUES ($1, $2, $3) RETURNING *',
    [name, damage, usageLimit]
  );
  res.status(201).json({ attack: rows[0] });
});

export default router;
