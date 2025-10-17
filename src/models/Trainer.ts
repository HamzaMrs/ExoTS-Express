import { Pokemon } from './Pokemon';

/**
 * Classe représentant un Dresseur de Pokémon
 */
export class Trainer {
  private id?: number;
  private name: string;
  private level: number;
  private experience: number;
  private pokemons: Pokemon[];
  private readonly EXP_PER_LEVEL = 10;

  constructor(name: string, level: number = 1, experience: number = 0, id?: number) {
    this.name = name;
    this.level = level;
    this.experience = experience;
    this.pokemons = [];
    this.id = id;
  }

  /**
   * Ajoute un Pokémon à l'équipe
   */
  addPokemon(pokemon: Pokemon): void {
    this.pokemons.push(pokemon);
  }

  /**
   * Soigne tous les Pokémon à la taverne
   */
  healAllAtTavern(): void {
    this.pokemons.forEach(pokemon => pokemon.heal());
  }

  /**
   * Gagne de l'expérience et monte de niveau si nécessaire
   */
  gainExperience(exp: number): void {
    this.experience += exp;
    
    while (this.experience >= this.EXP_PER_LEVEL) {
      this.experience -= this.EXP_PER_LEVEL;
      this.level++;
    }
  }

  /**
   * Choisit un Pokémon aléatoire dans l'équipe
   */
  chooseRandomPokemon(): Pokemon | null {
    const availablePokemons = this.pokemons.filter(p => !p.isKO());
    if (availablePokemons.length === 0) return null;
    
    return availablePokemons[Math.floor(Math.random() * availablePokemons.length)];
  }

  /**
   * Choisit le Pokémon avec le plus de PV
   */
  choosePokemonWithMostHP(): Pokemon | null {
    const availablePokemons = this.pokemons.filter(p => !p.isKO());
    if (availablePokemons.length === 0) return null;
    
    return availablePokemons.reduce((prev, current) => 
      current.getLifePoint() > prev.getLifePoint() ? current : prev
    );
  }

  /**
   * Vérifie si tous les Pokémon sont KO
   */
  hasLost(): boolean {
    return this.pokemons.every(p => p.isKO());
  }

  /**
   * Compte le nombre de Pokémon encore en vie
   */
  getAlivePokemonCount(): number {
    return this.pokemons.filter(p => !p.isKO()).length;
  }

  // Getters
  getId(): number | undefined {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getLevel(): number {
    return this.level;
  }

  getExperience(): number {
    return this.experience;
  }

  getPokemons(): Pokemon[] {
    return this.pokemons;
  }

  // Setters
  setId(id: number): void {
    this.id = id;
  }

  setLevel(level: number): void {
    this.level = level;
  }

  setExperience(experience: number): void {
    this.experience = experience;
  }

  setPokemons(pokemons: Pokemon[]): void {
    this.pokemons = pokemons;
  }
}
