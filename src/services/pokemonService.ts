import pool from '../db';
import Attack from '../models/Attack';
import Pokemon from '../models/Pokemon';

export async function loadPokemon(pokemonId: number): Promise<Pokemon | null> {
  const p = await pool.query('SELECT * FROM pokemons WHERE id = $1', [pokemonId]);
  if (p.rows.length === 0) return null;
  const pokemon = new Pokemon(p.rows[0].name, p.rows[0].life_point, p.rows[0].max_life_point, p.rows[0].id);
  const a = await pool.query(`
    SELECT a.*, pa.usage_count 
    FROM attacks a 
    JOIN pokemon_attacks pa ON pa.attack_id = a.id 
    WHERE pa.pokemon_id = $1
  `, [pokemonId]);
  a.rows.forEach(row => {
    pokemon.attacks.push(new Attack(row.name, row.damage, row.usage_limit, row.usage_count, row.id));
  });
  return pokemon;
}

export async function savePokemonState(pokemon: Pokemon) {
  await pool.query('UPDATE pokemons SET life_point = $1 WHERE id = $2', [pokemon.lifePoint, pokemon.id]);
}

export async function resetUsageForTrainers(trainer1Id: number, trainer2Id: number) {
  await pool.query(
    `UPDATE pokemon_attacks SET usage_count = 0
     WHERE pokemon_id IN (
       SELECT id FROM pokemons WHERE trainer_id IN ($1, $2)
     )`,
    [trainer1Id, trainer2Id]
  );
}

export async function incrementUsage(pokemonId: number, attackId: number) {
  await pool.query(
    `UPDATE pokemon_attacks pa
     SET usage_count = usage_count + 1
     WHERE pa.pokemon_id = $1
       AND pa.attack_id = $2
       AND pa.usage_count < (SELECT usage_limit FROM attacks WHERE id = $2)`,
    [pokemonId, attackId]
  );
}
