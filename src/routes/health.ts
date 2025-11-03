
import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'OK' });
});

router.post('/reset', async (_req, res) => {
  try {
    await pool.query('UPDATE pokemons SET life_point = max_life_point');
    res.json({ message: 'Tous les PV ont été réinitialisés.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la réinitialisation des PV.' });
  }
});

export default router;
