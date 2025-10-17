/**
 * Classe représentant une attaque de Pokémon
 */
export class Attack {
  private id?: number;
  private name: string;
  private damage: number;
  private usageLimit: number;
  private usageCount: number;

  constructor(name: string, damage: number, usageLimit: number, id?: number) {
    this.name = name;
    this.damage = damage;
    this.usageLimit = usageLimit;
    this.usageCount = 0;
    this.id = id;
  }

  /**
   * Vérifie si l'attaque peut encore être utilisée
   */
  canUse(): boolean {
    return this.usageCount < this.usageLimit;
  }

  /**
   * Utilise l'attaque et incrémente le compteur
   */
  use(): void {
    if (this.canUse()) {
      this.usageCount++;
    } else {
      throw new Error(`L'attaque ${this.name} ne peut plus être utilisée`);
    }
  }

  /**
   * Réinitialise le compteur d'usage
   */
  resetUsage(): void {
    this.usageCount = 0;
  }

  /**
   * Affiche les informations de l'attaque
   */
  getInfo(): string {
    return `${this.name} - Dégâts: ${this.damage}, Utilisations: ${this.usageCount}/${this.usageLimit}`;
  }

  getId(): number | undefined {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDamage(): number {
    return this.damage;
  }

  getUsageLimit(): number {
    return this.usageLimit;
  }

  getUsageCount(): number {
    return this.usageCount;
  }

  setId(id: number): void {
    this.id = id;
  }

  setUsageCount(count: number): void {
    this.usageCount = count;
  }
}
