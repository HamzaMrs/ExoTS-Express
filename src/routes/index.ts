import { Router } from 'express';
import { AttackController } from '../controllers/AttackController';
import { PokemonController } from '../controllers/PokemonController';
import { TrainerController } from '../controllers/TrainerController';
import { BattleController } from '../controllers/BattleController';

const router = Router();

// Routes pour les attaques
router.post('/attacks', AttackController.create);
router.get('/attacks', AttackController.getAll);
router.get('/attacks/:id', AttackController.getById);
router.put('/attacks/:id', AttackController.update);
router.delete('/attacks/:id', AttackController.delete);

// Routes pour les Pokémon
router.post('/pokemons', PokemonController.create);
router.get('/pokemons', PokemonController.getAll);
router.get('/pokemons/:id', PokemonController.getById);
router.post('/pokemons/:id/heal', PokemonController.heal);
router.post('/pokemons/:id/learn-attack', PokemonController.learnAttack);
router.delete('/pokemons/:id', PokemonController.delete);

// Routes pour les dresseurs
router.post('/trainers', TrainerController.create);
router.get('/trainers', TrainerController.getAll);
router.get('/trainers/:id', TrainerController.getById);
router.post('/trainers/:id/add-pokemon', TrainerController.addPokemon);
router.post('/trainers/:id/heal-all', TrainerController.healAll);
router.post('/trainers/:id/gain-experience', TrainerController.gainExperience);
router.delete('/trainers/:id', TrainerController.delete);

// Routes pour les combats
router.post('/battles/random-challenge', BattleController.randomChallenge);
router.post('/battles/arena1', BattleController.arena1);
router.post('/battles/deterministic-challenge', BattleController.deterministicChallenge);
router.post('/battles/arena2', BattleController.arena2);

export default router;
