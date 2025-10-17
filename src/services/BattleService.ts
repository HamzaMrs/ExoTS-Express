import { Trainer } from '../models/Trainer';
import { Pokemon } from '../models/Pokemon';

export interface BattleResult {
  winner: Trainer;
  loser: Trainer;
  totalRounds: number;
  battleLog: string[];
}

/**
 * Service gérant les différents types de combats
 */
export class BattleService {
  /**
   * Combat entre deux Pokémon jusqu'à ce que l'un soit KO
   */
  private static pokemonBattle(pokemon1: Pokemon, pokemon2: Pokemon): { winner: Pokemon; rounds: number; log: string[] } {
    const log: string[] = [];
    let rounds = 0;
    let attacker = pokemon1;
    let defender = pokemon2;

    log.push(`Combat entre ${pokemon1.getName()} (${pokemon1.getLifePoint()} PV) et ${pokemon2.getName()} (${pokemon2.getLifePoint()} PV)`);

    while (!pokemon1.isKO() && !pokemon2.isKO()) {
      rounds++;
      const result = attacker.attackPokemon(defender);
      
      if (result.success) {
        log.push(`Round ${rounds}: ${result.message}`);
        log.push(`  -> ${defender.getName()} : ${defender.getLifePoint()} PV restants`);
      } else {
        log.push(`Round ${rounds}: ${result.message}`);
      }

      // Alternance attaquant/défenseur
      [attacker, defender] = [defender, attacker];

      // Limite de sécurité pour éviter les boucles infinies
      if (rounds > 1000) {
        log.push('Combat trop long, match nul');
        break;
      }
    }

    const winner = pokemon1.isKO() ? pokemon2 : pokemon1;
    log.push(`${winner.getName()} remporte le combat !`);

    return { winner, rounds, log };
  }

  /**
   * Défi aléatoire : combat avec Pokémon aléatoires après passage à la taverne
   */
  static randomChallenge(trainer1: Trainer, trainer2: Trainer): BattleResult {
    const battleLog: string[] = [];
    
    // Passage à la taverne
    trainer1.healAllAtTavern();
    trainer2.healAllAtTavern();
    battleLog.push(`${trainer1.getName()} et ${trainer2.getName()} passent à la taverne`);

    // Choix aléatoire des Pokémon
    const pokemon1 = trainer1.chooseRandomPokemon();
    const pokemon2 = trainer2.chooseRandomPokemon();

    if (!pokemon1 || !pokemon2) {
      battleLog.push('Un dresseur n\'a pas de Pokémon disponible');
      return {
        winner: pokemon1 ? trainer1 : trainer2,
        loser: pokemon1 ? trainer2 : trainer1,
        totalRounds: 0,
        battleLog
      };
    }

    battleLog.push(`${trainer1.getName()} choisit ${pokemon1.getName()}`);
    battleLog.push(`${trainer2.getName()} choisit ${pokemon2.getName()}`);

    // Combat
    const result = this.pokemonBattle(pokemon1, pokemon2);
    battleLog.push(...result.log);

    const winner = result.winner === pokemon1 ? trainer1 : trainer2;
    const loser = winner === trainer1 ? trainer2 : trainer1;

    // Gain d'expérience
    winner.gainExperience(1);
    battleLog.push(`${winner.getName()} gagne 1 XP (Niveau ${winner.getLevel()}, ${winner.getExperience()} XP)`);

    return {
      winner,
      loser,
      totalRounds: result.rounds,
      battleLog
    };
  }

  /**
   * Arène 1 : 100 combats aléatoires, victoire au plus haut niveau/expérience
   */
  static arena1(trainer1: Trainer, trainer2: Trainer): { winner: Trainer; wins1: number; wins2: number; battleLog: string[] } {
    const battleLog: string[] = [];
    let wins1 = 0;
    let wins2 = 0;

    battleLog.push('=== ARÈNE 1 : 100 COMBATS ALÉATOIRES ===');

    for (let i = 1; i <= 100; i++) {
      battleLog.push(`\n--- Combat ${i}/100 ---`);
      const result = this.randomChallenge(trainer1, trainer2);
      
      if (result.winner === trainer1) {
        wins1++;
      } else {
        wins2++;
      }

      battleLog.push(`Score actuel: ${trainer1.getName()} ${wins1} - ${wins2} ${trainer2.getName()}`);
    }

    // Détermination du gagnant final
    let finalWinner: Trainer;
    if (trainer1.getLevel() > trainer2.getLevel()) {
      finalWinner = trainer1;
    } else if (trainer2.getLevel() > trainer1.getLevel()) {
      finalWinner = trainer2;
    } else {
      finalWinner = trainer1.getExperience() >= trainer2.getExperience() ? trainer1 : trainer2;
    }

    battleLog.push(`\n=== RÉSULTAT FINAL ===`);
    battleLog.push(`${trainer1.getName()}: Niveau ${trainer1.getLevel()}, ${trainer1.getExperience()} XP, ${wins1} victoires`);
    battleLog.push(`${trainer2.getName()}: Niveau ${trainer2.getLevel()}, ${trainer2.getExperience()} XP, ${wins2} victoires`);
    battleLog.push(`Vainqueur de l'Arène 1: ${finalWinner.getName()}`);

    return { winner: finalWinner, wins1, wins2, battleLog };
  }

  /**
   * Défi déterministe : combat avec le Pokémon ayant le plus de PV, sans taverne
   */
  static deterministicChallenge(trainer1: Trainer, trainer2: Trainer): BattleResult {
    const battleLog: string[] = [];
    
    // Choix du Pokémon avec le plus de PV
    const pokemon1 = trainer1.choosePokemonWithMostHP();
    const pokemon2 = trainer2.choosePokemonWithMostHP();

    if (!pokemon1 || !pokemon2) {
      battleLog.push('Un dresseur n\'a pas de Pokémon disponible');
      return {
        winner: pokemon1 ? trainer1 : trainer2,
        loser: pokemon1 ? trainer2 : trainer1,
        totalRounds: 0,
        battleLog
      };
    }

    battleLog.push(`${trainer1.getName()} choisit ${pokemon1.getName()} (${pokemon1.getLifePoint()} PV)`);
    battleLog.push(`${trainer2.getName()} choisit ${pokemon2.getName()} (${pokemon2.getLifePoint()} PV)`);

    // Combat
    const result = this.pokemonBattle(pokemon1, pokemon2);
    battleLog.push(...result.log);

    const winner = result.winner === pokemon1 ? trainer1 : trainer2;
    const loser = winner === trainer1 ? trainer2 : trainer1;

    return {
      winner,
      loser,
      totalRounds: result.rounds,
      battleLog
    };
  }

  /**
   * Arène 2 : 100 combats déterministes, arrêt si un dresseur perd tous ses Pokémon
   */
  static arena2(trainer1: Trainer, trainer2: Trainer): { winner: Trainer | null; wins1: number; wins2: number; battleLog: string[]; stopped: boolean } {
    const battleLog: string[] = [];
    let wins1 = 0;
    let wins2 = 0;
    let stopped = false;

    battleLog.push('=== ARÈNE 2 : 100 COMBATS DÉTERMINISTES ===');

    for (let i = 1; i <= 100; i++) {
      battleLog.push(`\n--- Combat ${i}/100 ---`);
      
      // Vérification si un dresseur a perdu tous ses Pokémon
      if (trainer1.hasLost()) {
        battleLog.push(`${trainer1.getName()} n'a plus de Pokémon disponible !`);
        stopped = true;
        break;
      }
      if (trainer2.hasLost()) {
        battleLog.push(`${trainer2.getName()} n'a plus de Pokémon disponible !`);
        stopped = true;
        break;
      }

      const result = this.deterministicChallenge(trainer1, trainer2);
      
      if (result.winner === trainer1) {
        wins1++;
      } else {
        wins2++;
      }

      battleLog.push(`Score actuel: ${trainer1.getName()} ${wins1} - ${wins2} ${trainer2.getName()}`);
      battleLog.push(`Pokémon restants: ${trainer1.getName()} ${trainer1.getAlivePokemonCount()}, ${trainer2.getName()} ${trainer2.getAlivePokemonCount()}`);
    }

    battleLog.push(`\n=== RÉSULTAT FINAL ===`);
    battleLog.push(`${trainer1.getName()}: ${wins1} victoires, ${trainer1.getAlivePokemonCount()} Pokémon restants`);
    battleLog.push(`${trainer2.getName()}: ${wins2} victoires, ${trainer2.getAlivePokemonCount()} Pokémon restants`);

    let winner: Trainer | null = null;
    if (trainer1.hasLost()) {
      winner = trainer2;
    } else if (trainer2.hasLost()) {
      winner = trainer1;
    } else {
      winner = wins1 > wins2 ? trainer1 : (wins2 > wins1 ? trainer2 : null);
    }

    if (winner) {
      battleLog.push(`Vainqueur de l'Arène 2: ${winner.getName()}`);
    } else {
      battleLog.push(`Match nul !`);
    }

    return { winner, wins1, wins2, battleLog, stopped };
  }
}
