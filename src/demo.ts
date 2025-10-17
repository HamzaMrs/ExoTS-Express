import { Attack } from './models/Attack';
import { Pokemon } from './models/Pokemon';
import { Trainer } from './models/Trainer';
import { BattleService } from './services/BattleService';

/**
 * Fichier de démonstration sans base de données
 * Pour tester la logique POO et les combats
 */

console.log(`
╔════════════════════════════════════════════╗
║   🎮 DÉMONSTRATION POKÉMON - MODE POO 🎮   ║
╚════════════════════════════════════════════╝
`);

console.log('📋 Création des attaques...\n');
const eclair = new Attack('Éclair', 40, 10);
const tonnerre = new Attack('Tonnerre', 90, 5);
const charge = new Attack('Charge', 35, 15);
const fatalFoudre = new Attack('Fatal-Foudre', 110, 3);

console.log('🎯 Création des Pokémon...\n');
const pikachu = new Pokemon('Pikachu', 100);
pikachu.learnAttack(eclair);
pikachu.learnAttack(tonnerre);
pikachu.learnAttack(charge);
console.log(`✅ ${pikachu.getName()} créé avec ${pikachu.getAttacks().length} attaques`);

const raichu = new Pokemon('Raichu', 150);
raichu.learnAttack(tonnerre);
raichu.learnAttack(fatalFoudre);
raichu.learnAttack(charge);
console.log(`✅ ${raichu.getName()} créé avec ${raichu.getAttacks().length} attaques`);

const rattata = new Pokemon('Rattata', 80);
rattata.learnAttack(charge);
rattata.learnAttack(eclair);
console.log(`✅ ${rattata.getName()} créé avec ${rattata.getAttacks().length} attaques`);

const rattatac = new Pokemon('Rattatac', 120);
rattatac.learnAttack(charge);
rattatac.learnAttack(tonnerre);
console.log(`✅ ${rattatac.getName()} créé avec ${rattatac.getAttacks().length} attaques`);

console.log('\n👤 Création des dresseurs...\n');
const sacha = new Trainer('Sacha', 1, 0);
sacha.addPokemon(pikachu);
sacha.addPokemon(rattata);
console.log(`✅ ${sacha.getName()} - Niveau ${sacha.getLevel()} - ${sacha.getPokemons().length} Pokémon`);

const pierre = new Trainer('Pierre', 1, 0);
pierre.addPokemon(raichu);
pierre.addPokemon(rattatac);
console.log(`✅ ${pierre.getName()} - Niveau ${pierre.getLevel()} - ${pierre.getPokemons().length} Pokémon`);

console.log('\n' + '='.repeat(60));
console.log('⚔️  DÉFI ALÉATOIRE');
console.log('='.repeat(60) + '\n');

const randomResult = BattleService.randomChallenge(sacha, pierre);
console.log(randomResult.battleLog.join('\n'));

console.log('\n📊 Résultat :');
console.log(`   Vainqueur : ${randomResult.winner.getName()}`);
console.log(`   Rounds : ${randomResult.totalRounds}`);
console.log(`   ${sacha.getName()} : Niveau ${sacha.getLevel()}, ${sacha.getExperience()} XP`);
console.log(`   ${pierre.getName()} : Niveau ${pierre.getLevel()}, ${pierre.getExperience()} XP`);

console.log('\n' + '='.repeat(60));
console.log('🏟️  ARÈNE 1 : 100 COMBATS ALÉATOIRES');
console.log('='.repeat(60) + '\n');

sacha.setLevel(1);
sacha.setExperience(0);
pierre.setLevel(1);
pierre.setExperience(0);
sacha.healAllAtTavern();
pierre.healAllAtTavern();

const arena1Result = BattleService.arena1(sacha, pierre);
console.log(`📊 Résultat de l'Arène 1 :`);
console.log(`   ${sacha.getName()} : ${arena1Result.wins1} victoires, Niveau ${sacha.getLevel()}, ${sacha.getExperience()} XP`);
console.log(`   ${pierre.getName()} : ${arena1Result.wins2} victoires, Niveau ${pierre.getLevel()}, ${pierre.getExperience()} XP`);
console.log(`   🏆 Vainqueur : ${arena1Result.winner.getName()}`);

console.log('\n' + '='.repeat(60));
console.log('🎯 DÉFI DÉTERMINISTE');
console.log('='.repeat(60) + '\n');

sacha.healAllAtTavern();
pierre.healAllAtTavern();

const detResult = BattleService.deterministicChallenge(sacha, pierre);
console.log(detResult.battleLog.slice(-10).join('\n'));

console.log('\n📊 Résultat :');
console.log(`   Vainqueur : ${detResult.winner.getName()}`);
console.log(`   Rounds : ${detResult.totalRounds}`);

console.log('\n' + '='.repeat(60));
console.log('🏟️  ARÈNE 2 : 100 COMBATS DÉTERMINISTES');
console.log('='.repeat(60) + '\n');

sacha.healAllAtTavern();
pierre.healAllAtTavern();

const arena2Result = BattleService.arena2(sacha, pierre);
console.log(`📊 Résultat de l'Arène 2 :`);
console.log(`   ${sacha.getName()} : ${arena2Result.wins1} victoires, ${sacha.getAlivePokemonCount()} Pokémon restants`);
console.log(`   ${pierre.getName()} : ${arena2Result.wins2} victoires, ${pierre.getAlivePokemonCount()} Pokémon restants`);
if (arena2Result.winner) {
  console.log(`   🏆 Vainqueur : ${arena2Result.winner.getName()}`);
} else {
  console.log(`   🤝 Match nul`);
}
console.log(`   Arrêt anticipé : ${arena2Result.stopped ? 'Oui' : 'Non'}`);

console.log('\n' + '='.repeat(60));
console.log('✅ Démonstration terminée !');
console.log('='.repeat(60) + '\n');
