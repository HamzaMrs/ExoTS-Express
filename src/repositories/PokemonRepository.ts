import pool from '../database/config';
import { Pokemon } from '../models/Pokemon';
import { Attack } from '../models/Attack';

/**
 * Repository pour gérer les Pokémon en base de données
 */
export class PokemonRepository {
  /**
   * Crée un nouveau Pokémon
   */
  static async create(pokemon: Pokemon, trainerId?: number): Promise<Pokemon> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insertion du Pokémon
      const pokemonQuery = `
        INSERT INTO pokemons (name, life_point, max_life_point, trainer_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const pokemonValues = [
        pokemon.getName(),
        pokemon.getLifePoint(),
        pokemon.getMaxLifePoint(),
        trainerId || null
      ];
      
      const result = await client.query(pokemonQuery, pokemonValues);
      const pokemonId = result.rows[0].id;
      pokemon.setId(pokemonId);

      // Insertion des attaques du Pokémon
      for (const attack of pokemon.getAttacks()) {
        const attackQuery = `
          INSERT INTO pokemon_attacks (pokemon_id, attack_id, usage_count)
          VALUES ($1, $2, $3)
        `;
        await client.query(attackQuery, [pokemonId, attack.getId(), attack.getUsageCount()]);
      }

      await client.query('COMMIT');
      return pokemon;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère tous les Pokémon
   */
  static async findAll(): Promise<Pokemon[]> {
    const query = `
      SELECT p.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'damage', a.damage,
              'usage_limit', a.usage_limit,
              'usage_count', pa.usage_count
            )
          ) FILTER (WHERE a.id IS NOT NULL), '[]'
        ) as attacks
      FROM pokemons p
      LEFT JOIN pokemon_attacks pa ON p.id = pa.pokemon_id
      LEFT JOIN attacks a ON pa.attack_id = a.id
      GROUP BY p.id
      ORDER BY p.id
    `;
    
    const result = await pool.query(query);
    return this.mapRowsToPokemons(result.rows);
  }

  /**
   * Récupère un Pokémon par ID
   */
  static async findById(id: number): Promise<Pokemon | null> {
    const query = `
      SELECT p.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'damage', a.damage,
              'usage_limit', a.usage_limit,
              'usage_count', pa.usage_count
            )
          ) FILTER (WHERE a.id IS NOT NULL), '[]'
        ) as attacks
      FROM pokemons p
      LEFT JOIN pokemon_attacks pa ON p.id = pa.pokemon_id
      LEFT JOIN attacks a ON pa.attack_id = a.id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    return this.mapRowsToPokemons(result.rows)[0];
  }

  /**
   * Récupère les Pokémon d'un dresseur
   */
  static async findByTrainerId(trainerId: number): Promise<Pokemon[]> {
    const query = `
      SELECT p.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'damage', a.damage,
              'usage_limit', a.usage_limit,
              'usage_count', pa.usage_count
            )
          ) FILTER (WHERE a.id IS NOT NULL), '[]'
        ) as attacks
      FROM pokemons p
      LEFT JOIN pokemon_attacks pa ON p.id = pa.pokemon_id
      LEFT JOIN attacks a ON pa.attack_id = a.id
      WHERE p.trainer_id = $1
      GROUP BY p.id
      ORDER BY p.id
    `;
    
    const result = await pool.query(query, [trainerId]);
    return this.mapRowsToPokemons(result.rows);
  }

  /**
   * Met à jour un Pokémon
   */
  static async update(id: number, pokemon: Pokemon): Promise<Pokemon | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Mise à jour du Pokémon
      const pokemonQuery = `
        UPDATE pokemons 
        SET name = $1, life_point = $2, max_life_point = $3
        WHERE id = $4
        RETURNING *
      `;
      const pokemonValues = [
        pokemon.getName(),
        pokemon.getLifePoint(),
        pokemon.getMaxLifePoint(),
        id
      ];
      
      const result = await client.query(pokemonQuery, pokemonValues);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // Mise à jour des attaques
      await client.query('DELETE FROM pokemon_attacks WHERE pokemon_id = $1', [id]);
      
      for (const attack of pokemon.getAttacks()) {
        const attackQuery = `
          INSERT INTO pokemon_attacks (pokemon_id, attack_id, usage_count)
          VALUES ($1, $2, $3)
        `;
        await client.query(attackQuery, [id, attack.getId(), attack.getUsageCount()]);
      }

      await client.query('COMMIT');
      
      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Supprime un Pokémon
   */
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM pokemons WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Associe un Pokémon à un dresseur
   */
  static async assignToTrainer(pokemonId: number, trainerId: number): Promise<boolean> {
    const query = 'UPDATE pokemons SET trainer_id = $1 WHERE id = $2';
    const result = await pool.query(query, [trainerId, pokemonId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Convertit les lignes de résultat en objets Pokemon
   */
  private static mapRowsToPokemons(rows: any[]): Pokemon[] {
    return rows.map(row => {
      const pokemon = new Pokemon(row.name, row.life_point, row.id);
      pokemon.setLifePoint(row.life_point);
      
      const attacks = row.attacks.map((attackData: any) => {
        const attack = new Attack(
          attackData.name,
          attackData.damage,
          attackData.usage_limit,
          attackData.id
        );
        attack.setUsageCount(attackData.usage_count);
        return attack;
      });
      
      pokemon.setAttacks(attacks);
      return pokemon;
    });
  }
}
