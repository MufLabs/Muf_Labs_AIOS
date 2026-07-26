export class ServiceContainer {

    private readonly services =
        new Map<string, unknown>();

    /**
     * Registers a service.
     */
    public register<T>(
        name: string,
        service: T
    ): void {

        this.services.set(name, service);

    }

    /**
     * Resolves a registered service.
     */
    public resolve<T>(name: string): T {

        const service = this.services.get(name);

        if (service === undefined) {

            throw new Error(
                `Service '${name}' is not registered.`
            );

        }

        return service as T;

    }

    /**
     * Returns whether a service exists.
     */
    public has(name: string): boolean {

        return this.services.has(name);

    }

    /**
     * Removes a registered service.
     */
    public unregister(name: string): boolean {

        return this.services.delete(name);

    }

    /**
     * Removes all services.
     */
    public clear(): void {

        this.services.clear();

    }

    /**
     * Returns all registered service names.
     */
    public names(): string[] {

        return [...this.services.keys()];

    }

}