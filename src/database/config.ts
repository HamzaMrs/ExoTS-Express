import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuration et connexion à PostgreSQL
 */
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'pokemon_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('connect', () => {
  console.log('✅ Connexion à PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err);
  process.exit(-1);
});

export default pool;
