export interface ComputableMemoryEntry {
  key: string;
  value: unknown;
  coordinates?: [number, number, number];
  antiCoordinates?: [number, number, number];
  timestamp: number;
  checksum: string;
}

export interface ComputableMemoryQuery {
  coordinates?: [number, number, number];
  radius?: number;
  tags?: string[];
  limit?: number;
}

export interface ComputableMemoryResult {
  entries: ComputableMemoryEntry[];
  total: number;
  queryTime: number;
}

export class ComputableMemoryStore {
  private entries: Map<string, ComputableMemoryEntry> = new Map();
  private spatialIndex: Map<string, ComputableMemoryEntry[]> = new Map();

  async put(entry: ComputableMemoryEntry): Promise<void> {
    this.entries.set(entry.key, entry);
    if (entry.coordinates) {
      const bucket = this.getSpatialBucket(entry.coordinates);
      if (!this.spatialIndex.has(bucket)) {
        this.spatialIndex.set(bucket, []);
      }
      this.spatialIndex.get(bucket)!.push(entry);
    }
  }

  async get(key: string): Promise<ComputableMemoryEntry | undefined> {
    return this.entries.get(key);
  }

  async query(query: ComputableMemoryQuery): Promise<ComputableMemoryResult> {
    const startTime = Date.now();
    let results: ComputableMemoryEntry[] = [];

    if (query.coordinates && query.radius) {
      const bucket = this.getSpatialBucket(query.coordinates);
      const nearbyEntries = this.spatialIndex.get(bucket) || [];
      results = nearbyEntries.filter((entry) => {
        if (!entry.coordinates) return false;
        const distance = this.euclideanDistance(query.coordinates!, entry.coordinates);
        return distance <= query.radius!;
      });
    } else {
      results = Array.from(this.entries.values());
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter((entry) => {
        // Tag filtering would require storing tags with entries
        return true;
      });
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return {
      entries: results,
      total: results.length,
      queryTime: Date.now() - startTime,
    };
  }

  async delete(key: string): Promise<void> {
    const entry = this.entries.get(key);
    if (entry && entry.coordinates) {
      const bucket = this.getSpatialBucket(entry.coordinates);
      const bucketEntries = this.spatialIndex.get(bucket);
      if (bucketEntries) {
        const index = bucketEntries.findIndex((e) => e.key === key);
        if (index !== -1) bucketEntries.splice(index, 1);
      }
    }
    this.entries.delete(key);
  }

  private getSpatialBucket(coordinates: [number, number, number]): string {
    const bucketSize = 10;
    return `${Math.floor(coordinates[0] / bucketSize)},${Math.floor(coordinates[1] / bucketSize)},${Math.floor(coordinates[2] / bucketSize)}`;
  }

  private euclideanDistance(a: [number, number, number], b: [number, number, number]): number {
    return Math.sqrt(
      Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)
    );
  }

  clear(): void {
    this.entries.clear();
    this.spatialIndex.clear();
  }

  size(): number {
    return this.entries.size;
  }
}

export const computableMemory = new ComputableMemoryStore();