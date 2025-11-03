import { Router } from 'express';
import pool from '../db';
import Pokemon from '../models/Pokemon';
import Attack from '../models/Attack';
import { loadPokemon, savePokemonState, resetUsageForTrainers, incrementUsage } from '../services/pokemonService';

const router = Router();

router.post('/random', async (req, res) => {
  try {
    const { trainer1Id, trainer2Id } = req.body;
    const t1 = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainer1Id]);
    const t2 = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainer2Id]);
    if (t1.rows.length === 0 || t2.rows.length === 0) {
      return res.status(404).json({ error: 'Dresseur introuvable' });
    }

    await pool.query('UPDATE pokemons SET life_point = max_life_point WHERE trainer_id IN ($1, $2)', [trainer1Id, trainer2Id]);
    await resetUsageForTrainers(trainer1Id, trainer2Id);

    const p1 = await pool.query('SELECT * FROM pokemons WHERE trainer_id = $1 ORDER BY RANDOM() LIMIT 1', [trainer1Id]);
    const p2 = await pool.query('SELECT * FROM pokemons WHERE trainer_id = $1 ORDER BY RANDOM() LIMIT 1', [trainer2Id]);

    if (p1.rows.length === 0 || p2.rows.length === 0) {
      return res.status(400).json({ error: 'Chaque dresseur doit avoir au moins un Pokémon' });
    }

    const pokemon1 = await loadPokemon(p1.rows[0].id);
    const pokemon2 = await loadPokemon(p2.rows[0].id);

    if (!pokemon1 || !pokemon2 || pokemon1.attacks.length === 0 || pokemon2.attacks.length === 0) {
      return res.status(400).json({ error: 'Pokémon invalides ou sans attaques' });
    }

    const log = [`Combat entre ${pokemon1.name} et ${pokemon2.name}`];
    let turn = 1;
    while (pokemon1.lifePoint > 0 && pokemon2.lifePoint > 0 && turn <= 50) {
      const used1 = pokemon1.attackRandom(pokemon2);
      if (used1 && pokemon1.id && used1.id) await incrementUsage(pokemon1.id, used1.id);
      log.push(`Tour ${turn}: ${pokemon1.name} attaque! ${pokemon2.name} a ${pokemon2.lifePoint} PV`);
      if (pokemon2.lifePoint <= 0) break;
      const used2 = pokemon2.attackRandom(pokemon1);
      if (used2 && pokemon2.id && used2.id) await incrementUsage(pokemon2.id, used2.id);
      log.push(`Tour ${turn}: ${pokemon2.name} attaque! ${pokemon1.name} a ${pokemon1.lifePoint} PV`);
      if (!used1 && !used2) break;
      turn++;
    }

    await savePokemonState(pokemon1);
    await savePokemonState(pokemon2);

    const winner = pokemon1.lifePoint > pokemon2.lifePoint ? t1.rows[0].name : t2.rows[0].name;
    log.push(`${winner} remporte le combat!`);

    res.json({ winner, battleLog: log });
  } catch (error) {
    console.error('Erreur combat:', error);
    res.status(500).json({ error: 'Erreur lors du combat', details: String(error) });
  }
});

router.post('/arena1', async (req, res) => {
  try {
    const { trainer1Id, trainer2Id } = req.body;
    const t1 = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainer1Id]);
    const t2 = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainer2Id]);
    if (t1.rows.length === 0 || t2.rows.length === 0) {
      return res.status(404).json({ error: 'Dresseur introuvable' });
    }

  // On joue 100 combats aléatoires avec taverne à chaque manche.
  // La règle de victoire d'Arène 1 est: plus haut niveau; si égalité de niveau, plus haute XP.
  // Si niveau et XP sont égaux, c'est une égalité.
  for (let i = 0; i < 100; i++) {
      await pool.query('UPDATE pokemons SET life_point = max_life_point WHERE trainer_id IN ($1, $2)', [trainer1Id, trainer2Id]);
      await resetUsageForTrainers(trainer1Id, trainer2Id);

      const p1 = await pool.query('SELECT * FROM pokemons WHERE trainer_id = $1 ORDER BY RANDOM() LIMIT 1', [trainer1Id]);
      const p2 = await pool.query('SELECT * FROM pokemons WHERE trainer_id = $1 ORDER BY RANDOM() LIMIT 1', [trainer2Id]);

      if (p1.rows.length === 0 || p2.rows.length === 0) continue;

      const pokemon1 = await loadPokemon(p1.rows[0].id);
      const pokemon2 = await loadPokemon(p2.rows[0].id);

      if (!pokemon1 || !pokemon2) continue;
      if (pokemon1.attacks.length === 0 || pokemon2.attacks.length === 0) continue; // ignorer combat invalide

      let turn = 1;
      let anyAction = false;
      while (pokemon1.lifePoint > 0 && pokemon2.lifePoint > 0 && turn <= 50) {
        const used1 = pokemon1.attackRandom(pokemon2);
        if (used1 && pokemon1.id && used1.id) { await incrementUsage(pokemon1.id, used1.id); anyAction = true; }
        if (pokemon2.lifePoint <= 0) break;
        const used2 = pokemon2.attackRandom(pokemon1);
        if (used2 && pokemon2.id && used2.id) { await incrementUsage(pokemon2.id, used2.id); anyAction = true; }
        if (!used1 && !used2) break; // éviter 50 tours à vide
        turn++;
      }

      // Pas de score: ces combats n'influencent pas la règle de victoire d'Arène 1.
    }

    // Sélection du vainqueur: plus haut niveau; si égalité de niveau, plus haute XP; si encore égalité, tirage au sort.
    let winner = t1.rows[0].name;
    if (t1.rows[0].level > t2.rows[0].level) winner = t1.rows[0].name;
    else if (t2.rows[0].level > t1.rows[0].level) winner = t2.rows[0].name;
    else if (t1.rows[0].experience > t2.rows[0].experience) winner = t1.rows[0].name;
    else if (t2.rows[0].experience > t1.rows[0].experience) winner = t2.rows[0].name;
    else winner = Math.random() < 0.5 ? t1.rows[0].name : t2.rows[0].name;

    const sameLevel = t1.rows[0].level === t2.rows[0].level;
    const sameXp = t1.rows[0].experience === t2.rows[0].experience;
    let msg = `Arène 1: Vainqueur: ${winner}.`;
    if (sameLevel && sameXp) {
      winner = null as unknown as string; // pas de vainqueur
      msg = `Arène 1: Égalité parfaite.`;
    }
    const lines = [
      'Arène 1',
      '100 combats aléatoires joués',
      'Règle: plus haut niveau, puis XP',
      `${t1.rows[0].name}: niveau ${t1.rows[0].level}, XP ${t1.rows[0].experience}`,
      `${t2.rows[0].name}: niveau ${t2.rows[0].level}, XP ${t2.rows[0].experience}`,
      sameLevel && sameXp ? 'Égalité parfaite' : `Vainqueur: ${msg.replace('Arène 1: Vainqueur: ', '').replace('.', '')}`
    ];
    res.json({ winner: winner ?? null, message: lines.join('\n'), battleLog: lines });
  } catch (error) {
    res.status(500).json({ error: 'Erreur Arène 1', details: String(error) });
  }
});

router.post('/deterministic', async (req, res) => {
  try {
    const { trainer1Id, trainer2Id } = req.body;
    const t1 = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainer1Id]);
    const t2 = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainer2Id]);
    if (t1.rows.length === 0 || t2.rows.length === 0) {
      return res.status(404).json({ error: 'Dresseur introuvable' });
    }

  const p1 = await pool.query('SELECT * FROM pokemons WHERE trainer_id = $1 AND life_point > 0 ORDER BY life_point DESC LIMIT 1', [trainer1Id]);
  const p2 = await pool.query('SELECT * FROM pokemons WHERE trainer_id = $1 AND life_point > 0 ORDER BY life_point DESC LIMIT 1', [trainer2Id]);

    if (p1.rows.length === 0 && p2.rows.length === 0) {
      return res.status(400).json({ error: 'Aucun Pokémon vivant chez les deux dresseurs' });
    }
    if (p1.rows.length === 0) {
      return res.status(400).json({ error: `${t1.rows[0].name} n\'a plus de Pokémon vivant` });
    }
    if (p2.rows.length === 0) {
      return res.status(400).json({ error: `${t2.rows[0].name} n\'a plus de Pokémon vivant` });
    }

    const pokemon1 = await loadPokemon(p1.rows[0].id);
    const pokemon2 = await loadPokemon(p2.rows[0].id);

    if (!pokemon1 || !pokemon2) {
      return res.status(400).json({ error: 'Pokémon invalides' });
    }

    if (pokemon1.attacks.length === 0 || pokemon2.attacks.length === 0) {
      return res.status(400).json({ error: 'Les Pokémon doivent avoir au moins une attaque' });
    }

    const log = [`Combat déterministe: ${pokemon1.name} (${pokemon1.lifePoint} PV) vs ${pokemon2.name} (${pokemon2.lifePoint} PV)`];
    let turn = 1;
    while (pokemon1.lifePoint > 0 && pokemon2.lifePoint > 0 && turn <= 50) {
      const used1 = pokemon1.attackRandom(pokemon2);
      if (used1 && pokemon1.id && used1.id) await incrementUsage(pokemon1.id, used1.id);
      log.push(`Tour ${turn}: ${pokemon1.name} attaque! ${pokemon2.name} a ${pokemon2.lifePoint} PV`);
      if (pokemon2.lifePoint <= 0) break;
      const used2 = pokemon2.attackRandom(pokemon1);
      if (used2 && pokemon2.id && used2.id) await incrementUsage(pokemon2.id, used2.id);
      log.push(`Tour ${turn}: ${pokemon2.name} attaque! ${pokemon1.name} a ${pokemon1.lifePoint} PV`);
      if (!used1 && !used2) break;
      turn++;
    }

    await savePokemonState(pokemon1);
    await savePokemonState(pokemon2);

    const winner = pokemon1.lifePoint > pokemon2.lifePoint ? t1.rows[0].name : t2.rows[0].name;
    log.push(`${winner} remporte le combat déterministe!`);

    res.json({ winner, battleLog: log });
  } catch (error) {
    console.error('Erreur combat déterministe:', error);
    res.status(500).json({ error: 'Erreur combat déterministe', details: String(error) });
  }
});

router.post('/arena2', async (req, res) => {
  try {
    const { trainer1Id, trainer2Id } = req.body;
    const t1 = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainer1Id]);
    const t2 = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainer2Id]);
    if (t1.rows.length === 0 || t2.rows.length === 0) {
      return res.status(404).json({ error: 'Dresseur introuvable' });
    }

    let battlesCount = 0;
    let winner = '';

    for (let i = 0; i < 100; i++) {
      const p1 = await pool.query('SELECT * FROM pokemons WHERE trainer_id = $1 AND life_point > 0 ORDER BY life_point DESC LIMIT 1', [trainer1Id]);
      const p2 = await pool.query('SELECT * FROM pokemons WHERE trainer_id = $1 AND life_point > 0 ORDER BY life_point DESC LIMIT 1', [trainer2Id]);

      if (p1.rows.length === 0) {
        winner = t2.rows[0].name;
        break;
      }
      if (p2.rows.length === 0) {
        winner = t1.rows[0].name;
        break;
      }

      const pokemon1 = await loadPokemon(p1.rows[0].id);
      const pokemon2 = await loadPokemon(p2.rows[0].id);

      if (!pokemon1 || !pokemon2) break;

      let turn = 1;
      while (pokemon1.lifePoint > 0 && pokemon2.lifePoint > 0 && turn <= 50) {
        const used1 = pokemon1.attackRandom(pokemon2);
        if (used1 && pokemon1.id && used1.id) await incrementUsage(pokemon1.id, used1.id);
        if (pokemon2.lifePoint <= 0) break;
        const used2 = pokemon2.attackRandom(pokemon1);
        if (used2 && pokemon2.id && used2.id) await incrementUsage(pokemon2.id, used2.id);
        if (!used1 && !used2) break;
        turn++;
      }

      await savePokemonState(pokemon1);
      await savePokemonState(pokemon2);

      battlesCount++;
    }

    if (!winner) {
      const alive1 = await pool.query('SELECT COUNT(*) FROM pokemons WHERE trainer_id = $1 AND life_point > 0', [trainer1Id]);
      const alive2 = await pool.query('SELECT COUNT(*) FROM pokemons WHERE trainer_id = $1 AND life_point > 0', [trainer2Id]);
      winner = Number(alive1.rows[0].count) >= Number(alive2.rows[0].count) ? t1.rows[0].name : t2.rows[0].name;
    }

    const lines2 = [
      'Arène 2',
      `Combats effectués: ${battlesCount}`,
      `Vainqueur: ${winner}`
    ];
    res.json({ winner, message: lines2.join('\n'), battleLog: lines2 });
  } catch (error) {
    res.status(500).json({ error: 'Erreur Arène 2', details: String(error) });
  }
});

export default router;
