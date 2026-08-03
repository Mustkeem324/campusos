export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Mulberry32 algorithm for fast 32-bit deterministic random numbers
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  randomInteger(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  randomDecimal(min: number, max: number, decimals: number = 2): number {
    const raw = this.next() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(raw * factor) / factor;
  }

  randomBoolean(chanceOfTrue: number = 0.5): boolean {
    return this.next() < chanceOfTrue;
  }

  randomDate(startDate: Date, endDate: Date): Date {
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const targetMs = startMs + this.next() * (endMs - startMs);
    return new Date(targetMs);
  }

  randomItem<T>(items: T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  weightedItem<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let randomVal = this.next() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      if (randomVal < weights[i]) {
        return items[i];
      }
      randomVal -= weights[i];
    }
    return items[items.length - 1];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  generateStableId(domainIndex: number, index: number): string {
    const d = domainIndex.toString(16).padStart(4, '0');
    const idx = index.toString(16).padStart(12, '0');
    return `00000000-${d}-0000-0000-${idx}`;
  }

  generateSyntheticEmail(role: string, index: number, domain: string = 'demo-campusos.local'): string {
    const num = String(index + 1).padStart(3, '0');
    return `${role.toLowerCase()}${num}@${domain}`;
  }

  generateSyntheticPhone(index: number): string {
    const suffix = String(index + 1000).padStart(4, '0');
    return `+91 98765 0${suffix}`;
  }
}
