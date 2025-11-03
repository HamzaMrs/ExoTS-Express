export default class Attack {
  constructor(
    public name: string,
    public damage: number,
    public usageLimit: number,
    public usageCount: number = 0,
    public id?: number
  ) {}
  use() { if (this.usageCount < this.usageLimit) this.usageCount++; }
  reset() { this.usageCount = 0; }
  display(): string {
    return `${this.name} (${this.damage} dégâts, ${this.usageCount}/${this.usageLimit} utilisations)`;
  }
}
