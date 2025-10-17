import { Request, Response } from 'express';
import { TrainerRepository } from '../repositories/TrainerRepository';
import { PokemonRepository } from '../repositories/PokemonRepository';
import { Trainer } from '../models/Trainer';

/**
 * Contrôleur pour gérer les Dresseurs
 */
export class TrainerController {
  /**
   * Crée un nouveau dresseur
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, level, experience } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Le champ name est requis' });
        return;
      }

      const trainer = new Trainer(name, level || 1, experience || 0);
      const createdTrainer = await TrainerRepository.create(trainer);

      res.status(201).json({
        message: 'Dresseur créé avec succès',
        trainer: this.formatTrainer(createdTrainer)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Récupère tous les dresseurs
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const trainers = await TrainerRepository.findAll();
      
      res.json({
        count: trainers.length,
        trainers: trainers.map(t => this.formatTrainer(t))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Récupère un dresseur par ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const trainer = await TrainerRepository.findById(id);

      if (!trainer) {
        res.status(404).json({ error: 'Dresseur non trouvé' });
        return;
      }

      res.json(this.formatTrainer(trainer));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Ajoute un Pokémon à un dresseur
   */
  static async addPokemon(req: Request, res: Response): Promise<void> {
    try {
      const trainerId = parseInt(req.params.id);
      const { pokemonId } = req.body;

      if (!pokemonId) {
        res.status(400).json({ error: 'Le champ pokemonId est requis' });
        return;
      }

      const trainer = await TrainerRepository.findById(trainerId);
      if (!trainer) {
        res.status(404).json({ error: 'Dresseur non trouvé' });
        return;
      }

      const pokemon = await PokemonRepository.findById(pokemonId);
      if (!pokemon) {
        res.status(404).json({ error: 'Pokémon non trouvé' });
        return;
      }

      // Associe le Pokémon au dresseur dans la BD
      await PokemonRepository.assignToTrainer(pokemonId, trainerId);
      
      // Recharge le dresseur avec ses Pokémon
      const updatedTrainer = await TrainerRepository.findById(trainerId);

      res.json({
        message: `${pokemon.getName()} a été ajouté à l'équipe de ${trainer.getName()}`,
        trainer: this.formatTrainer(updatedTrainer!)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Soigne tous les Pokémon d'un dresseur à la taverne
   */
  static async healAll(req: Request, res: Response): Promise<void> {
    try {
      const trainerId = parseInt(req.params.id);
      const trainer = await TrainerRepository.findById(trainerId);

      if (!trainer) {
        res.status(404).json({ error: 'Dresseur non trouvé' });
        return;
      }

      trainer.healAllAtTavern();

      // Met à jour tous les Pokémon en base
      for (const pokemon of trainer.getPokemons()) {
        await PokemonRepository.update(pokemon.getId()!, pokemon);
      }

      res.json({
        message: `Tous les Pokémon de ${trainer.getName()} ont été soignés à la taverne`,
        trainer: this.formatTrainer(trainer)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Fait gagner de l'expérience à un dresseur
   */
  static async gainExperience(req: Request, res: Response): Promise<void> {
    try {
      const trainerId = parseInt(req.params.id);
      const { experience } = req.body;

      if (experience === undefined || experience <= 0) {
        res.status(400).json({ error: 'Le champ experience doit être un nombre positif' });
        return;
      }

      const trainer = await TrainerRepository.findById(trainerId);
      if (!trainer) {
        res.status(404).json({ error: 'Dresseur non trouvé' });
        return;
      }

      const oldLevel = trainer.getLevel();
      trainer.gainExperience(experience);
      const newLevel = trainer.getLevel();

      await TrainerRepository.update(trainerId, trainer);

      const message = newLevel > oldLevel
        ? `${trainer.getName()} monte au niveau ${newLevel} !`
        : `${trainer.getName()} gagne ${experience} XP`;

      res.json({
        message,
        trainer: this.formatTrainer(trainer),
        leveledUp: newLevel > oldLevel
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Supprime un dresseur
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = await TrainerRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Dresseur non trouvé' });
        return;
      }

      res.json({ message: 'Dresseur supprimé avec succès' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Formate un dresseur pour la réponse JSON
   */
  private static formatTrainer(trainer: Trainer) {
    return {
      id: trainer.getId(),
      name: trainer.getName(),
      level: trainer.getLevel(),
      experience: trainer.getExperience(),
      pokemonCount: trainer.getPokemons().length,
      alivePokemonCount: trainer.getAlivePokemonCount(),
      hasLost: trainer.hasLost(),
      pokemons: trainer.getPokemons().map(pokemon => ({
        id: pokemon.getId(),
        name: pokemon.getName(),
        lifePoint: pokemon.getLifePoint(),
        maxLifePoint: pokemon.getMaxLifePoint(),
        isKO: pokemon.isKO(),
        attackCount: pokemon.getAttacks().length
      }))
    };
  }
}
