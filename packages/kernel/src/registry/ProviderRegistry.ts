import { IProvider } from "../providers";

import { IProviderRegistry } from "./IProviderRegistry";

export class ProviderRegistry implements IProviderRegistry {

    private readonly providers = new Map<string, IProvider>();

    public register(provider: IProvider): void {

        this.providers.set(provider.id, provider);

    }

    public unregister(id: string): boolean {

        return this.providers.delete(id);

    }

    public exists(id: string): boolean {

        return this.providers.has(id);

    }

    public get(id: string): IProvider | undefined {

        return this.providers.get(id);

    }

    public getAll(): readonly IProvider[] {

        return [...this.providers.values()];

    }

    public clear(): void {

        this.providers.clear();

    }

    public size(): number {

        return this.providers.size;

    }

    public ids(): string[] {

        return [...this.providers.keys()];

    }

}