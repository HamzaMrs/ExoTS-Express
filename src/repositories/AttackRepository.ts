import pool from '../database/config';
import { Attack } from '../models/Attack';

/**
 * Repository pour gérer les attaques en base de données
 */
export class AttackRepository {
  /**
   * Crée une nouvelle attaque
   */
  static async create(attack: Attack): Promise<Attack> {
    const query = `
      INSERT INTO attacks (name, damage, usage_limit)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const values = [attack.getName(), attack.getDamage(), attack.getUsageLimit()];
    
    const result = await pool.query(query, values);
    attack.setId(result.rows[0].id);
    return attack;
  }

  /**
   * Récupère toutes les attaques
   */
  static async findAll(): Promise<Attack[]> {
    const query = 'SELECT * FROM attacks ORDER BY id';
    const result = await pool.query(query);
    
    return result.rows.map(row => 
      new Attack(row.name, row.damage, row.usage_limit, row.id)
    );
  }

  /**
   * Récupère une attaque par ID
   */
  static async findById(id: number): Promise<Attack | null> {
    const query = 'SELECT * FROM attacks WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return new Attack(row.name, row.damage, row.usage_limit, row.id);
  }

  /**
   * Récupère une attaque par nom
   */
  static async findByName(name: string): Promise<Attack | null> {
    const query = 'SELECT * FROM attacks WHERE name = $1';
    const result = await pool.query(query, [name]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return new Attack(row.name, row.damage, row.usage_limit, row.id);
  }

  /**
   * Met à jour une attaque
   */
  static async update(id: number, attack: Attack): Promise<Attack | null> {
    const query = `
      UPDATE attacks 
      SET name = $1, damage = $2, usage_limit = $3
      WHERE id = $4
      RETURNING *
    `;
    const values = [attack.getName(), attack.getDamage(), attack.getUsageLimit(), id];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return new Attack(row.name, row.damage, row.usage_limit, row.id);
  }

  /**
   * Supprime une attaque
   */
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM attacks WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
