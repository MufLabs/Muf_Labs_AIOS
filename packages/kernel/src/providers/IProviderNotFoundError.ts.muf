export class ProviderNotFoundError extends Error {

    /**
     * Identificador del proveedor solicitado.
     */
    public readonly providerId?: string;

    /**
     * Lista de proveedores disponibles.
     */
    public readonly availableProviders?: readonly string[];

    constructor(

        providerId?: string,

        availableProviders?: readonly string[]

    ) {

        const message = providerId

            ? availableProviders && availableProviders.length > 0

                ? `Provider '${providerId}' was not found. Available providers: ${availableProviders.join(", ")}.`

                : `Provider '${providerId}' was not found.`

            : "No AI provider has been registered.";

        super(

            message

        );

        this.name = "ProviderNotFoundError";

        this.providerId = providerId;

        this.availableProviders = availableProviders;

        Object.setPrototypeOf(

            this,

            ProviderNotFoundError.prototype

        );

    }

}