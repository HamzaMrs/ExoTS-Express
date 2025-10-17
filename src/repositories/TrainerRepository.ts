import pool from '../database/config';
import { Trainer } from '../models/Trainer';
import { PokemonRepository } from './PokemonRepository';

/**
 * Repository pour gérer les Dresseurs en base de données
 */
export class TrainerRepository {
  /**
   * Crée un nouveau dresseur
   */
  static async create(trainer: Trainer): Promise<Trainer> {
    const query = `
      INSERT INTO trainers (name, level, experience)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const values = [trainer.getName(), trainer.getLevel(), trainer.getExperience()];
    
    const result = await pool.query(query, values);
    trainer.setId(result.rows[0].id);
    return trainer;
  }

  /**
   * Récupère tous les dresseurs
   */
  static async findAll(): Promise<Trainer[]> {
    const query = 'SELECT * FROM trainers ORDER BY id';
    const result = await pool.query(query);
    
    const trainers: Trainer[] = [];
    
    for (const row of result.rows) {
      const trainer = new Trainer(row.name, row.level, row.experience, row.id);
      const pokemons = await PokemonRepository.findByTrainerId(row.id);
      trainer.setPokemons(pokemons);
      trainers.push(trainer);
    }
    
    return trainers;
  }

  /**
   * Récupère un dresseur par ID avec ses Pokémon
   */
  static async findById(id: number): Promise<Trainer | null> {
    const query = 'SELECT * FROM trainers WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    const trainer = new Trainer(row.name, row.level, row.experience, row.id);
    
    const pokemons = await PokemonRepository.findByTrainerId(id);
    trainer.setPokemons(pokemons);
    
    return trainer;
  }

  /**
   * Met à jour un dresseur
   */
  static async update(id: number, trainer: Trainer): Promise<Trainer | null> {
    const query = `
      UPDATE trainers 
      SET name = $1, level = $2, experience = $3
      WHERE id = $4
      RETURNING *
    `;
    const values = [trainer.getName(), trainer.getLevel(), trainer.getExperience(), id];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    const updatedTrainer = new Trainer(row.name, row.level, row.experience, row.id);
    
    const pokemons = await PokemonRepository.findByTrainerId(id);
    updatedTrainer.setPokemons(pokemons);
    
    return updatedTrainer;
  }

  /**
   * Supprime un dresseur
   */
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM trainers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
