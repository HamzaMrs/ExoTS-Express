import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    message: 'API Pokémon minimaliste',
    endpoints: {
      attacks: '/api/attacks',
      pokemons: '/api/pokemons',
      trainers: '/api/trainers',
      battles: '/api/battles',
      health: '/health'
    }
  });
});

export default router;
