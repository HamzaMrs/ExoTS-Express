import { Attack } from './Attack';

/**
 * Classe représentant un Pokémon
 */
export class Pokemon {
  private id?: number;
  private name: string;
  private lifePoint: number;
  private maxLifePoint: number;
  private attacks: Attack[];
  private readonly MAX_ATTACKS = 4;

  constructor(name: string, lifePoint: number, id?: number) {
    this.name = name;
    this.lifePoint = lifePoint;
    this.maxLifePoint = lifePoint;
    this.attacks = [];
    this.id = id;
  }

  /**
   * Apprend une nouvelle attaque (max 4, sans doublon)
   */
  learnAttack(attack: Attack): boolean {
    if (this.attacks.length >= this.MAX_ATTACKS) {
      throw new Error(`${this.name} connaît déjà 4 attaques`);
    }

    // Vérification des doublons
    if (this.attacks.some(a => a.getName() === attack.getName())) {
      throw new Error(`${this.name} connaît déjà l'attaque ${attack.getName()}`);
    }

    this.attacks.push(attack);
    return true;
  }

  /**
   * Se soigne : restaure les PV et réinitialise les attaques
   */
  heal(): void {
    this.lifePoint = this.maxLifePoint;
    this.attacks.forEach(attack => attack.resetUsage());
  }

  /**
   * Attaque un autre Pokémon avec une attaque aléatoire disponible
   */
  attackPokemon(target: Pokemon): { success: boolean; attackUsed?: Attack; damage?: number; message: string } {
    if (this.lifePoint <= 0) {
      return { success: false, message: `${this.name} est KO et ne peut pas attaquer` };
    }

    // Filtre les attaques disponibles
    const availableAttacks = this.attacks.filter(a => a.canUse());

    if (availableAttacks.length === 0) {
      return { success: false, message: `${this.name} n'a plus d'attaques disponibles` };
    }

    // Choix aléatoire d'une attaque
    const randomAttack = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
    randomAttack.use();

    // Application des dégâts
    const damage = randomAttack.getDamage();
    target.takeDamage(damage);

    return {
      success: true,
      attackUsed: randomAttack,
      damage,
      message: `${this.name} utilise ${randomAttack.getName()} et inflige ${damage} dégâts à ${target.getName()}`
    };
  }

  /**
   * Subit des dégâts
   */
  takeDamage(damage: number): void {
    this.lifePoint = Math.max(0, this.lifePoint - damage);
  }

  /**
   * Vérifie si le Pokémon est KO
   */
  isKO(): boolean {
    return this.lifePoint <= 0;
  }

  // Getters
  getId(): number | undefined {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getLifePoint(): number {
    return this.lifePoint;
  }

  getMaxLifePoint(): number {
    return this.maxLifePoint;
  }

  getAttacks(): Attack[] {
    return this.attacks;
  }

  // Setters
  setId(id: number): void {
    this.id = id;
  }

  setLifePoint(lifePoint: number): void {
    this.lifePoint = lifePoint;
  }

  setAttacks(attacks: Attack[]): void {
    this.attacks = attacks;
  }
}
