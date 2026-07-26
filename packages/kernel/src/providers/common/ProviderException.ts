export class ProviderException extends Error {

    public readonly statusCode?: number;

    public readonly provider?: string;

    public readonly cause?: unknown;

    constructor(

        message: string,

        provider?: string,

        statusCode?: number,

        cause?: unknown

    ) {

        super(message);

        this.name = "ProviderException";

        this.provider = provider;

        this.statusCode = statusCode;

        this.cause = cause;

    }

}