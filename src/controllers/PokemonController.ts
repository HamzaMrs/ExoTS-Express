import { Request, Response } from 'express';
import { PokemonRepository } from '../repositories/PokemonRepository';
import { AttackRepository } from '../repositories/AttackRepository';
import { Pokemon } from '../models/Pokemon';

/**
 * Contrôleur pour gérer les Pokémon
 */
export class PokemonController {
  /**
   * Crée un nouveau Pokémon
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, lifePoint, trainerId, attackIds } = req.body;

      if (!name || !lifePoint) {
        res.status(400).json({ error: 'Les champs name et lifePoint sont requis' });
        return;
      }

      const pokemon = new Pokemon(name, lifePoint);

      // Ajout des attaques si fournies
      if (attackIds && Array.isArray(attackIds)) {
        for (const attackId of attackIds) {
          const attack = await AttackRepository.findById(attackId);
          if (attack) {
            try {
              pokemon.learnAttack(attack);
            } catch (error: any) {
              res.status(400).json({ error: error.message });
              return;
            }
          }
        }
      }

      const createdPokemon = await PokemonRepository.create(pokemon, trainerId);

      res.status(201).json({
        message: 'Pokémon créé avec succès',
        pokemon: this.formatPokemon(createdPokemon)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Récupère tous les Pokémon
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const pokemons = await PokemonRepository.findAll();
      
      res.json({
        count: pokemons.length,
        pokemons: pokemons.map(p => this.formatPokemon(p))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Récupère un Pokémon par ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const pokemon = await PokemonRepository.findById(id);

      if (!pokemon) {
        res.status(404).json({ error: 'Pokémon non trouvé' });
        return;
      }

      res.json(this.formatPokemon(pokemon));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Soigne un Pokémon
   */
  static async heal(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const pokemon = await PokemonRepository.findById(id);

      if (!pokemon) {
        res.status(404).json({ error: 'Pokémon non trouvé' });
        return;
      }

      pokemon.heal();
      await PokemonRepository.update(id, pokemon);

      res.json({
        message: `${pokemon.getName()} a été soigné`,
        pokemon: this.formatPokemon(pokemon)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Fait apprendre une attaque à un Pokémon
   */
  static async learnAttack(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { attackId } = req.body;

      if (!attackId) {
        res.status(400).json({ error: 'Le champ attackId est requis' });
        return;
      }

      const pokemon = await PokemonRepository.findById(id);
      if (!pokemon) {
        res.status(404).json({ error: 'Pokémon non trouvé' });
        return;
      }

      const attack = await AttackRepository.findById(attackId);
      if (!attack) {
        res.status(404).json({ error: 'Attaque non trouvée' });
        return;
      }

      try {
        pokemon.learnAttack(attack);
        await PokemonRepository.update(id, pokemon);

        res.json({
          message: `${pokemon.getName()} a appris ${attack.getName()}`,
          pokemon: this.formatPokemon(pokemon)
        });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Supprime un Pokémon
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = await PokemonRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Pokémon non trouvé' });
        return;
      }

      res.json({ message: 'Pokémon supprimé avec succès' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Formate un Pokémon pour la réponse JSON
   */
  private static formatPokemon(pokemon: Pokemon) {
    return {
      id: pokemon.getId(),
      name: pokemon.getName(),
      lifePoint: pokemon.getLifePoint(),
      maxLifePoint: pokemon.getMaxLifePoint(),
      isKO: pokemon.isKO(),
      attacks: pokemon.getAttacks().map(attack => ({
        id: attack.getId(),
        name: attack.getName(),
        damage: attack.getDamage(),
        usageCount: attack.getUsageCount(),
        usageLimit: attack.getUsageLimit(),
        canUse: attack.canUse()
      }))
    };
  }
}
