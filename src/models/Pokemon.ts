import Attack from './Attack';

export default class Pokemon {
  public attacks: Attack[] = [];
  constructor(
    public name: string,
    public lifePoint: number,
    public maxLifePoint: number,
    public id?: number
  ) {}
  learnAttack(attack: Attack) {
    if (this.attacks.length >= 4) throw new Error('Max 4 attaques');
    if (this.attacks.some(a => a.name === attack.name)) throw new Error('Attaque déjà apprise');
    this.attacks.push(attack);
  }
  heal() {
    this.lifePoint = this.maxLifePoint;
    this.attacks.forEach(a => a.reset());
  }
  attackRandom(target: Pokemon): Attack | null {
    const usable = this.attacks.filter(a => a.usageCount < a.usageLimit);
    if (usable.length === 0) return null;
    const chosen = usable[Math.floor(Math.random() * usable.length)];
    const before = chosen.usageCount;
    chosen.use();
    target.lifePoint = Math.max(0, target.lifePoint - chosen.damage);
    return chosen.usageCount > before ? chosen : null;
  }
}
