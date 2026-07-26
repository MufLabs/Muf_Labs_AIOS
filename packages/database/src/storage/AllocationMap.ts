/**
 * @aios/database - AllocationMap
 *
 * Migrated from T-Bit (c:\Git\T-Bit\AllocationMap.ts)
 * Manages allocation regions in the .tbit container to prevent
 * overlapping writes between data and anti-data segments.
 */

export type AllocationRange = [number, number];

export type AllocationRegion = {
  clave: string;
  ranges: AllocationRange[];
};

export class AllocationMap {
  private regions = new Map<string, AllocationRange[]>();

  constructor(
    private readonly lowerBound: number,
    private readonly upperBound: number
  ) {}

  load(regions: AllocationRegion[]): void {
    this.regions.clear();

    for (const region of regions) {
      this.regions.set(region.clave, region.ranges);
    }
  }

  canAllocate(clave: string, ranges: AllocationRange[]): boolean {
    for (const [existingKey, existingRanges] of this.regions) {
      if (existingKey === clave) {
        continue;
      }

      for (const candidate of ranges) {
        for (const existing of existingRanges) {
          if (this.overlaps(candidate, existing)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  allocate(clave: string, ranges: AllocationRange[]): void {
    this.regions.set(clave, ranges);
  }

  remove(clave: string): void {
    this.regions.delete(clave);
  }

  circularRanges(start: number, length: number): AllocationRange[] {
    if (length <= 0) return [];

    const normalizedStart = this.normalize(start);
    const end = normalizedStart + length;

    if (end <= this.upperBound) {
      return [[normalizedStart, end]];
    }

    return [
      [normalizedStart, this.upperBound],
      [
        this.lowerBound,
        this.lowerBound + ((end - this.upperBound) % (this.upperBound - this.lowerBound)),
      ],
    ];
  }

  private normalize(offset: number): number {
    const span = this.upperBound - this.lowerBound;

    if (offset < this.lowerBound) {
      return (
        this.lowerBound +
        ((offset - this.lowerBound) % span + span) % span
      );
    }

    return this.lowerBound + ((offset - this.lowerBound) % span);
  }

  private overlaps(a: AllocationRange, b: AllocationRange): boolean {
    return Math.max(a[0], b[0]) < Math.min(a[1], b[1]);
  }
}