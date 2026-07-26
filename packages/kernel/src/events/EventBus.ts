type Handler<T = unknown> = (payload: T) => void;

export class EventBus {

    private readonly handlers = new Map<string, Set<Handler>>();

    /**
     * Registers an event handler.
     */
    public on<T>(
        event: string,
        handler: Handler<T>
    ): void {

        let handlers = this.handlers.get(event);

        if (!handlers) {

            handlers = new Set<Handler>();
            this.handlers.set(event, handlers);

        }

        handlers.add(handler as Handler);

    }

    /**
     * Registers a handler that will be executed only once.
     */
    public once<T>(
        event: string,
        handler: Handler<T>
    ): void {

        const wrapper: Handler<T> = (payload) => {

            this.off(event, wrapper);
            handler(payload);

        };

        this.on(event, wrapper);

    }

    /**
     * Removes an event handler.
     */
    public off<T>(
        event: string,
        handler: Handler<T>
    ): void {

        const handlers = this.handlers.get(event);

        if (!handlers) {
            return;
        }

        handlers.delete(handler as Handler);

        if (handlers.size === 0) {
            this.handlers.delete(event);
        }

    }

    /**
     * Emits an event.
     */
    public emit<T>(
        event: string,
        payload: T
    ): void {

        const handlers = this.handlers.get(event);

        if (!handlers) {
            return;
        }

        // Copy to avoid modifications while iterating.
        for (const handler of [...handlers]) {

            try {

                handler(payload);

            } catch {

                // Individual handlers must never stop the event pipeline.

            }

        }

    }

    /**
     * Removes every registered handler.
     */
    public clear(): void {

        this.handlers.clear();

    }

    /**
     * Returns whether an event has subscribers.
     */
    public has(event: string): boolean {

        return this.handlers.has(event);

    }

    /**
     * Returns the registered event names.
     */
    public events(): string[] {

        return [...this.handlers.keys()];

    }

}