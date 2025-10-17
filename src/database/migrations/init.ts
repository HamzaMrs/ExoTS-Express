import pool from '../config';

/**
 * Script d'initialisation de la base de données
 */
async function initDatabase() {

  const client = await pool.connect();

  // S'assurer que la clé primaire composite existe bien sur pokemon_attacks
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'pokemon_attacks' AND constraint_type = 'PRIMARY KEY'
      ) THEN
        ALTER TABLE pokemon_attacks ADD CONSTRAINT pokemon_attacks_pkey PRIMARY KEY (pokemon_id, attack_id);
      END IF;
    END $$;
  `);

  try {
    console.log('🚀 Début de l\'initialisation de la base de données...');

    // Création de la table attacks
    await client.query(`
      CREATE TABLE IF NOT EXISTS attacks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        damage INTEGER NOT NULL CHECK (damage > 0),
        usage_limit INTEGER NOT NULL CHECK (usage_limit > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table attacks créée');

    // Création de la table pokemons
    await client.query(`
      CREATE TABLE IF NOT EXISTS pokemons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        life_point INTEGER NOT NULL CHECK (life_point > 0),
        max_life_point INTEGER NOT NULL CHECK (max_life_point > 0),
        trainer_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table pokemons créée');

    // Création de la table trainers
    await client.query(`
      CREATE TABLE IF NOT EXISTS trainers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        level INTEGER DEFAULT 1 CHECK (level > 0),
        experience INTEGER DEFAULT 0 CHECK (experience >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table trainers créée');

    // Création de la table de liaison pokemon_attacks
    await client.query(`
      CREATE TABLE IF NOT EXISTS pokemon_attacks (
        pokemon_id INTEGER REFERENCES pokemons(id) ON DELETE CASCADE,
        attack_id INTEGER REFERENCES attacks(id) ON DELETE CASCADE,
        usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
        PRIMARY KEY (pokemon_id, attack_id)
      );
    `);
    console.log('✅ Table pokemon_attacks créée');

    // Ajout de la contrainte foreign key pour trainer_id
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'pokemons_trainer_id_fkey'
        ) THEN
          ALTER TABLE pokemons 
          ADD CONSTRAINT pokemons_trainer_id_fkey 
          FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    console.log('✅ Contraintes ajoutées');

    // Insertion de données de test
    await client.query(`
      INSERT INTO attacks (name, damage, usage_limit) 
      VALUES 
        ('Éclair', 40, 10),
        ('Flammèche', 40, 10),
        ('Pistolet à O', 40, 10),
        ('Charge', 35, 15),
        ('Tonnerre', 90, 5),
        ('Lance-Flammes', 90, 5),
        ('Hydrocanon', 110, 3),
        ('Fatal-Foudre', 110, 3)
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✅ Attaques de test insérées');

    // Création d'un dresseur de test s'il n'existe pas
    const trainerResult = await client.query(`
      INSERT INTO trainers (name, level, experience)
      VALUES ('Sacha', 5, 100)
      ON CONFLICT (name) DO NOTHING
      RETURNING id;
    `);
    const trainerId = trainerResult.rows[0]?.id || (await client.query(`SELECT id FROM trainers WHERE name = 'Sacha'`)).rows[0]?.id;

    // Création d'un Pokémon de test s'il n'existe pas

    // Vérifier si Pikachu existe déjà
    let pokemonId: number | undefined;
    const existingPoke = await client.query(`SELECT id FROM pokemons WHERE name = 'Pikachu'`);
    if (existingPoke.rows.length === 0) {
      const pokemonResult = await client.query(`
        INSERT INTO pokemons (name, life_point, max_life_point, trainer_id)
        VALUES ('Pikachu', 100, 100, $1)
        RETURNING id;
      `, [trainerId]);
      pokemonId = pokemonResult.rows[0]?.id;
    } else {
      pokemonId = existingPoke.rows[0].id;
    }

    // Lier une attaque à Pikachu si ce n'est pas déjà fait
    const attack = (await client.query(`SELECT id FROM attacks WHERE name = 'Éclair'`)).rows[0];
    if (attack && pokemonId) {
      const exists = await client.query(`SELECT 1 FROM pokemon_attacks WHERE pokemon_id = $1 AND attack_id = $2`, [pokemonId, attack.id]);
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO pokemon_attacks (pokemon_id, attack_id, usage_count)
          VALUES ($1, $2, 0)
          ON CONFLICT (pokemon_id, attack_id) DO NOTHING;
        `, [pokemonId, attack.id]);
      }
    }

    console.log('🎉 Initialisation terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Exécution si appelé directement
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default initDatabase;
