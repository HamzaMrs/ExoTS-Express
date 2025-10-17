import { Request, Response } from 'express';
import { TrainerRepository } from '../repositories/TrainerRepository';
import { BattleService } from '../services/BattleService';

/**
 * Contrôleur pour gérer les combats
 */
export class BattleController {
  /**
   * Lance un défi aléatoire entre deux dresseurs
   */
  static async randomChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { trainer1Id, trainer2Id } = req.body;

      if (!trainer1Id || !trainer2Id) {
        res.status(400).json({ error: 'Les champs trainer1Id et trainer2Id sont requis' });
        return;
      }

      const trainer1 = await TrainerRepository.findById(trainer1Id);
      const trainer2 = await TrainerRepository.findById(trainer2Id);

      if (!trainer1 || !trainer2) {
        res.status(404).json({ error: 'Un ou plusieurs dresseurs introuvables' });
        return;
      }

      const result = BattleService.randomChallenge(trainer1, trainer2);

      // Sauvegarde les changements
      await TrainerRepository.update(trainer1Id, trainer1);
      await TrainerRepository.update(trainer2Id, trainer2);
      for (const pokemon of trainer1.getPokemons()) {
        await require('../repositories/PokemonRepository').PokemonRepository.update(pokemon.getId()!, pokemon);
      }
      for (const pokemon of trainer2.getPokemons()) {
        await require('../repositories/PokemonRepository').PokemonRepository.update(pokemon.getId()!, pokemon);
      }

      res.json({
        battleType: 'Défi Aléatoire',
        winner: {
          id: result.winner.getId(),
          name: result.winner.getName(),
          level: result.winner.getLevel(),
          experience: result.winner.getExperience()
        },
        loser: {
          id: result.loser.getId(),
          name: result.loser.getName(),
          level: result.loser.getLevel(),
          experience: result.loser.getExperience()
        },
        totalRounds: result.totalRounds,
        battleLog: result.battleLog
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Lance l'Arène 1 : 100 combats aléatoires
   */
  static async arena1(req: Request, res: Response): Promise<void> {
    try {
      const { trainer1Id, trainer2Id } = req.body;

      if (!trainer1Id || !trainer2Id) {
        res.status(400).json({ error: 'Les champs trainer1Id et trainer2Id sont requis' });
        return;
      }

      const trainer1 = await TrainerRepository.findById(trainer1Id);
      const trainer2 = await TrainerRepository.findById(trainer2Id);

      if (!trainer1 || !trainer2) {
        res.status(404).json({ error: 'Un ou plusieurs dresseurs introuvables' });
        return;
      }

      const result = BattleService.arena1(trainer1, trainer2);

      // Sauvegarde les changements
      await TrainerRepository.update(trainer1Id, trainer1);
      await TrainerRepository.update(trainer2Id, trainer2);

      res.json({
        battleType: 'Arène 1',
        winner: {
          id: result.winner.getId(),
          name: result.winner.getName(),
          level: result.winner.getLevel(),
          experience: result.winner.getExperience()
        },
        trainer1Wins: result.wins1,
        trainer2Wins: result.wins2,
        battleLog: result.battleLog.slice(-50) // Dernières 50 lignes pour éviter une réponse trop longue
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Lance un défi déterministe entre deux dresseurs
   */
  static async deterministicChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { trainer1Id, trainer2Id } = req.body;

      if (!trainer1Id || !trainer2Id) {
        res.status(400).json({ error: 'Les champs trainer1Id et trainer2Id sont requis' });
        return;
      }

      const trainer1 = await TrainerRepository.findById(trainer1Id);
      const trainer2 = await TrainerRepository.findById(trainer2Id);

      if (!trainer1 || !trainer2) {
        res.status(404).json({ error: 'Un ou plusieurs dresseurs introuvables' });
        return;
      }

      const result = BattleService.deterministicChallenge(trainer1, trainer2);

      // Sauvegarde les changements
      for (const pokemon of trainer1.getPokemons()) {
        await require('../repositories/PokemonRepository').PokemonRepository.update(pokemon.getId()!, pokemon);
      }
      for (const pokemon of trainer2.getPokemons()) {
        await require('../repositories/PokemonRepository').PokemonRepository.update(pokemon.getId()!, pokemon);
      }

      res.json({
        battleType: 'Défi Déterministe',
        winner: {
          id: result.winner.getId(),
          name: result.winner.getName()
        },
        loser: {
          id: result.loser.getId(),
          name: result.loser.getName()
        },
        totalRounds: result.totalRounds,
        battleLog: result.battleLog
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Lance l'Arène 2 : 100 combats déterministes
   */
  static async arena2(req: Request, res: Response): Promise<void> {
    try {
      const { trainer1Id, trainer2Id } = req.body;

      if (!trainer1Id || !trainer2Id) {
        res.status(400).json({ error: 'Les champs trainer1Id et trainer2Id sont requis' });
        return;
      }

      const trainer1 = await TrainerRepository.findById(trainer1Id);
      const trainer2 = await TrainerRepository.findById(trainer2Id);

      if (!trainer1 || !trainer2) {
        res.status(404).json({ error: 'Un ou plusieurs dresseurs introuvables' });
        return;
      }

      const result = BattleService.arena2(trainer1, trainer2);

      // Sauvegarde les changements
      for (const pokemon of trainer1.getPokemons()) {
        await require('../repositories/PokemonRepository').PokemonRepository.update(pokemon.getId()!, pokemon);
      }
      for (const pokemon of trainer2.getPokemons()) {
        await require('../repositories/PokemonRepository').PokemonRepository.update(pokemon.getId()!, pokemon);
      }

      res.json({
        battleType: 'Arène 2',
        winner: result.winner ? {
          id: result.winner.getId(),
          name: result.winner.getName()
        } : null,
        trainer1Wins: result.wins1,
        trainer2Wins: result.wins2,
        stopped: result.stopped,
        battleLog: result.battleLog.slice(-50) // Dernières 50 lignes pour éviter une réponse trop longue
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
