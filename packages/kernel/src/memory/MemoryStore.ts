export class MemoryStore {

    private readonly memory =
        new Map<string, unknown>();

    public set(
        key: string,
        value: unknown
    ): void {

        this.memory.set(key, value);

    }

    public get<T>(
        key: string
    ): T | undefined {

        return this.memory.get(key) as T | undefined;

    }

    public has(
        key: string
    ): boolean {

        return this.memory.has(key);

    }

    public remove(
        key: string
    ): boolean {

        return this.memory.delete(key);

    }

    public keys(): string[] {

        return [...this.memory.keys()];

    }

    public size(): number {

        return this.memory.size;

    }

    public clear(): void {

        this.memory.clear();

    }

}