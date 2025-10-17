import express from 'express';
import cors from 'cors';
import path from 'path';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

class Attack {
  constructor(
    public name: string,
    public damage: number,
    public usageLimit: number,
    public usageCount: number = 0,
    public id?: number
  ) {}
  use() { if (this.usageCount < this.usageLimit) this.usageCount++; }
  reset() { this.usageCount = 0; }
}

class Pokemon {
  public attacks: Attack[] = [];
  constructor(
    public name: string,
    public lifePoint: number,
    public maxLifePoint: number,
    public id?: number
  ) {}
  learnAttack(attack: Attack) {
    if (this.attacks.length >= 4) throw new Error('Max 4 attaques');
    this.attacks.push(attack);
  }
  heal() {
    this.lifePoint = this.maxLifePoint;
    this.attacks.forEach(a => a.reset());
  }
  attackRandom(target: Pokemon) {
    const usable = this.attacks.filter(a => a.usageCount < a.usageLimit);
    if (usable.length === 0) return;
    const chosen = usable[Math.floor(Math.random() * usable.length)];
    chosen.use();
    target.lifePoint = Math.max(0, target.lifePoint - chosen.damage);
  }
}

class Trainer {
  public pokemons: Pokemon[] = [];
  constructor(
    public name: string,
    public level: number = 1,
    public experience: number = 0,
    public id?: number
  ) {}
  addPokemon(pokemon: Pokemon) { this.pokemons.push(pokemon); }
  healAll() { this.pokemons.forEach(p => p.heal()); }
  gainExperience(amount: number) {
    this.experience += amount;
    while (this.experience >= 10) {
      this.level++;
      this.experience -= 10;
    }
  }
}

app.get('/api/attacks', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM attacks ORDER BY id');
  res.json({ attacks: rows });
});

app.post('/api/attacks', async (req, res) => {
  const { name, damage, usageLimit } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO attacks (name, damage, usage_limit) VALUES ($1, $2, $3) RETURNING *',
    [name, damage, usageLimit]
  );
  res.status(201).json({ attack: rows[0] });
});

app.get('/api/pokemons', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT p.*, json_agg(json_build_object('id', a.id, 'name', a.name, 'damage', a.damage)) AS attacks
    FROM pokemons p
    LEFT JOIN pokemon_attacks pa ON pa.pokemon_id = p.id
    LEFT JOIN attacks a ON a.id = pa.attack_id
    GROUP BY p.id ORDER BY p.id
  `);
  res.json({ pokemons: rows });
});

app.post('/api/pokemons', async (req, res) => {
  const { name, lifePoint, maxLifePoint, trainerId } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO pokemons (name, life_point, max_life_point, trainer_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, lifePoint, maxLifePoint, trainerId || null]
  );
  res.status(201).json({ pokemon: rows[0] });
});

app.post('/api/pokemons/:id/heal', async (req, res) => {
  const id = Number(req.params.id);
  await pool.query('UPDATE pokemons SET life_point = max_life_point WHERE id = $1', [id]);
  await pool.query('UPDATE pokemon_attacks SET usage_count = 0 WHERE pokemon_id = $1', [id]);
  res.json({ message: 'Pokémon soigné' });
});

app.post('/api/pokemons/:id/learn-attack', async (req, res) => {
  const pokemonId = Number(req.params.id);
  const attackId = Number(req.body.attackId);
  await pool.query(
    'INSERT INTO pokemon_attacks (pokemon_id, attack_id, usage_count) VALUES ($1, $2, 0)',
    [pokemonId, attackId]
  );
  res.json({ message: 'Attaque apprise' });
});

app.get('/api/trainers', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM trainers ORDER BY id');
  const trainers = [];
  for (const row of rows) {
    const { rows: pokemons } = await pool.query(
      'SELECT * FROM pokemons WHERE trainer_id = $1',
      [row.id]
    );
    trainers.push({ ...row, pokemons });
  }
  res.json({ trainers });
});

app.post('/api/trainers', async (req, res) => {
  const { name } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO trainers (name) VALUES ($1) RETURNING *',
    [name]
  );
  res.status(201).json({ trainer: rows[0] });
});

app.post('/api/trainers/:id/add-pokemon', async (req, res) => {
  const trainerId = Number(req.params.id);
  const pokemonId = Number(req.body.pokemonId);
  await pool.query('UPDATE pokemons SET trainer_id = $1 WHERE id = $2', [trainerId, pokemonId]);
  res.json({ message: 'Pokémon ajouté' });
});

app.post('/api/trainers/:id/heal', async (req, res) => {
  const trainerId = Number(req.params.id);
  await pool.query('UPDATE pokemons SET life_point = max_life_point WHERE trainer_id = $1', [trainerId]);
  res.json({ message: 'Tous les Pokémon soignés' });
});

app.post('/api/trainers/:id/gain-experience', async (req, res) => {
  const trainerId = Number(req.params.id);
  const amount = Number(req.body.amount || 1);
  const { rows } = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainerId]);
  let { level, experience } = rows[0];
  experience += amount;
  while (experience >= 10) {
    level++;
    experience -= 10;
  }
  await pool.query('UPDATE trainers SET level = $1, experience = $2 WHERE id = $3', [level, experience, trainerId]);
  res.json({ level, experience });
});

app.post('/api/battles/random', async (req, res) => {
  try {
    const { trainer1Id, trainer2Id } = req.body;
    const t1 = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainer1Id]);
    const t2 = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainer2Id]);
    if (t1.rows.length === 0 || t2.rows.length === 0) {
      return res.status(404).json({ error: 'Dresseur introuvable' });
    }
    
    const p1 = await pool.query('SELECT * FROM pokemons WHERE trainer_id = $1 ORDER BY RANDOM() LIMIT 1', [trainer1Id]);
    const p2 = await pool.query('SELECT * FROM pokemons WHERE trainer_id = $1 ORDER BY RANDOM() LIMIT 1', [trainer2Id]);
    
    if (p1.rows.length === 0 || p2.rows.length === 0) {
      return res.status(400).json({ error: 'Chaque dresseur doit avoir au moins un Pokémon' });
    }

    const pokemon1 = new Pokemon(p1.rows[0].name, p1.rows[0].life_point, p1.rows[0].max_life_point);
    const pokemon2 = new Pokemon(p2.rows[0].name, p2.rows[0].life_point, p2.rows[0].max_life_point);
    
    const a1 = await pool.query(`
      SELECT a.*, pa.usage_count 
      FROM attacks a 
      JOIN pokemon_attacks pa ON pa.attack_id = a.id 
      WHERE pa.pokemon_id = $1
    `, [p1.rows[0].id]);
    a1.rows.forEach(row => {
      pokemon1.attacks.push(new Attack(row.name, row.damage, row.usage_limit, row.usage_count, row.id));
    });
    
    const a2 = await pool.query(`
      SELECT a.*, pa.usage_count 
      FROM attacks a 
      JOIN pokemon_attacks pa ON pa.attack_id = a.id 
      WHERE pa.pokemon_id = $1
    `, [p2.rows[0].id]);
    a2.rows.forEach(row => {
      pokemon2.attacks.push(new Attack(row.name, row.damage, row.usage_limit, row.usage_count, row.id));
    });
    
    if (pokemon1.attacks.length === 0 || pokemon2.attacks.length === 0) {
      return res.status(400).json({ error: 'Chaque Pokémon doit avoir au moins une attaque' });
    }
    
    const log = [`Combat entre ${pokemon1.name} et ${pokemon2.name}`];
    let turn = 1;
    while (pokemon1.lifePoint > 0 && pokemon2.lifePoint > 0 && turn <= 50) {
      pokemon1.attackRandom(pokemon2);
      log.push(`Tour ${turn}: ${pokemon1.name} attaque! ${pokemon2.name} a ${pokemon2.lifePoint} PV`);
      if (pokemon2.lifePoint <= 0) break;
      pokemon2.attackRandom(pokemon1);
      log.push(`Tour ${turn}: ${pokemon2.name} attaque! ${pokemon1.name} a ${pokemon1.lifePoint} PV`);
      turn++;
    }
    
    const winner = pokemon1.lifePoint > pokemon2.lifePoint ? t1.rows[0].name : t2.rows[0].name;
    log.push(`${winner} remporte le combat!`);
    
    res.json({ winner, battleLog: log });
  } catch (error) {
    console.error('Erreur combat:', error);
    res.status(500).json({ error: 'Erreur lors du combat', details: String(error) });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

app.get('/', (_req, res) => {
  res.json({
    message: 'API Pokémon minimaliste',
    endpoints: {
      attacks: '/api/attacks',
      pokemons: '/api/pokemons',
      trainers: '/api/trainers',
      battles: '/api/battles/random'
    }
  });
});

app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log(`✅ Serveur sur http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Erreur DB', error);
  }
});

export default app;
