import Pokemon from './Pokemon';

export default class Trainer {
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
